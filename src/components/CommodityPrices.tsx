'use client';

import React, { useState, useEffect } from 'react';

interface CommodityData {
    symbol: string;
    name: string;
    nameEn: string;
    price: number;
    currency: string;
    unit: string;
    unitFull: string;
    icon: string;
    updatedAt: string;
}

export default function CommodityPrices() {
    const [data, setData] = useState<CommodityData[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string>('');

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/commodities');
                const json = await res.json();
                const items = json.data || [];
                setData(items);
                setLastUpdated(json.updatedAt || '');
            } catch (e) {
                console.error('Failed to fetch commodity data', e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const formatPrice = (price: number) => {
        return price.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const getTimeAgo = (dateStr: string) => {
        if (!dateStr) return '';
        const now = new Date();
        const updated = new Date(dateStr);
        const diffMs = now.getTime() - updated.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return '방금 전';
        if (diffMin < 60) return `${diffMin}분 전`;
        const diffHour = Math.floor(diffMin / 60);
        return `${diffHour}시간 전`;
    };

    const containerStyle: React.CSSProperties = {
        width: '100%',
        maxWidth: '42rem',
        margin: '0 auto',
        padding: '1rem',
    };

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem',
        textAlign: 'center',
        gap: '0.75rem',
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '1.5rem',
        fontWeight: 900,
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    };

    const badgeContainerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    };

    const badgeStyle: React.CSSProperties = {
        fontSize: '0.75rem',
        fontWeight: 700,
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        border: '1px solid #334155',
    };

    const gridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
    };

    const cardStyle: React.CSSProperties = {
        backgroundColor: '#1e293b',
        borderRadius: '1.5rem',
        padding: '1.5rem',
        border: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s',
    };

    const iconStyle: React.CSSProperties = {
        fontSize: '2.5rem',
        marginBottom: '0.25rem',
    };

    const nameStyle: React.CSSProperties = {
        fontSize: '1rem',
        fontWeight: 700,
        color: '#ffffff',
    };

    const nameEnStyle: React.CSSProperties = {
        fontSize: '0.75rem',
        color: '#64748b',
        marginTop: '-0.25rem',
    };

    const priceStyle: React.CSSProperties = {
        fontSize: '1.75rem',
        fontWeight: 800,
        color: '#ffffff',
        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        marginTop: '0.5rem',
    };

    const unitStyle: React.CSSProperties = {
        fontSize: '0.875rem',
        color: '#94a3b8',
        marginTop: '-0.25rem',
    };

    const loadingStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5rem 0',
        color: '#94a3b8',
        gap: '0.75rem',
    };

    const spinnerStyle: React.CSSProperties = {
        width: '2.5rem',
        height: '2.5rem',
        border: '4px solid #f59e0b',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    };

    const emptyStyle: React.CSSProperties = {
        textAlign: 'center',
        padding: '5rem 0',
        color: '#94a3b8',
        fontWeight: 700,
        backgroundColor: '#1e293b',
        borderRadius: '1.5rem',
        border: '1px solid #334155',
    };

    return (
        <div style={containerStyle}>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @media (min-width: 768px) {
                    .commodity-grid {
                        grid-template-columns: repeat(3, 1fr) !important;
                    }
                }
            `}</style>

            <div style={headerStyle}>
                <h2 style={titleStyle}>
                    📊 원자재 시세
                </h2>
                <div style={badgeContainerStyle}>
                    <span style={{ ...badgeStyle, backgroundColor: 'rgba(30, 41, 59, 1)', color: '#94a3b8' }}>
                        API Ninjas
                    </span>
                    <span style={{
                        ...badgeStyle,
                        backgroundColor: loading ? 'rgba(234, 179, 8, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: loading ? '#eab308' : '#10b981',
                    }}>
                        {loading ? '⏳ 업데이트 중...' : '✅ 최신 데이터'}
                    </span>
                </div>
                {lastUpdated && !loading && (
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        업데이트: {getTimeAgo(lastUpdated)}
                    </span>
                )}
            </div>

            {loading && (
                <div style={loadingStyle}>
                    <div style={spinnerStyle}></div>
                    <p style={{ fontWeight: 700, fontSize: '1.125rem' }}>시세 정보를 불러오는 중...</p>
                </div>
            )}

            {!loading && data.length === 0 && (
                <div style={emptyStyle}>
                    시세 정보를 불러올 수 없습니다.
                </div>
            )}

            {!loading && data.length > 0 && (
                <div className="commodity-grid" style={gridStyle}>
                    {data.map((item) => (
                        <div key={item.symbol} style={cardStyle}>
                            <span style={iconStyle}>{item.icon}</span>
                            <span style={nameStyle}>{item.name}</span>
                            <span style={nameEnStyle}>{item.nameEn}</span>
                            <span style={priceStyle}>${formatPrice(item.price)}</span>
                            <span style={unitStyle}>/ {item.unit}</span>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ height: '6rem' }} />
        </div>
    );
}
