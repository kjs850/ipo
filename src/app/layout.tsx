import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '공모주 가이드 | IPO Data & Calculators',
  description: '대한민국 공모주 투자 전문가, 데이터 분석 가이드. 일정, 경쟁률, 수익 시뮬레이션 제공.',
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
