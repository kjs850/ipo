'use client';

import React, { useState, useEffect } from 'react';

interface RealEstateData {
    id: string;
    announcementNo: string;
    name: string;
    region: string;
    location: string;
    buildingType: string;
    announcementDate: string;
    subscriptionStartDate: string;
    subscriptionEndDate: string;
    winnerAnnouncementDate: string;
    contractStartDate?: string;
    contractEndDate?: string;
    moveInDate?: string;
    totalSupply: number;
    status: '예정' | '진행' | '마감';
    detailUrl?: string;
}

export default function RealEstateCalendar() {
    const [data, setData] = useState<RealEstateData[]>([]);
    const [loading, setLoading] = useState(true);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const itemRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/real-estate');
                const json = await res.json();
                const items = json.data || [];
                setData(items);

                setTimeout(() => {
                    scrollToCurrent(items);
                }, 100);
            } catch (e) {
                console.error('Failed to fetch real estate data', e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const scrollToCurrent = (items: RealEstateData[]) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let targetId = null;

        for (const item of items) {
            try {
                const endDate = new Date(item.subscriptionEndDate);
                if (endDate >= today) {
                    targetId = item.id;
                    break;
                }
            } catch (e) { }
        }

        if (targetId) {
            setHighlightedId(targetId);
            if (itemRefs.current[targetId]) {
                itemRefs.current[targetId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    const formatDateRange = (start: string, end: string) => {
        if (start === '-' || end === '-') return '-';
        const s = start.substring(5); // MM-DD
        const e = end.substring(5);
        return `${s} ~ ${e}`;
    };

    const formatDate = (date: string) => {
        if (date === '-') return '-';
        return date.substring(5); // MM-DD
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4 animate-fade-in" id="schedule">
            <div className="flex flex-col items-center justify-center mb-6 text-center space-y-3">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                    🏠 부동산 청약 일정
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                        From 청약홈
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border border-slate-700 transition-colors ${loading ? 'bg-yellow-500/10 text-yellow-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                        {loading ? '⏳ 업데이트 중...' : '✅ 실시간 최신화'}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-5">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="font-bold text-lg">청약 정보를 불러오는 중...</p>
                    </div>
                )}

                {!loading && data.length === 0 && (
                    <div className="text-center py-20 text-gray-400 font-bold bg-slate-800 rounded-3xl border border-slate-700">
                        예정된 청약 일정이 없습니다.
                    </div>
                )}

                {data.map((item, idx) => {
                    const isHighlighted = highlightedId === item.id;
                    return (
                        <div
                            key={`${item.id}-${idx}`}
                            ref={(el) => { if (el) itemRefs.current[item.id] = el; }}
                            className={`relative overflow-hidden rounded-[2rem] transition-all duration-300 group ${isHighlighted
                                ? 'bg-slate-800 ring-2 ring-emerald-400 shadow-[0_0_40px_-5px_rgba(52,211,153,0.3)] z-10'
                                : 'bg-slate-800/80 border border-slate-700/50 hover:bg-slate-800 hover:border-emerald-500/50'
                                }`}
                        >
                            {isHighlighted && (
                                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
                            )}

                            <div className="relative z-10 p-6 flex flex-col gap-6">
                                {/* Header */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`px-3 py-1 rounded-md text-xs font-black tracking-wide border ${item.status === '마감'
                                            ? 'bg-slate-700 text-slate-400 border-slate-600'
                                            : item.status === '진행'
                                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/50'
                                                : 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/50'
                                            }`}>
                                            {item.status}
                                        </span>
                                        <span className="text-xs font-bold text-gray-400 bg-slate-900/50 px-3 py-1 rounded-md border border-slate-700">
                                            🏢 {item.buildingType}
                                        </span>
                                        {item.region && (
                                            <span className="text-xs font-bold text-gray-400 bg-slate-900/50 px-3 py-1 rounded-md border border-slate-700">
                                                📍 {item.region}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                                        {item.name}
                                    </h3>
                                    {item.location && (
                                        <p className="text-sm text-gray-400 font-medium">
                                            {item.location}
                                        </p>
                                    )}
                                </div>

                                <div className="h-px w-full bg-slate-700/50" />

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* 공급세대수 */}
                                    <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/50 flex flex-col items-center justify-center text-center gap-1">
                                        <span className="text-xs font-bold text-gray-400">공급세대수</span>
                                        <span className="text-3xl font-black font-mono tracking-tighter text-white">
                                            {item.totalSupply.toLocaleString()}
                                        </span>
                                        <span className="text-xs text-gray-500">세대</span>
                                    </div>

                                    {/* 청약기간 */}
                                    <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/50 flex flex-col items-center justify-center text-center gap-1">
                                        <span className="text-xs font-bold text-gray-400">청약기간</span>
                                        <span className="text-lg font-black font-mono tracking-tight text-emerald-400">
                                            {formatDateRange(item.subscriptionStartDate, item.subscriptionEndDate)}
                                        </span>
                                    </div>

                                    {/* 당첨발표 */}
                                    <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/50 flex flex-col items-center justify-center text-center gap-1">
                                        <span className="text-xs font-bold text-gray-400">당첨발표</span>
                                        <span className="text-lg font-black font-mono tracking-tight text-indigo-400">
                                            {formatDate(item.winnerAnnouncementDate)}
                                        </span>
                                    </div>
                                </div>

                                {/* 추가 정보 */}
                                <div className="bg-slate-900/30 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center text-sm border border-slate-700/50">
                                    {item.moveInDate && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></div>
                                            <span className="text-xs font-bold text-amber-300">입주예정</span>
                                            <span className="font-bold text-white font-mono">{item.moveInDate}</span>
                                        </div>
                                    )}

                                    {item.detailUrl && (
                                        <a
                                            href={item.detailUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                                        >
                                            상세공고 보기 →
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="h-24" />
        </div>
    );
}
