/** @type {import('next').Config} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'export', // 정적 내보내기 사용 (Vercel 서버리스 배포에서는 주석 처리)
  images: {
    unoptimized: true, // 외부 이미지 최적화 비활성화
  },
};

module.exports = nextConfig;
