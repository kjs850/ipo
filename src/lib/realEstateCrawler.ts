import axios from 'axios';

export interface RealEstateSubscription {
    // 식별자
    id: string;                     // 주택관리번호
    announcementNo: string;         // 공고번호

    // 기본 정보
    name: string;                   // 주택명 (단지명)
    region: string;                 // 공급지역명 (서울, 경기 등)
    location: string;               // 공급위치 (상세 주소)
    buildingType: string;           // 주택유형 (APT, 오피스텔 등)

    // 일정 정보
    announcementDate: string;       // 모집공고일 (YYYY-MM-DD)
    subscriptionStartDate: string;  // 청약접수시작일 (YYYY-MM-DD)
    subscriptionEndDate: string;    // 청약접수종료일 (YYYY-MM-DD)
    winnerAnnouncementDate: string; // 당첨자발표일 (YYYY-MM-DD)
    contractStartDate?: string;     // 계약시작일
    contractEndDate?: string;       // 계약종료일
    moveInDate?: string;            // 입주예정월 (YYYY-MM)

    // 공급 정보
    totalSupply: number;            // 공급세대수

    // 상태 (계산 필드)
    status: '예정' | '진행' | '마감';

    // 링크
    detailUrl?: string;             // 상세 공고 URL
}

interface RawApiItem {
    HOUSE_MANAGE_NO: string;
    PBLANC_NO: string;
    HOUSE_NM: string;
    HSSPLY_ADRES: string;
    SUBSCRPT_AREA_CODE_NM: string;
    RCRIT_PBLANC_DE: string;
    RCEPT_BGNDE: string;
    RCEPT_ENDDE: string;
    PRZWNER_PRESNATN_DE: string;
    CNTRCT_CNCLS_BGNDE?: string;
    CNTRCT_CNCLS_ENDDE?: string;
    TOT_SUPLY_HSHLDCO: number;
    HOUSE_SECD_NM: string;
    MVN_PREARNGE_YM?: string;
    HMPG_ADRES?: string;
}

function parseDate(dateStr: string | undefined): Date | null {
    if (!dateStr) return null;
    try {
        // Format: YYYY-MM-DD or YYYYMMDD
        const clean = dateStr.replace(/-/g, '');
        if (clean.length === 8) {
            const year = clean.substring(0, 4);
            const month = clean.substring(4, 6);
            const day = clean.substring(6, 8);
            return new Date(`${year}-${month}-${day}`);
        }
        return new Date(dateStr);
    } catch {
        return null;
    }
}

function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    const clean = dateStr.replace(/-/g, '');
    if (clean.length === 8) {
        return `${clean.substring(0, 4)}-${clean.substring(4, 6)}-${clean.substring(6, 8)}`;
    }
    return dateStr;
}

function calculateStatus(item: RawApiItem): '예정' | '진행' | '마감' {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = parseDate(item.RCEPT_BGNDE);
    const endDate = parseDate(item.RCEPT_ENDDE);

    if (!startDate || !endDate) return '예정';

    if (today < startDate) return '예정';
    if (today > endDate) return '마감';
    return '진행';
}

function transformItem(item: RawApiItem): RealEstateSubscription {
    return {
        id: item.HOUSE_MANAGE_NO || '',
        announcementNo: item.PBLANC_NO || '',
        name: item.HOUSE_NM || '',
        region: item.SUBSCRPT_AREA_CODE_NM || '',
        location: item.HSSPLY_ADRES || '',
        buildingType: item.HOUSE_SECD_NM || 'APT',
        announcementDate: formatDate(item.RCRIT_PBLANC_DE),
        subscriptionStartDate: formatDate(item.RCEPT_BGNDE),
        subscriptionEndDate: formatDate(item.RCEPT_ENDDE),
        winnerAnnouncementDate: formatDate(item.PRZWNER_PRESNATN_DE),
        contractStartDate: formatDate(item.CNTRCT_CNCLS_BGNDE),
        contractEndDate: formatDate(item.CNTRCT_CNCLS_ENDDE),
        moveInDate: item.MVN_PREARNGE_YM || undefined,
        totalSupply: item.TOT_SUPLY_HSHLDCO || 0,
        status: calculateStatus(item),
        detailUrl: item.HMPG_ADRES || undefined,
    };
}

async function fetchFromApi(endpoint: string, apiKey: string): Promise<RawApiItem[]> {
    try {
        const baseUrl = 'https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1';
        const url = `${baseUrl}${endpoint}`;

        // 날짜 필터: 최근 30일 ~ 미래 60일
        const now = new Date();
        const pastDate = new Date();
        pastDate.setDate(now.getDate() - 30);
        const futureDate = new Date();
        futureDate.setDate(now.getDate() + 60);

        const formatForApi = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const params = new URLSearchParams({
            page: '1',
            perPage: '100',
            returnType: 'JSON',
            serviceKey: apiKey,
        });

        console.log(`[RealEstate] Fetching from ${endpoint}...`);
        const response = await axios.get(`${url}?${params.toString()}`, {
            timeout: 10000,
            headers: {
                'Accept': 'application/json',
            }
        });

        const data = response.data?.data || [];
        console.log(`[RealEstate] Fetched ${data.length} items from ${endpoint}`);
        return data;
    } catch (error: any) {
        console.error(`[RealEstate] Error fetching ${endpoint}:`, error.message);
        return [];
    }
}

export async function fetchRealEstateData(): Promise<RealEstateSubscription[]> {
    const apiKey = process.env.REAL_ESTATE_API_KEY;

    if (!apiKey) {
        console.error('[RealEstate] API key not found. Set REAL_ESTATE_API_KEY in .env.local');
        return [];
    }

    try {
        console.log('[RealEstate] Starting data fetch...');

        // APT 분양정보 조회
        const aptData = await fetchFromApi('/getAPTLttotPblancDetail', apiKey);

        // 오피스텔/도시형 분양정보 조회
        const officetelData = await fetchFromApi('/getUrbtyOfctlLttotPblancDetail', apiKey);

        // 데이터 변환
        const allItems: RealEstateSubscription[] = [
            ...aptData.map(transformItem),
            ...officetelData.map(transformItem),
        ];

        // 중복 제거 (주택관리번호 기준)
        const uniqueItems = allItems.reduce((acc, item) => {
            if (!acc.find(i => i.id === item.id)) {
                acc.push(item);
            }
            return acc;
        }, [] as RealEstateSubscription[]);

        // 날짜 필터링 (최근 30일 ~ 미래 60일)
        const now = new Date();
        const pastLimit = new Date();
        pastLimit.setDate(now.getDate() - 30);
        const futureLimit = new Date();
        futureLimit.setDate(now.getDate() + 60);

        const filteredItems = uniqueItems.filter(item => {
            const startDate = parseDate(item.subscriptionStartDate);
            if (!startDate) return false;
            return startDate >= pastLimit && startDate <= futureLimit;
        });

        // 청약 시작일 기준 정렬
        filteredItems.sort((a, b) => {
            const dateA = parseDate(a.subscriptionStartDate);
            const dateB = parseDate(b.subscriptionStartDate);
            if (!dateA || !dateB) return 0;
            return dateA.getTime() - dateB.getTime();
        });

        console.log(`[RealEstate] Total ${filteredItems.length} items after filtering`);
        return filteredItems;
    } catch (error) {
        console.error('[RealEstate] Failed to fetch data:', error);
        return [];
    }
}
