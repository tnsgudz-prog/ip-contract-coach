// api/config.js
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // EXPERT_CONSULT_LINK_URL만 클라이언트에 전달 (UPSTAGE_API_KEY는 절대 노출 금지)
    const expertConsultLinkUrl = process.env.EXPERT_CONSULT_LINK_URL || 'https://www.lawtalk.co.kr';
    
    return NextResponse.json({
      expertConsultLinkUrl: expertConsultLinkUrl
    });
  } catch (error) {
    return NextResponse.json(
      { error: '서버 내부 오류: ' + error.message },
      { status: 500 }
    );
  }
}
