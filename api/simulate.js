// api/simulate.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { analysis_data, user_reply } = body;

    if (!analysis_data || !user_reply) {
      return NextResponse.json(
        { error: '필수 입력값이 누락되었습니다. (analysis_data, user_reply)' },
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

    // 협상 시뮬레이션을 위한 프롬프트 구성
    const prompt = `
[시스템]
당신은 IP 계약 협상장에서 상대방(계약 상대 회사 담당자) 역할을 맡아, 사용자의 답변에 대해 피드백을 제공하는 협상 코칭 AI입니다.

[분석 결과 요약]
${JSON.stringify(analysis_data, null, 2)}

[사용자 답장]
${user_reply}

[역할]
1. 먼저, 상대방(계약 상대 회사 담당자) 역할을 맡아 사용자의 답장에 대한 반박 메시지를 1-2문장으로 작성하세요.
2. 그 다음, 협상 코치로서 사용자의 답장에 대해 다음 관점에서 피드백과 조언을 제공하세요:
   - 설득력: 사용자의 답변이 얼마나 설득력 있는가 (높음/중간/낮음)
   - 강점: 사용자의 답변에서 좋은 점
   - 약점: 사용자의 답변에서 보완할 점
   - 대안: 다음 단계에서 사용할 수 있는 유용한 대안 또는 수정 방향
3. 전체 응답은 한국어로 작성하세요.

[출력 형식]
다음 JSON 형식으로 출력하세요:
{
  "opponent_rebuttal": "상대방 반박 메시지",
  "feedback": "피드백 및 조언 (설득력, 강점, 약점, 대안 포함)",
  "alternatives": "다음 유용한 대안 또는 수정 방향"
}
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
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = {
          opponent_rebuttal: content,
          feedback: '분석 결과가 부족합니다.',
          alternatives: ''
        };
      }
    } catch (e) {
      result = {
        opponent_rebuttal: content,
        feedback: '분석 결과가 부족합니다.',
        alternatives: ''
      };
    }

    // 피드백/반박/대안이 객체면 문자열로 안전하게 변환
    if (result.feedback && typeof result.feedback !== 'string') {
      result.feedback = Object.prototype.toString.call(result.feedback) === '[object Object]'
        ? Object.entries(result.feedback).map(([k, v]) => `${k}: ${v}`).join(' | ')
        : String(result.feedback);
    }
    if (result.opponent_rebuttal && typeof result.opponent_rebuttal !== 'string') {
      result.opponent_rebuttal = String(result.opponent_rebuttal);
    }
    if (result.alternatives && typeof result.alternatives !== 'string') {
      result.alternatives = String(result.alternatives);
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: '서버 내부 오류: ' + error.message },
      { status: 500 }
    );
  }
}
