'use client';

import React from 'react';

interface TabSelectorProps {
    activeTab: 'ipo' | 'real-estate';
    onTabChange: (tab: 'ipo' | 'real-estate') => void;
}

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

    const getButtonStyle = (isActive: boolean, type: 'ipo' | 'real-estate'): React.CSSProperties => ({
        padding: '0.625rem 1.25rem',
        borderRadius: '0.75rem',
        fontSize: '0.875rem',
        fontWeight: 700,
        cursor: 'pointer',
        border: 'none',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: isActive
            ? (type === 'ipo' ? '#6366f1' : '#10b981')
            : 'transparent',
        color: isActive ? '#ffffff' : '#94a3b8',
        boxShadow: isActive ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : 'none',
    });

    return (
        <div style={containerStyle}>
            <div style={wrapperStyle}>
                <button
                    onClick={() => onTabChange('ipo')}
                    style={getButtonStyle(activeTab === 'ipo', 'ipo')}
                >
                    <span>📈</span>
                    <span>공모주</span>
                </button>
                <button
                    onClick={() => onTabChange('real-estate')}
                    style={getButtonStyle(activeTab === 'real-estate', 'real-estate')}
                >
                    <span>🏠</span>
                    <span>부동산</span>
                </button>
            </div>
        </div>
    );
}
