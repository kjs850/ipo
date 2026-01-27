'use client';

import React, { useState, useEffect } from 'react';

export default function IPOCalendar() {
    const [ipoData, setIpoData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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
        // Schedule format: "YYYY.MM.DD" or "YYYY.MM.DD~MM.DD"
        let targetId = null;

        for (const item of data) {
            try {
                // Parse dates
                let dateStr = item.schedule;
                if (dateStr.includes('~')) {
                    dateStr = dateStr.split('~')[1]; // Use end date
                    // handle "MM.DD" part if separate year logic needed? 
                    // Usually crawling returns full "YYYY.MM.DD" for start, 
                    // and sometimes shortened for end.
                    // But our crawler parseDate logic handles simple cases. 
                    // Let's rely on string comparison or basic parsing helper if possible.
                    // Actually, let's just use the crawler's raw string and try to be robust.
                    // Or better: The crawler sorted them by date. 
                    // We just need the first item that is NOT in the past (Status not '완료'?)
                    // Actually, date comparison is safer.
                }

                // Let's assume the crawler is sorted Ascending.
                // We want the first item that is typically "Today or Future".
                // Simple heuristic: If status contains "예정" or "진행", it's a good candidate.
                // Or compare date.
                const finishDate = parseDateString(item.schedule);
                if (finishDate && finishDate >= today) {
                    targetId = item.id;
                    break;
                }
            } catch (e) { }
        }

        if (targetId && itemRefs.current[targetId]) {
            itemRefs.current[targetId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const parseDateString = (str: string) => {
        // "2026.01.20" or "2026.01.20~01.21"
        try {
            const parts = str.split('~');
            let endPart = parts[parts.length - 1].trim();
            // If endPart is just "01.21", need to prepend Year from startPart
            if (endPart.length <= 5 && parts.length > 1) {
                const startYear = parts[0].split('.')[0];
                endPart = `${startYear}.${endPart}`;
            }
            return new Date(endPart.replace(/\./g, '-'));
        } catch { return null; }
    };

    return (
        <div className="glass-panel p-6 animate-fade-in" id="schedule">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    📅 공모주 청약 일정 (From 38.co.kr)
                </h2>
                <span className="text-sm text-gray-400">
                    {loading ? '데이터 불러오는 중...' : '실시간 업데이트'}
                </span>
            </div>

            <div className="grid gap-4">
                {loading && <div className="text-center py-10 text-gray-500">데이터를 크롤링 중입니다...</div>}

                {!loading && ipoData.length === 0 && (
                    <div className="text-center py-10 text-gray-500">예정된 공모주 일정이 없습니다.</div>
                )}

                {ipoData.map((ipo, idx) => (
                    <div
                        key={`${ipo.name}-${idx}`}
                        ref={(el) => { if (el) itemRefs.current[ipo.id] = el; }}
                        className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-indigo-500/30 transition-all group"
                    >
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold group-hover:text-indigo-400 transition-colors">{ipo.name}</h3>
                                    <span className={`badge whitespace-nowrap ${ipo.status.includes('완료') ? 'badge-blue' : 'badge-green'}`}>{ipo.status}</span>
                                </div>
                                <div className="text-sm text-gray-400 space-y-1">
                                    <p>희망공모가 : {ipo.hopePrice}</p>
                                    <p className="flex items-center gap-1">
                                        확정공모가 : <span className="text-white font-medium">{ipo.confirmedPrice || "-"}</span>
                                        {ipo.isGoodPrice && <span className="text-yellow-400 text-xs" title="밴드 상단 이상">⭐</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:flex md:flex-row md:gap-4 gap-2 w-full md:w-auto mt-2 md:mt-0">
                                <div className="px-3 py-2 bg-slate-900/50 rounded-lg relative flex flex-col justify-center items-center">
                                    <div className="text-xs text-gray-500 mb-1 whitespace-nowrap">기관 경쟁률</div>
                                    <div className="font-mono font-bold text-indigo-400 flex items-center justify-center gap-1 text-sm md:text-base">
                                        {ipo.competitionRate || "-"}
                                        {ipo.isGoodComp && <span className="text-yellow-400 text-xs" title="경쟁률 450:1 이상">⭐</span>}
                                    </div>
                                </div>

                                <div className="px-3 py-2 bg-slate-900/50 rounded-lg relative flex flex-col justify-center items-center">
                                    <div className="text-xs text-gray-500 mb-1 whitespace-nowrap">의무보유확약</div>
                                    <div className="font-mono font-bold text-emerald-400 flex items-center justify-center gap-1 text-sm md:text-base">
                                        {ipo.lockupRatio || "-"}
                                        {ipo.isGoodLockup && <span className="text-yellow-400 text-xs" title="확약 15% 이상">⭐</span>}
                                    </div>
                                </div>

                                {ipo.underwriter && (
                                    <div className="px-3 py-2 bg-slate-900/50 rounded-lg hidden md:flex flex-col justify-center items-center">
                                        <div className="text-xs text-gray-500 mb-1 whitespace-nowrap text-center w-full">주간사</div>
                                        <div className="font-mono text-xs text-gray-300 max-w-[120px] truncate text-center" title={ipo.underwriter}>{ipo.underwriter}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm border-t border-slate-700/50 pt-3">
                            <div>
                                <span className="text-gray-500 text-xs mr-2">수요예측 일정 : </span>
                                <span className="font-medium text-white">{ipo.schedule}</span>
                            </div>
                            <div>
                                {ipo.subscriptionSchedule && (
                                    <>
                                        <span className="text-gray-500 text-xs mr-2">청약 일정 : </span>
                                        <span className="font-medium text-white">{ipo.subscriptionSchedule}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
