# Design: 원자재 시세 탭

> Plan 문서: `docs/01-plan/features/commodity-prices.plan.md`

## 1. 시스템 아키텍처

### 1.1 전체 구조

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────┐                                            │
│  │ TabSelector │─────────────────────────────────────────┐  │
│  │  (3탭 확장)  │                                         │  │
│  └─────────────┘                                         │  │
│         │                                                 │  │
│  ┌──────┴──────┬────────────────┬───────────────────┐    │  │
│  │             │                │                   │    │  │
│  │ IPOCalendar │ RealEstate     │ CommodityPrices   │    │  │
│  │  (기존)      │ Calendar(기존) │ (신규)             │    │  │
│  └─────────────┴────────────────┴───────────────────┘    │  │
│                            │                              │  │
│                      page.tsx (3탭 상태 관리)              │  │
└────────────────────────────┼─────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼─────┐ ┌──────▼──────┐ ┌────▼────────┐
        │ /api/ipo  │ │/api/real-   │ │/api/        │
        │           │ │estate       │ │commodities  │
        └─────┬─────┘ └──────┬──────┘ └────┬────────┘
              │              │              │
        ┌─────▼─────┐ ┌──────▼──────┐ ┌────▼────────┐
        │ crawler   │ │realEstate   │ │commodity    │
        │ .ts       │ │Crawler.ts   │ │Crawler.ts   │
        └───────────┘ └─────────────┘ └────┬────────┘
                                           │
                                    ┌──────▼──────┐
                                    │ API Ninjas  │
                                    └─────────────┘
```

### 1.2 데이터 흐름

```
1. 사용자가 "원자재" 탭 클릭
2. page.tsx에서 activeTab 상태 변경 ('commodities')
3. CommodityPrices 컴포넌트 렌더링
4. useEffect에서 /api/commodities 호출
5. API Route에서 캐시 확인 (10분 TTL)
6. 캐시 없으면 → commodityCrawler.ts에서 API Ninjas 호출
7. 6개 원자재 병렬 조회
8. JSON 응답 반환
9. 그리드 형태로 UI 렌더링
```

## 2. API 설계

### 2.1 API Ninjas 연동

**Base URL**: `https://api.api-ninjas.com/v1`

**엔드포인트**: `/commodityprice`

**요청**:
```typescript
GET /commodityprice?name={commodity_name}
Headers:
  X-Api-Key: <COMMODITY_API_KEY>
```

**응답**:
```typescript
interface ApiNinjasResponse {
  name: string;      // 'gold', 'silver', etc.
  price: number;     // 현재 가격
  currency: string;  // 'USD'
  unit: string;      // 'ounce', 'pound', 'barrel'
}
```

### 2.2 내부 API 엔드포인트

**`GET /api/commodities`**

**Query Parameters**:
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| force | boolean | false | 캐시 무시 |

**Response**:
```typescript
interface ApiResponse {
  source: 'cache' | 'live';
  updatedAt: string;  // ISO 8601
  data: CommodityPrice[];
}
```

## 3. 데이터 모델

### 3.1 타입 정의

```typescript
// src/lib/commodityCrawler.ts

export interface CommodityPrice {
  symbol: string;        // API 요청용 키 ('gold', 'silver', etc.)
  name: string;          // 한글 표시명 ('금', '은', etc.)
  nameEn: string;        // 영문 표시명 ('Gold', 'Silver', etc.)
  price: number;         // 현재 가격 (USD)
  currency: string;      // 'USD'
  unit: string;          // 표시 단위 ('oz', 'lb', 'barrel')
  unitFull: string;      // 전체 단위명 ('ounce', 'pound', 'barrel')
  icon: string;          // 이모지 아이콘
  updatedAt: string;     // ISO 8601 타임스탬프
}

// 조회할 원자재 목록 설정
export const COMMODITIES_CONFIG = [
  { symbol: 'gold', name: '금', nameEn: 'Gold', unit: 'oz', icon: '🥇' },
  { symbol: 'silver', name: '은', nameEn: 'Silver', unit: 'oz', icon: '🥈' },
  { symbol: 'copper', name: '구리', nameEn: 'Copper', unit: 'lb', icon: '🔶' },
  { symbol: 'crude_oil', name: '원유', nameEn: 'Crude Oil (WTI)', unit: 'barrel', icon: '🛢️' },
  { symbol: 'natural_gas', name: '천연가스', nameEn: 'Natural Gas', unit: 'MMBtu', icon: '🔥' },
  { symbol: 'platinum', name: '백금', nameEn: 'Platinum', unit: 'oz', icon: '⚪' },
];
```

