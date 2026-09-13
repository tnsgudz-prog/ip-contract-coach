// api/analyze.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { contract_text, contract_type, my_position, concern } = body;

    if (!contract_text || !contract_type || !my_position) {
      return NextResponse.json(
        { error: '필수 입력값이 누락되었습니다. (contract_text, contract_type, my_position)' },
        { status: 400 }
      );
    }

    // Upstage API 키 확인
    const apiKey = process.env.UPSTAGE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: '서버 설정 오류: API 키가 없습니다.' },
        { status: 500 }
      );
    }

    // 계약서 분석을 위한 프롬프트 구성
    const prompt = `
[시스템]
당신은 IP 계약 협상 코치입니다. 계약서 텍스트, 계약 유형, 내 입장(IP를 주는 입장/받는 입장/주고받는 입장)을 받아 IP 관련 위험 조항을 분석하고, 협상 포인트를 제안하세요.

[입력]
계약서 텍스트: ${contract_text}
계약 유형: ${contract_type}
내 입장: ${my_position}
핵심 우려점: ${concern || '없음'}

[출력 형식]
다음 JSON 형식으로 출력하세요:
{
  "risk_level": "높음" | "중간" | "낮음",
  "is_dealbreaker": true | false,
  "risk_summary": "전체 위험도 요약",
  "clauses": [
    {
      "title": "조항 제목",
      "issue_type": "쟁점 유형",
      "risk_direction": "위험 방향",
      "risk_level": "높음" | "중간" | "낮음",
      "max_benefit": "최대이득안",
      "middle_compromise": "중간 절충안",
      "minimum_line": "최소사수선",
      "rationale": "제시 근거",
      "negotiation_point": "협상 포인트",
      "tags": ["사수" | "양보 가능" | "트레이드오프"]
    }
  ],
  "negotiation_strategy": "전체 협상 전략 요약",
  "redline_text": "수정 조문 텍스트 (1-Click Redline용)",
  "disclaimer": "면책 안내 문구"
}

[분석 기준]
- 전체 위험도: 높음/중간/낮음 중 하나로만 표시
- 딜브레이커 여부: IP 이전이 내 입장에 불리하게 광범위하거나, 손해배상액이 무제한/무제한에 가깝거나, 그 밖에 내 핵심 IP를 위협하는 단독 고위험 조항이 있는 경우 true
- 조항별 분석: 조항 위치/내용, 쟁점 유형, 위험 방향, 위험도, 3단계 수정안, 제시 근거, 협상 포인트, 전략 태그
- 3단계 수정안: 최대이득안, 중간 절충안, 최소사수선
- 전략은 한 문단으로 요약
- 면책 안내 문구 포함
`;

    // Upstage API 호출
    const response = await fetch('https://api.upstage.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'solar-pro',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: `Upstage API 오류: ${errorData.error.message || '알 수 없는 오류'}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // JSON 파싱 시도
    let result;
    try {
      // JSON만 추출
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // JSON이 아니면 전체 텍스트를 사용
        result = {
          risk_level: '중간',
          is_dealbreaker: false,
          risk_summary: content,
          clauses: [],
          negotiation_strategy: content,
          redline_text: '',
          disclaimer: '이 결과는 법률 자문을 대체하지 않습니다. 실제 효력·해석·관할은 계약 문언과 상황을 함께 본 전문가 검토가 필요합니다.'
        };
      }
    } catch (e) {
      result = {
        risk_level: '중간',
        is_dealbreaker: false,
        risk_summary: content,
        clauses: [],
        negotiation_strategy: content,
        redline_text: '',
        disclaimer: '이 결과는 법률 자문을 대체하지 않습니다. 실제 효력·해석·관할은 계약 문언과 상황을 함께 본 전문가 검토가 필요합니다.'
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: '서버 내부 오류: ' + error.message },
      { status: 500 }
    );
  }
}
