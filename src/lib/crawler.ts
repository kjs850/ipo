import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

export interface IPOData {
    id: string;
    name: string;
    schedule: string;
    subscriptionSchedule?: string;
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
    stockCode?: string;
    currentPrice?: string;
    profitRate?: string;
}

function cleanCompanyName(name: string): string {
    return name.replace(/\(주\)/g, '')
        .replace(/㈜/g, '')
        .replace(/스팩/g, '스팩')
        .replace(/제/g, '') // "교보제17호스팩" -> "교보17호스팩"
        .replace(/호/g, '호') // 유지
        .trim();
}

// --- DAUM API HELPERS ONLY ---
async function fetchDaumStockCode(companyName: string): Promise<string | null> {
    try {
        const cleanedName = cleanCompanyName(companyName);
        console.log(`[Daum] Searching stock code for: ${cleanedName}`);

        const encoded = encodeURIComponent(cleanedName);
        const url = `https://finance.daum.net/api/search?q=${encoded}`;

        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://finance.daum.net/'
            },
            timeout: 5000
        });

        const items = res.data?.suggestItems;
        if (items && items.length > 0) {
            const code = items[0].symbolCode; // e.g., "A0001A0"
            const name = items[0].koreanName;
            console.log(`[Daum] Found code for ${companyName}: ${code} (${name})`);
            return code;
        }
        console.warn(`[Daum] No stock code found for: ${companyName}`);
        return null;
    } catch (e) {
        console.error(`[Daum] Failed to fetch stock code for ${companyName}`);
        return null;
    }
}

async function fetchDaumStockPrice(symbolCode: string): Promise<number | null> {
    try {
        const url = `https://finance.daum.net/api/quotes/${symbolCode}`;
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://finance.daum.net/'
            },
            timeout: 5000
        });

        // Daum returns tradePrice as number directly
        const price = res.data?.tradePrice;
        return typeof price === 'number' ? price : null;
    } catch (e) {
        console.error(`[Daum] Failed to fetch price for ${symbolCode}`);
        return null;
    }
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
        console.log("Starting 38Communication crawling...");
        const list: IPOData[] = [];
        const now = new Date();
        const futureLimit = new Date(); futureLimit.setDate(now.getDate() + 45);
        const pastLimit = new Date(); pastLimit.setDate(now.getDate() - 30);

        // 1. Fetch Forecast Results (o=r1)
        console.log("Fetching Forecast Results...");
        const results = await fetchPage('http://www.38.co.kr/html/fund/index.htm?o=r1', '수요예측결과');
        results.forEach(({ $, tds }) => {
            const name = $(tds[0]).text().trim();
            const dateStr = $(tds[1]).text().trim();
            const date = parseDate(dateStr);

            if (!date || date < pastLimit || date > futureLimit) return; // futureLimit extended to 45 by default

            const band = $(tds[2]).text().trim();
            const confirmed = $(tds[3]).text().trim();
            const rate = $(tds[5]).text().trim();
            const lockup = $(tds[6]).text().trim();
            const underwriter = $(tds[7]).text().trim();

            const rateVal = parseFloat(rate.replace(/[:%a-zA-Z가-힣]/g, '').replace(/,/g, ''));
            const lockupVal = parseFloat(lockup.replace(/[:%a-zA-Z가-힣]/g, '').replace(/,/g, ''));

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
                status: '예정',
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

        // 3. Fetch Subscription Schedule (o=k)
        const subscriptions = await fetchPage('http://www.38.co.kr/html/fund/index.htm?o=k', '공모주 청약일정');
        subscriptions.forEach(({ $, tds }) => {
            const name = $(tds[0]).text().trim();
            const subSchedule = $(tds[1]).text().trim();
            const existing = list.find(i => i.name === name);
            if (existing) {
                existing.subscriptionSchedule = subSchedule;
            } else {
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

        // --- Refresh Stock Prices (ONLY DAUM) ---
        const completedItems = list.filter(item => item.status === '완료' && item.confirmedPrice !== '-' && item.confirmedPrice);
        console.log(`Found ${completedItems.length} completed items to update stock info using Daum.`);

        // Process in parallel using ONLY Daum
        await Promise.all(completedItems.map(async (item) => {
            const daumCode = await fetchDaumStockCode(item.name);
            if (daumCode) {
                const price = await fetchDaumStockPrice(daumCode);

                // Update Item if price found
                if (price !== null) {
                    item.stockCode = daumCode;
                    item.currentPrice = price.toLocaleString();

                    const confPrice = parseFloat(item.confirmedPrice.replace(/,/g, ''));
                    if (confPrice > 0) {
                        const profit = ((price - confPrice) / confPrice) * 100;
                        item.profitRate = profit.toFixed(2);
                    }
                }
            }
        }));

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
