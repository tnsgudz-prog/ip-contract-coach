export const metadata = {
  title: 'IP 계약 협상 코치',
  description: '계약서 텍스트, 계약 유형, 내 입장을 입력하면 IP 관련 위험 조항을 분석해 드립니다.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
