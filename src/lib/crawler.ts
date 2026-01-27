import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

export interface IPOData {
    id: string;
    name: string;
    schedule: string; // 수요예측 일정
    subscriptionSchedule?: string; // 공모청약 일정 (New)
    status: string;
    priceBand: string;
    hopePrice: string;
    confirmedPrice: string;
    competitionRate: string;
    lockupRatio: string;
    underwriter?: string;
    isGoodComp?: boolean;
    isGoodLockup?: boolean;
    isGoodPrice?: boolean;
}

async function fetchPage(url: string, summary: string): Promise<any[]> {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 5000
        });
        const decoded = iconv.decode(response.data, 'EUC-KR');
        const $ = cheerio.load(decoded);
        const rows: any[] = [];

        $(`table[summary="${summary}"] tr`).each((i, el) => {
            if (i === 0) return;
            const tds = $(el).find('td');
            if (tds.length < 5) return;

            const name = $(tds[0]).text().trim();
            if (!name || name.includes('종목명')) return;

            rows.push({ $, tds });
        });
        return rows;
    } catch (e) {
        console.error(`Error fetching ${url}`, e);
        return [];
    }
}

function parseDate(dateStr: string): Date | null {
    try {
        const clean = dateStr.split('~')[0].trim().replace(/\./g, '-');
        const d = new Date(clean);
        return isNaN(d.getTime()) ? null : d;
    } catch {
        return null;
    }
}

export async function crawl38Communication(): Promise<IPOData[]> {
    try {
        const list: IPOData[] = [];
        const now = new Date();
        const futureLimit = new Date(); futureLimit.setDate(now.getDate() + 30);
        const pastLimit = new Date(); pastLimit.setDate(now.getDate() - 30);

        // 1. Fetch Forecast Results (o=r1)
        const results = await fetchPage('http://www.38.co.kr/html/fund/index.htm?o=r1', '수요예측결과');

        results.forEach(({ $, tds }) => {
            const name = $(tds[0]).text().trim();
            const dateStr = $(tds[1]).text().trim(); // Forecast Date
            const date = parseDate(dateStr);

            if (!date || date < pastLimit || date > futureLimit) return;

            const band = $(tds[2]).text().trim();
            const confirmed = $(tds[3]).text().trim();
            const rate = $(tds[5]).text().trim();
            const lockup = $(tds[6]).text().trim();
            const underwriter = $(tds[7]).text().trim();

            const rateVal = parseFloat(rate.replace(/[:%a-zA-Z가-힣]/g, '').replace(/,/g, ''));
            const lockupVal = parseFloat(lockup.replace(/[:%a-zA-Z가-힣]/g, '').replace(/,/g, ''));

            // Price Logic
            let isGoodPrice = false;
            let confirmedVal = 0;
            let maxHopeVal = 0;
            if (confirmed && confirmed !== '-') {
                confirmedVal = parseFloat(confirmed.replace(/,/g, ''));
                const parts = band.split('~');
                const maxPart = parts.length > 1 ? parts[1] : parts[0];
                maxHopeVal = parseFloat(maxPart.replace(/,/g, ''));
                if (maxHopeVal > 0 && confirmedVal >= maxHopeVal) isGoodPrice = true;
            }

            list.push({
                id: name,
                name,
                schedule: dateStr,
                status: '완료',
                priceBand: confirmed,
                hopePrice: band,
                confirmedPrice: confirmed,
                competitionRate: rate,
                lockupRatio: lockup,
                underwriter,
                isGoodComp: rateVal >= 450,
                isGoodLockup: lockupVal >= 15,
                isGoodPrice
            });
        });

        // 2. Fetch Forecast Schedule (o=r)
        const schedules = await fetchPage('http://www.38.co.kr/html/fund/index.htm?o=r', '수요예측일정');

        schedules.forEach(({ $, tds }) => {
            const name = $(tds[0]).text().trim();
            if (list.find(i => i.name === name)) return;

            const dateStr = $(tds[1]).text().trim();
            const date = parseDate(dateStr);
            if (!date || date < pastLimit || date > futureLimit) return;

            const band = $(tds[2]).text().trim();
            const underwriter = $(tds[5]).text().trim();

            list.push({
                id: name,
                name,
                schedule: dateStr,
                status: '예정', // Simple status
                priceBand: '-',
                hopePrice: band,
                confirmedPrice: '-',
                competitionRate: '-',
                lockupRatio: '-',
                underwriter,
                isGoodComp: false,
                isGoodLockup: false,
                isGoodPrice: false
            });
        });

        // 3. Fetch Subscription Schedule (o=k) (공모청약)
        const subscriptions = await fetchPage('http://www.38.co.kr/html/fund/index.htm?o=k', '공모주 청약일정');

        subscriptions.forEach(({ $, tds }) => {
            const name = $(tds[0]).text().trim();
            const subSchedule = $(tds[1]).text().trim(); // This is Subscription Date

            // Find existing item
            const existing = list.find(i => i.name === name);
            if (existing) {
                existing.subscriptionSchedule = subSchedule;
            } else {
                // Optional: Add item if not found in forecast list (rare but possible)
                // Only if within date range
                const date = parseDate(subSchedule);
                if (date && date >= pastLimit && date <= futureLimit) {
                    const confirmed = $(tds[2]).text().trim();
                    const hope = $(tds[3]).text().trim();
                    const underwriter = $(tds[5]).text().trim();

                    list.push({
                        id: name,
                        name,
                        schedule: '-',
                        subscriptionSchedule: subSchedule,
                        status: '예정',
                        priceBand: confirmed,
                        hopePrice: hope,
                        confirmedPrice: confirmed,
                        competitionRate: '-',
                        lockupRatio: '-',
                        underwriter,
                        isGoodComp: false,
                        isGoodLockup: false,
                        isGoodPrice: false
                    });
                }
            }
        });

        // Sort logic: Ascending (Oldest first) for "Future at bottom"
        list.sort((a, b) => {
            const dA = parseDate(a.schedule) || new Date(0);
            const dB = parseDate(b.schedule) || new Date(0);
            return dA.getTime() - dB.getTime();
        });

        return list;
    } catch (error) {
        console.error("Crawling failed", error);
        return [];
    }
}
