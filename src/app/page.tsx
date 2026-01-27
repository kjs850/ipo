import IPOCalendar from '@/components/IPOCalendar';
import Navbar from '@/components/Navbar';

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="container py-8 space-y-8 pb-20">

        {/* Header Section */}
        <section className="text-center py-10 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            성공적인 공모주 투자의 시작
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            정확한 수요예측 분석과 일정 관리로 당신의 투자를 가이드합니다.
          </p>
        </section>

        {/* Dashboard Grid */}
        <div className="max-w-5xl mx-auto space-y-8">
          <IPOCalendar />
        </div>
      </div>
    </>
  );
}
