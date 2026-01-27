import { NextResponse } from 'next/server';
import { crawl38Communication } from '@/lib/crawler';

// Global variable to act as a cache in serverless (Note: This resets on cold start)
// In a real Vercel app, use Vercel KV or a Database.
let CACHE = {
    timestamp: 0,
    data: [] as any[]
};

export const dynamic = 'force-dynamic'; // Prevent static optimization so we always check logic

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const now = Date.now();
    // Simple in-memory caching (1 hour)
    if (!force && CACHE.data.length > 0 && (now - CACHE.timestamp < 1000 * 60 * 60)) {
        return NextResponse.json({
            source: 'cache',
            updatedAt: new Date(CACHE.timestamp).toISOString(),
            data: CACHE.data
        });
    }

    // Crawl data
    console.log("Starting Crawler...");
    const data = await crawl38Communication();

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