### 3.2 단위 매핑

| API 응답 unit | 표시 단위 | 전체 표시 |
|--------------|----------|----------|
| ounce | oz | / oz |
| pound | lb | / lb |
| barrel | barrel | / barrel |
| million_btu | MMBtu | / MMBtu |

## 4. 컴포넌트 설계

### 4.1 TabSelector 수정 (3탭 확장)

**파일**: `src/components/TabSelector.tsx`

**변경된 타입**:
```typescript
type TabType = 'ipo' | 'real-estate' | 'commodities';

interface TabSelectorProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}
```

**탭 설정**:
```typescript
const TABS = [
  { id: 'ipo', label: '공모주', icon: '📈', color: '#6366f1' },
  { id: 'real-estate', label: '부동산', icon: '🏠', color: '#10b981' },
  { id: 'commodities', label: '원자재', icon: '📊', color: '#f59e0b' },
];
```

### 4.2 CommodityPrices 컴포넌트

**파일**: `src/components/CommodityPrices.tsx`

**Props**: 없음 (내부에서 데이터 fetch)

**State**:
```typescript
const [data, setData] = useState<CommodityPrice[]>([]);
const [loading, setLoading] = useState(true);
const [lastUpdated, setLastUpdated] = useState<string>('');
```

**카드 레이아웃**:
```
┌────────────────────────────────────────────┐
│  🥇                                        │
│  금 (Gold)                                 │
│                                            │
│  $2,045.30                                 │
│  / oz                                      │
│                                            │
└────────────────────────────────────────────┘
```

**그리드 구조**:
- 모바일: 2열 그리드
- 데스크톱: 3열 그리드

**색상 스펙**:
| 원자재 | 배경 그라데이션 |
|--------|----------------|
| 금 | amber/yellow |
| 은 | gray/slate |
| 구리 | orange |
| 원유 | slate/dark |
| 천연가스 | red/orange |
| 백금 | gray/white |

### 4.3 page.tsx 수정

**변경 사항**:
1. `activeTab` 타입 확장: `'ipo' | 'real-estate' | 'commodities'`
2. `headerContent`에 원자재 추가
3. 조건부 렌더링에 `CommodityPrices` 추가

```typescript
const headerContent = {
  ipo: { title: '공모주 투자의 시작', ... },
  'real-estate': { title: '내 집 마련의 첫 걸음', ... },
  commodities: {
    title: '원자재 시세',
    subtitle: 'COMMODITIES',
    description: '금, 은, 원유 등 주요 원자재 실시간 시세',
    gradient: 'from-amber-400 via-yellow-400 to-amber-400'
  }
};
```

## 5. 파일 구조 및 구현 순서

### 5.1 파일 목록

| 순서 | 파일 경로 | 작업 | 타입 |
|------|----------|------|------|
| 1 | `src/lib/commodityCrawler.ts` | 신규 | API 클라이언트 |
| 2 | `src/app/api/commodities/route.ts` | 신규 | API 엔드포인트 |
| 3 | `src/components/CommodityPrices.tsx` | 신규 | UI 컴포넌트 |
| 4 | `src/components/TabSelector.tsx` | 수정 | 3탭 확장 |
| 5 | `src/app/page.tsx` | 수정 | 탭 통합 |
| 6 | `.env.local` | 수정 | 환경변수 추가 |
| 7 | `vercel.json` | 수정 | Cron Job 추가 |

