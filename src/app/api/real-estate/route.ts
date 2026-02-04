import { NextResponse } from 'next/server';
import { fetchRealEstateData } from '@/lib/realEstateCrawler';

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
    // 1-hour cache TTL
    if (!force && CACHE.data.length > 0 && (now - CACHE.timestamp < 1000 * 60 * 60)) {
        return NextResponse.json({
            source: 'cache',
            updatedAt: new Date(CACHE.timestamp).toISOString(),
            data: CACHE.data
        });
    }

    console.log('[API] Fetching real estate data...');
    const data = await fetchRealEstateData();

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
