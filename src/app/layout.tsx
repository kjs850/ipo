import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IPO PLUS | 실시간 공모주 청약 일정 & 분석',
  description: '실시간 공모주 청약 일정, 수요예측 결과, 경쟁률 분석을 한눈에 확인하세요. 성공적인 투자를 위한 IPO 대시보드.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-[20%] left-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <main className="relative z-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
