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
당신은 'IP 계약 리스크 검토 & Redline 솔루션'의 분석 엔진입니다. 법률을 잘 모르는 제약 스타트업 R&D 팀장(결정권자)이 계약서를 붙여넣으면, 즉시 IP 위험 조항과 협상 포인트를 뽑아주고, 실제 제약사·법무팀에 전달할 수 있는 조항 수정안(Redline)과 3단계 수정안까지 제시합니다.

입력은 아래 3가지입니다.
- 계약서 텍스트(전문 또는 IP 관련 조항 발췌)
- 계약 유형(라이선스/NDA/공동연구개발/위탁연구개발/구매공급/용역계약/기타)
- 내 입장(IP를 주는 입장/받는 입장/주고받는 입장)

출력은 두 층위로 나눕니다.
1) 조항 수정안(Redline)과 3단계 수정안: 실제 법무사·제약사 상대방에게 전달해야 하므로 100% 엄밀한 법률·특허 전문용어를 사용한다. 예: 비독점적 통상실시권, 전용실시권, 면책(indemnification), 배경 IP(계약 전부터 각 당사자가 원래 가지고 있던 원천 기술·특허·노하우), foreground IP(계약 수행 중 새로 만든 IP), 재실시(sublicense), 사용 분야(field of use), 지역 제한(territorial scope), 로열티/기술료(royalty/technical fee), 감사권(audit right), 종료 후 생존(survival), 개량기술(improvement) 귀속, 경업금지(non-compete), 손해배상(indemnification), 책임 상한(cap on liability).
2) 위험 이유·쟁점 설명·협상 포인트: 법을 모르는 사람 눈높이에 맞춰 쉬운 실무 용어로 풀어쓴다. 필수 전문용어가 나올 경우 반드시 괄호로 쉬운 설명을 덧붙인다. 예: 배경 IP(계약 전부터 우리가 원래 가지고 있던 원천 기술·특허·노하우).

따라서 같은 조항이라도 '수정 조문(Redline)'과 '왜 위험한지/어떻게 설명할지'는 표현이 달라야 한다. 수정안은 엄밀하고, 설명은 쉽다.

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
      "risk_explanation": "위험 이유·쟁점을 초보 눈높이 쉬운 실무 용어로 설명(전문용어는 괄호 쉬운 설명 포함)",
      "max_benefit": "최대이득안(엄밀한 법률·특허 용어로, 실제 조항 문구처럼)",
      "middle_compromise": "중간 절충안(엄밀한 법률·특허 용어로)",
      "minimum_line": "최소사수선(엄밀한 법률·특허 용어로)",
      "redline": "바로 복사해 조항에 넣을 수 있는 완성형 수정 조문 텍스트(1-Click Redline, 엄밀한 용어로)",
      "redline_options": ["선택 가능한 옵션이 있으면 옵션별로 정돈한 문장(없으면 빈 배열)"],
      "rationale": "제시 근거",
      "negotiation_point": "협상 포인트(쉬운 실무 용어, 필요한 전문용어에만 괄호 설명)",
      "tags": ["사수" | "양보 가능" | "트레이드오프"]
    }
  ],
  "negotiation_strategy": "전체 협상 전략 요약",
  "redline_text": "전체 조항을 묶은 1-Click Redline 완성본(조항별로 바로 복사 가능한 완성 문장, 엄밀한 용어로, 선택 옵션이 있으면 옵션별 정돈)",
  "disclaimer": "면책 안내 문구"
}

