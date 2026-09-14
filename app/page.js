// 루트 페이지에 Next.js 앱 래퍼 추가
import Head from 'next/head';

export default function Home() {
  return (
    <div>
      <Head>
        <title>IP 계약 협상 코치</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="계약서 텍스트, 계약 유형, 내 입장을 입력하면 IP 관련 위험 조항을 분석해 드립니다." />
      </Head>
      <main>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
          <iframe src="/index.html" style={{ width: '100%', height: '100vh', border: 'none' }} />
        </div>
      </main>
    </div>
  );
}
