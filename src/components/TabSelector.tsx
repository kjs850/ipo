'use client';

import React from 'react';

type TabType = 'ipo' | 'real-estate' | 'commodities';

interface TabSelectorProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

const TABS = [
    { id: 'ipo' as TabType, label: '공모주', icon: '📈', color: '#6366f1' },
    { id: 'real-estate' as TabType, label: '부동산', icon: '🏠', color: '#10b981' },
    { id: 'commodities' as TabType, label: '원자재', icon: '📊', color: '#f59e0b' },
];

export default function TabSelector({ activeTab, onTabChange }: TabSelectorProps) {
    const containerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '2rem',
    };

    const wrapperStyle: React.CSSProperties = {
        display: 'inline-flex',
        backgroundColor: '#1e293b',
        borderRadius: '1rem',
        padding: '0.375rem',
        border: '1px solid #334155',
        gap: '0.25rem',
    };

    const getButtonStyle = (isActive: boolean, color: string): React.CSSProperties => ({
        padding: '0.625rem 1rem',
        borderRadius: '0.75rem',
        fontSize: '0.875rem',
        fontWeight: 700,
        cursor: 'pointer',
        border: 'none',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: isActive ? color : 'transparent',
        color: isActive ? '#ffffff' : '#94a3b8',
        boxShadow: isActive ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : 'none',
    });

    return (
        <div style={containerStyle}>
            <div style={wrapperStyle}>
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        style={getButtonStyle(activeTab === tab.id, tab.color)}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