### 5.2 구현 순서 (체크리스트)

**Phase 1: 백엔드**
- [ ] 1.1 API Ninjas 가입 및 API 키 발급
- [ ] 1.2 `.env.local`에 `COMMODITY_API_KEY` 추가
- [ ] 1.3 `commodityCrawler.ts` 작성
  - [ ] CommodityPrice 인터페이스 정의
  - [ ] COMMODITIES_CONFIG 상수 정의
  - [ ] fetchCommodityPrices() 함수 구현
  - [ ] 병렬 API 호출 (Promise.all)
  - [ ] 에러 핸들링
- [ ] 1.4 `/api/commodities/route.ts` 작성
  - [ ] 캐시 로직 (10분 TTL)
  - [ ] GET 핸들러
  - [ ] force 파라미터 처리

**Phase 2: 프론트엔드**
- [ ] 2.1 `CommodityPrices.tsx` 작성
  - [ ] 데이터 fetch 로직
  - [ ] 그리드 카드 UI
  - [ ] 로딩 상태
  - [ ] 반응형 스타일
- [ ] 2.2 `TabSelector.tsx` 수정
  - [ ] TabType 확장
  - [ ] 3번째 탭 (원자재) 추가
  - [ ] 색상: amber (#f59e0b)
- [ ] 2.3 `page.tsx` 수정
  - [ ] activeTab 타입 확장
  - [ ] headerContent 추가
  - [ ] 조건부 렌더링

**Phase 3: 배포 설정**
- [ ] 3.1 `vercel.json` Cron Job 추가
- [ ] 3.2 Vercel 환경변수 설정
- [ ] 3.3 배포 및 테스트

## 6. 환경 설정

### 6.1 환경 변수

```env
# .env.local
COMMODITY_API_KEY=<API_NINJAS_KEY>
```

### 6.2 Vercel 설정 (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/ipo?force=true",
      "schedule": "0 7 * * *"
    },
    {
      "path": "/api/real-estate?force=true",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/commodities?force=true",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

**원자재 Cron**: 30분마다 (시세 변동 빈번)

## 7. 에러 처리

### 7.1 API 에러 처리

| 에러 코드 | 원인 | 대응 |
|----------|------|------|
| 401 | API 키 오류 | 환경변수 확인 로그 |
| 429 | Rate Limit | 캐시된 데이터 반환 |
| 500 | 서버 오류 | 캐시된 데이터 반환 |
| TIMEOUT | 5초 초과 | 개별 원자재 스킵 |

### 7.2 Fallback 전략

```typescript
// 일부 원자재 실패 시 성공한 것만 반환
const results = await Promise.allSettled(promises);
const successfulData = results
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value);
```

## 8. UI 상세 스펙

### 8.1 카드 인라인 스타일

```typescript
const cardStyle: React.CSSProperties = {
  backgroundColor: '#1e293b',
  borderRadius: '1.5rem',
  padding: '1.5rem',
  border: '1px solid #334155',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: '0.5rem',
};

const priceStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 800,
  color: '#ffffff',
  fontFamily: 'monospace',
};

const unitStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#94a3b8',
};
```

### 8.2 그리드 스타일

```typescript
const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)', // 모바일: 2열
  gap: '1rem',
  maxWidth: '42rem',
  margin: '0 auto',
  padding: '1rem',
};

// 미디어 쿼리는 CSS 또는 window.innerWidth로 처리
// 768px 이상: gridTemplateColumns: 'repeat(3, 1fr)'
```

---

**문서 버전**: v1.0
**작성일**: 2026-02-04
**상태**: Ready for Implementation
**Plan 참조**: `commodity-prices.plan.md`
