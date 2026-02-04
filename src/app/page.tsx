'use client';

import { useState } from 'react';
import IPOCalendar from '@/components/IPOCalendar';
import RealEstateCalendar from '@/components/RealEstateCalendar';
import CommodityPrices from '@/components/CommodityPrices';
import TabSelector from '@/components/TabSelector';
import Navbar from '@/components/Navbar';

type TabType = 'ipo' | 'real-estate' | 'commodities';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('ipo');

  const headerContent: Record<TabType, { title: string; subtitle: string; description: string; gradient: string; badgeColor: string }> = {
    ipo: {
      title: '공모주 투자의 시작',
      subtitle: 'IPO CALENDAR',
      description: '수요예측 분석과 청약 일정을 한눈에',
      gradient: 'from-indigo-400 via-purple-400 to-indigo-400',
      badgeColor: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10'
    },
    'real-estate': {
      title: '내 집 마련의 첫 걸음',
      subtitle: 'REAL ESTATE',
      description: '전국 아파트 청약 일정을 한눈에',
      gradient: 'from-emerald-400 via-teal-400 to-emerald-400',
      badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    },
    commodities: {
      title: '원자재 시세',
      subtitle: 'COMMODITIES',
      description: '금, 은, 원유 등 주요 원자재 실시간 시세',
      gradient: 'from-amber-400 via-yellow-400 to-amber-400',
      badgeColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10'
    }
  };

  const content = headerContent[activeTab];

  const renderContent = () => {
    switch (activeTab) {
      case 'ipo':
        return <IPOCalendar />;
      case 'real-estate':
        return <RealEstateCalendar />;
      case 'commodities':
        return <CommodityPrices />;
      default:
        return <IPOCalendar />;
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-6 space-y-6 pb-20">

        {/* Hero Section */}
        <section className="text-center py-8 space-y-4">
          <div className="inline-block mb-2">
            <span className={`text-xs font-bold tracking-[0.3em] px-4 py-2 rounded-full border ${content.badgeColor}`}>
              {content.subtitle}
            </span>
          </div>
          <h1 className={`text-4xl md:text-6xl font-black bg-gradient-to-r ${content.gradient} bg-clip-text text-transparent leading-tight`}>
            {content.title}
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            {content.description}
          </p>
        </section>

        {/* Tab Selector */}
        <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Dashboard */}
        <div className="max-w-5xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </>
  );
}
