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
    symbol: string;        // Gold-API.com 심볼 (XAU, XAG, etc.)
    name: string;
    nameEn: string;
    unit: string;
    unitFull: string;
    icon: string;
}

// Gold-API.com 지원 귀금속 (API 키 불필요)
export const COMMODITIES_CONFIG: CommodityConfig[] = [
    { symbol: 'XAU', name: '금', nameEn: 'Gold', unit: 'oz', unitFull: 'ounce', icon: '🥇' },
    { symbol: 'XAG', name: '은', nameEn: 'Silver', unit: 'oz', unitFull: 'ounce', icon: '🥈' },
    { symbol: 'XPT', name: '백금', nameEn: 'Platinum', unit: 'oz', unitFull: 'ounce', icon: '⚪' },
    { symbol: 'XPD', name: '팔라듐', nameEn: 'Palladium', unit: 'oz', unitFull: 'ounce', icon: '🔷' },
];

interface GoldApiResponse {
    name: string;
    price: number;
    symbol: string;
    updatedAt: string;
    updatedAtReadable: string;
}

async function fetchSingleCommodity(
    config: CommodityConfig
): Promise<CommodityPrice | null> {
    try {
        const url = `https://api.gold-api.com/price/${config.symbol}`;

        const response = await axios.get<GoldApiResponse>(url, {
            timeout: 5000,
        });

        const data = response.data;

        return {
            symbol: config.symbol,
            name: config.name,
            nameEn: config.nameEn,
            price: data.price,
            currency: 'USD',
            unit: config.unit,
            unitFull: config.unitFull,
            icon: config.icon,
            updatedAt: data.updatedAt || new Date().toISOString(),
        };
    } catch (error: any) {
        console.error(`[Commodity] Failed to fetch ${config.symbol}:`, error.message);
        return null;
    }
}

export async function fetchCommodityPrices(): Promise<CommodityPrice[]> {
    console.log('[Commodity] Fetching commodity prices from Gold-API.com...');

    // 병렬로 모든 원자재 조회
    const promises = COMMODITIES_CONFIG.map(config =>
        fetchSingleCommodity(config)
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
