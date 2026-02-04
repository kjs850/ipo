import axios from 'axios';

export interface CommodityPrice {
    symbol: string;        // API 요청용 키
    name: string;          // 한글 표시명
    nameEn: string;        // 영문 표시명
    price: number;         // 현재 가격 (USD)
    currency: string;      // 'USD'
    unit: string;          // 표시 단위
    unitFull: string;      // 전체 단위명
    icon: string;          // 이모지 아이콘
    updatedAt: string;     // ISO 8601 타임스탬프
}

interface CommodityConfig {
    symbol: string;
    name: string;
    nameEn: string;
    unit: string;
    unitFull: string;
    icon: string;
}

export const COMMODITIES_CONFIG: CommodityConfig[] = [
    { symbol: 'micro_gold', name: '금 (미니)', nameEn: 'Micro Gold', unit: 'oz', unitFull: 'ounce', icon: '🥇' },
    { symbol: 'micro_silver', name: '은 (미니)', nameEn: 'Micro Silver', unit: 'oz', unitFull: 'ounce', icon: '🥈' },
    { symbol: 'natural_gas', name: '천연가스', nameEn: 'Natural Gas', unit: 'MMBtu', unitFull: 'MMBtu', icon: '🔥' },
    { symbol: 'lumber', name: '목재', nameEn: 'Lumber', unit: 'bd ft', unitFull: 'board feet', icon: '🪵' },
    { symbol: 'live_cattle', name: '생우', nameEn: 'Live Cattle', unit: 'lb', unitFull: 'pound', icon: '🐄' },
    { symbol: 'orange_juice', name: '오렌지주스', nameEn: 'Orange Juice', unit: 'lb', unitFull: 'pound', icon: '🍊' },
];

interface ApiNinjasResponse {
    name: string;
    price: number;
    currency: string;
    unit: string;
}

async function fetchSingleCommodity(
    symbol: string,
    config: CommodityConfig,
    apiKey: string
): Promise<CommodityPrice | null> {
    try {
        const url = `https://api.api-ninjas.com/v1/commodityprice?name=${symbol}`;

        const response = await axios.get<ApiNinjasResponse>(url, {
            headers: {
                'X-Api-Key': apiKey,
            },
            timeout: 5000,
        });

        const data = response.data;

        return {
            symbol: config.symbol,
            name: config.name,
            nameEn: config.nameEn,
            price: data.price,
            currency: data.currency || 'USD',
            unit: config.unit,
            unitFull: config.unitFull,
            icon: config.icon,
            updatedAt: new Date().toISOString(),
        };
    } catch (error: any) {
        console.error(`[Commodity] Failed to fetch ${symbol}:`, error.message);
        return null;
    }
}

export async function fetchCommodityPrices(): Promise<CommodityPrice[]> {
    const apiKey = process.env.COMMODITY_API_KEY;

    if (!apiKey) {
        console.error('[Commodity] API key not found. Set COMMODITY_API_KEY in .env.local');
        return [];
    }

    console.log('[Commodity] Fetching commodity prices...');

    // 병렬로 모든 원자재 조회
    const promises = COMMODITIES_CONFIG.map(config =>
        fetchSingleCommodity(config.symbol, config, apiKey)
    );

    const results = await Promise.allSettled(promises);

    // 성공한 결과만 필터링
    const commodities: CommodityPrice[] = results
        .filter((result): result is PromiseFulfilledResult<CommodityPrice | null> =>
            result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value as CommodityPrice);

    console.log(`[Commodity] Fetched ${commodities.length}/${COMMODITIES_CONFIG.length} commodities`);

    return commodities;
}