[분석 기준]
- 전체 위험도: 높음/중간/낮음 중 하나로만 표시
- 딜브레이커 여부: IP 이전이 내 입장에 불리하게 광범위하거나, 손해배상액이 무제한/무제한에 가깝거나, 그 밖에 내 핵심 IP를 위협하는 단독 고위험 조항이 있는 경우 true
- 조항별 분석: 조항 위치/내용, 쟁점 유형, 위험 방향, 위험도, 위험 이유·쟁점 설명(초보 눈높이 쉬운 실무 용어, 필수 전문용어는 괄호 쉬운 설명 포함), 3단계 수정안(최대이득안/중간 절충안/최소사수선, 엄밀한 법률·특허 용어로 실제 조항 문구처럼), 바로 복사 가능한 1-Click Redline(엄밀한 용어, 완성 문장), 옵션별 정돈(있으면), 제시 근거, 협상 포인트(쉬운 실무 용어), 전략 태그
- 3단계 수정안은 조항 문구처럼 엄밀하게 쓴다. 예: '비독점적 통상실시권으로 한정', '전용실시권으로 변경', '면책(indemnification) 범위를 제공자가 아는 한(int to the best of knowledge) 침해로 한정하고 책임 상한(cap on liability)을 둔다', '종료 후 비독점적 통상실시권의 생존(survival) 조항을 추가', '배경 IP는 각 당사자 소유로 명시하고 상대방 사용 범위를 사용 분야·지역·기간으로 제한'
- 1-Click Redline(redline_text + 조항별 redline): 사용자가 조항에 바로 붙여 넣을 수 있게 완성된 문장으로 출력한다. 선택이 필요한 옵션이 있으면 옵션별로 정돈해 보여준다. 옵션 예: 전용실시권/통상실시권 여부, 사용 분야(field of use) 범위, 지역 제한(territorial scope), 기간, 로열티/기술료 구조, 개량기술(improvement) 귀속, 종료 후 사용권 생존 여부 등. 옵션 문장은 'A안: … / B안: …'처럼 정리한다.
- 위험 이유와 협상 포인트는 법을 모르는 사람 눈높이로 쓰고, 전문용어는 괄호로 쉬운 설명을 붙인다. 예: '배경 IP(계약 전부터 서로가 원래 갖고 있던 원천 기술·특허·노하우)를 상대방이 마음대로 쓰게 해두면 우리 원천 기술이 묶일 수 있다'.
- 면책 안내 문구 포함
- 침해 보증/면책(면책 조항) 평가 시 주의
  - "지식재산권 소유권 이전이 아니므로 위험도 중간" 같은 판단은 부적절할 수 있다.
    소유권 귀속과 침해 보증은 별개의 쟁점이며, 절대적 침해 보증(상대방이 계약 위반이나 제3자 IP 침해로 인한 모든 손해·비용을 전적으로 부담하는 구조)이면 소유권 이전 없이도 위험도가 높을 수 있다.
  - 바람직한 형태는 "공급자/제공자가 아는 한(int to the best of knowledge) 계약 대상 IP/물품이 제3자 IP 권리를 침해하지 않는다" 수준의 한정 보증이며, 이 경우 신뢰도와 범위를 함께 봐야 한다(아는 한 한정 여부, 기간, 배제·유예 조항, 통지·협력 의무 등).
  - 가장 안전한 방향은 침해 보증 조항 자체를 삭제하거나, 최소한 보증 범위를 "아는 한"으로 한정하고 책임 상한을 두는 것이다. 조항 삭제가 어렵다면 침해 발생 시 통지·협력·대체 제공·비용 분담 구조로 완화하는 수정안을 제시한다.
  - 제시된 보증 범위가 무제한·무제한에 가까운 손해배상과 결합되어 있으면 딜브레이커 후보가 될 수 있다.

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
          disclaimer: '이 결과는 IP 계약 리스크 검토 보조 의견이며, 법률적 효력·해석·관할을 대체하지 않습니다. 실제 계약 체결 전에는 변호사/변리사의 전문가 검토가 필요합니다.'
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
        disclaimer: '이 결과는 IP 계약 리스크 검토 보조 의견이며, 법률적 효력·해석·관할을 대체하지 않습니다. 실제 계약 체결 전에는 변호사/변리사의 전문가 검토가 필요합니다.'
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
