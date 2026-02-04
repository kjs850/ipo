import { NextResponse } from 'next/server';
import { fetchCommodityPrices } from '@/lib/commodityCrawler';

// In-memory cache (resets on cold start)
let CACHE = {
    timestamp: 0,
    data: [] as any[]
};

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const now = Date.now();
    // 10-minute cache TTL (시세는 자주 변동)
    if (!force && CACHE.data.length > 0 && (now - CACHE.timestamp < 1000 * 60 * 10)) {
        return NextResponse.json({
            source: 'cache',
            updatedAt: new Date(CACHE.timestamp).toISOString(),
            data: CACHE.data
        });
    }

    console.log('[API] Fetching commodity prices...');
    const data = await fetchCommodityPrices();

    if (data.length > 0) {
        CACHE = {
            timestamp: now,
            data
        };
    }

    return NextResponse.json({
        source: 'live',
        updatedAt: new Date(now).toISOString(),
        data
    });
}
