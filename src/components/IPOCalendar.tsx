'use client';

import React, { useState, useEffect } from 'react';

export default function IPOCalendar() {
    const [ipoData, setIpoData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const itemRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/ipo');
                const json = await res.json();
                const data = json.data || [];
                setIpoData(data);

                // Wait for render then scroll
                setTimeout(() => {
                    scrollToCurrent(data);
                }, 100);
            } catch (e) {
                console.error("Failed to fetch IPO data", e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const scrollToCurrent = (data: any[]) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find first item where EndDate >= Today
        let targetId = null;

        for (const item of data) {
            try {
                // Parse dates
                let dateStr = item.schedule;
                if (dateStr.includes('~')) {
                    dateStr = dateStr.split('~')[1]; // Use end date
                }

                const finishDate = parseDateString(item.schedule);
                if (finishDate && finishDate >= today) {
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

    const parseDateString = (str: string) => {
        try {
            const parts = str.split('~');
            let endPart = parts[parts.length - 1].trim();
            if (endPart.length <= 5 && parts.length > 1) {
                const startYear = parts[0].split('.')[0];
                endPart = `${startYear}.${endPart}`;
            }
            return new Date(endPart.replace(/\./g, '-'));
        } catch { return null; }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4 animate-fade-in" id="schedule">
            <div className="flex flex-col items-center justify-center mb-6 text-center space-y-3">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                    📅 공모주 청약 일정
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                        From 38.co.kr
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
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="font-bold text-lg">데이터를 분석하고 있습니다...</p>
                    </div>
                )}

                {!loading && ipoData.length === 0 && (
                    <div className="text-center py-20 text-gray-400 font-bold bg-slate-800 rounded-3xl border border-slate-700">
                        예정된 일정이 없습니다.
                    </div>
                )}

                {ipoData.map((ipo, idx) => {
                    const isHighlighted = highlightedId === ipo.id;
                    return (
                        <div
                            key={`${ipo.name}-${idx}`}
                            ref={(el) => { if (el) itemRefs.current[ipo.id] = el; }}
                            className={`relative overflow-hidden rounded-[2rem] transition-all duration-300 group ${isHighlighted
                                ? 'bg-slate-800 ring-2 ring-cyan-400 shadow-[0_0_40px_-5px_rgba(34,211,238,0.3)] z-10'
                                : 'bg-slate-800/80 border border-slate-700/50 hover:bg-slate-800 hover:border-indigo-500/50'
                                }`}
                        >
                            {/* Decorative background for highlighted items */}
                            {isHighlighted && (
                                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
                            )}

                            <div className="relative z-10 p-6 flex flex-col gap-6">
                                {/* Header: Name & Status */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`px-3 py-1 rounded-md text-xs font-black tracking-wide border ${ipo.status.includes('완료')
                                            ? 'bg-slate-700 text-slate-400 border-slate-600'
                                            : ipo.status.includes('진행')
                                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/50'
                                                : 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/50'
                                            }`}>
                                            {ipo.status}
                                        </span>
                                        {ipo.underwriter && (
                                            <span className="text-xs font-bold text-gray-400 bg-slate-900/50 px-3 py-1 rounded-md border border-slate-700">
                                                🏢 {ipo.underwriter}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-3xl font-black text-white tracking-tight leading-tight">
                                        {ipo.name}
                                    </h3>
                                </div>

                                {/* Divider */}
                                <div className="h-px w-full bg-slate-700/50" />

                                {/* Metrics Mesh Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* Price */}
                                    <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/50 flex flex-col items-center justify-center text-center gap-1">
                                        <span className="text-xs font-bold text-gray-400">확정 공모가</span>
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs text-gray-600 line-through mb-1 font-medium">{ipo.hopePrice}</span>
                                            <div className="flex items-center gap-1">
                                                <span className={`text-3xl font-black font-mono tracking-tighter ${ipo.confirmedPrice ? 'text-white' : 'text-gray-600'}`}>
                                                    {ipo.confirmedPrice || "미정"}
                                                </span>
                                                {ipo.isGoodPrice && <span className="animate-pulse" title="밴드 상단">🔥</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Competition */}
                                    <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/50 flex flex-col items-center justify-center text-center gap-1">
                                        <span className="text-xs font-bold text-gray-400">기관 경쟁률</span>
                                        <div className="flex items-center gap-1">
                                            <span className={`text-3xl font-black font-mono tracking-tight ${ipo.competitionRate ? 'text-indigo-400' : 'text-gray-600'}`}>
                                                {ipo.competitionRate || "-"}
                                            </span>
                                            {ipo.isGoodComp && <span className="text-yellow-400 text-[10px] font-black border border-yellow-400/30 px-1 rounded ml-1">HOT</span>}
                                        </div>
                                    </div>

                                    {/* Lockup */}
                                    <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/50 flex flex-col items-center justify-center text-center gap-1">
                                        <span className="text-xs font-bold text-gray-400">의무보유확약</span>
                                        <div className="flex items-center gap-1">
                                            <span className={`text-3xl font-black font-mono tracking-tight ${ipo.lockupRatio ? 'text-emerald-400' : 'text-gray-600'}`}>
                                                {ipo.lockupRatio || "-"}
                                            </span>
                                            {ipo.isGoodLockup && <span className="text-emerald-400 text-[10px] font-black border border-emerald-400/30 px-1 rounded ml-1">GOOD</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Schedule Footer */}
                                <div className="bg-slate-900/30 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center text-sm border border-slate-700/50">
                                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]"></div>
                                            <span className="text-xs font-bold text-indigo-300">수요예측</span>
                                        </div>
                                        <span className="font-bold text-white text-lg font-mono pl-4">{ipo.schedule}</span>
                                    </div>

                                    {ipo.subscriptionSchedule && (
                                        <>
                                            <div className="hidden sm:block w-px h-10 bg-slate-700/50"></div>
                                            <div className="flex flex-col gap-1 w-full sm:w-auto border-t sm:border-t-0 border-slate-700/50 pt-3 sm:pt-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                                                    <span className="text-xs font-bold text-emerald-300">청약일정</span>
                                                </div>
                                                <span className="font-bold text-white text-lg font-mono pl-4">{ipo.subscriptionSchedule}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="h-24" /> {/* Bottom Spacer */}
        </div>
    );
}
