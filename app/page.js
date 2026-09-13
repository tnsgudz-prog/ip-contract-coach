// 루트 페이지에 Next.js 앱 래퍼 추가
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <Head>
        <title>계약서 1차 검토 & 협상 코칭</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <main>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
          <iframe src="/index.html" style={{ width: '100%', height: '100vh', border: 'none' }} />
        </div>
      </main>
    </div>
  );
}
