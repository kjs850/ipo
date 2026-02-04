# Plan: 원자재 시세 탭

## 1. 개요

### 1.1 기능 설명
기존 공모주/부동산 청약 대시보드에 **원자재(금, 은, 구리, 유가 등) 시세** 탭을 추가하여 투자자에게 통합 투자 정보 서비스를 제공한다.

### 1.2 목표
- 주요 원자재(금, 은, 구리, 원유) 실시간 시세 표시
- 가격 변동률 시각화 (상승/하락)
- 기존 UI 패턴과 일관된 디자인
- 3개 탭 체계로 확장 (공모주 / 부동산 / 원자재)

### 1.3 데이터 소스 (우선순위)

| 우선순위 | 소스 | URL | 특징 |
|---------|------|-----|------|
| 1 | API Ninjas | https://api-ninjas.com/api/commodityprice | 무료 10,000회/월, 간단한 REST API |
| 2 | Commodities-API | https://commodities-api.com | 무료 100회/월 |
| 3 | 금융위원회 API | https://www.data.go.kr/data/15094805/openapi.do | 한국 KRX 금시세, 석유시세 |

**권장**: API Ninjas (무료 한도 넉넉, 다양한 원자재 지원)

## 2. 요구사항

### 2.1 기능 요구사항 (FR)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | 금(Gold) 시세 표시 | P0 (필수) |
| FR-02 | 은(Silver) 시세 표시 | P0 (필수) |
| FR-03 | 구리(Copper) 시세 표시 | P0 (필수) |
| FR-04 | 원유(Crude Oil) 시세 표시 | P0 (필수) |
| FR-05 | 가격 변동률 표시 (전일 대비) | P1 (중요) |
| FR-06 | 3탭 UI로 확장 (공모주/부동산/원자재) | P0 (필수) |
| FR-07 | 단위 표시 ($/oz, $/barrel 등) | P1 (중요) |
| FR-08 | 추가 원자재 (백금, 팔라듐, 천연가스) | P2 (선택) |

### 2.2 비기능 요구사항 (NFR)

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-01 | API 응답 시간 | 3초 이내 |
| NFR-02 | 데이터 캐싱 | 10분 TTL (시세는 자주 변동) |
| NFR-03 | 에러 핸들링 | API 실패시 마지막 캐시 데이터 표시 |
| NFR-04 | 반응형 디자인 | 모바일/데스크톱 대응 |

## 3. 데이터 구조

### 3.1 원자재 데이터 인터페이스

```typescript
interface CommodityPrice {
  symbol: string;        // 'gold', 'silver', 'copper', 'crude_oil'
  name: string;          // 표시명 (금, 은, 구리, 원유)
  nameEn: string;        // Gold, Silver, Copper, Crude Oil
  price: number;         // 현재 가격 (USD)
  currency: string;      // 'USD'
  unit: string;          // 'oz', 'lb', 'barrel'
  change?: number;       // 가격 변동 (절대값)
  changePercent?: number;// 변동률 (%)
  updatedAt: string;     // ISO 8601
  icon: string;          // 이모지 아이콘
}
```

### 3.2 표시할 원자재 목록

| Symbol | 한글명 | 영문명 | 단위 | 아이콘 |
|--------|-------|--------|------|--------|
| gold | 금 | Gold | $/oz | 🥇 |
| silver | 은 | Silver | $/oz | 🥈 |
| copper | 구리 | Copper | $/lb | 🔶 |
| crude_oil | 원유 (WTI) | Crude Oil | $/barrel | 🛢️ |
| natural_gas | 천연가스 | Natural Gas | $/MMBtu | 🔥 |
| platinum | 백금 | Platinum | $/oz | ⚪ |

## 4. 구현 계획

### 4.1 파일 구조

```
src/
├── lib/
│   ├── crawler.ts               # (기존) IPO 크롤러
│   ├── realEstateCrawler.ts     # (기존) 부동산 API
│   └── commodityCrawler.ts      # (신규) 원자재 API 클라이언트
├── components/
│   ├── IPOCalendar.tsx          # (기존)
│   ├── RealEstateCalendar.tsx   # (기존)
│   ├── CommodityPrices.tsx      # (신규) 원자재 시세 컴포넌트
│   └── TabSelector.tsx          # (수정) 3탭으로 확장
├── app/
│   ├── page.tsx                 # (수정) 3탭 전환 로직
│   └── api/
│       ├── ipo/route.ts         # (기존)
│       ├── real-estate/route.ts # (기존)
│       └── commodities/route.ts # (신규) 원자재 API
```

### 4.2 구현 순서

1. **Phase 1: 백엔드 (API)**
   - [ ] API Ninjas 키 발급 (https://api-ninjas.com)
   - [ ] `.env.local`에 `COMMODITY_API_KEY` 추가
   - [ ] `commodityCrawler.ts` 작성
   - [ ] `/api/commodities/route.ts` 엔드포인트 생성
   - [ ] 캐싱 로직 적용 (10분 TTL)

2. **Phase 2: 프론트엔드 (UI)**
   - [ ] `CommodityPrices.tsx` 컴포넌트 개발
   - [ ] `TabSelector.tsx` 3탭으로 수정
   - [ ] `page.tsx` 수정 (3탭 전환)

3. **Phase 3: 스타일링**
   - [ ] 가격 카드 UI
   - [ ] 상승/하락 색상 (빨강/파랑)
   - [ ] 반응형 그리드

### 4.3 환경 변수

```env
# .env.local
COMMODITY_API_KEY=<API_NINJAS_KEY>
```

## 5. API 스펙 (API Ninjas)

### 5.1 엔드포인트

```
GET https://api.api-ninjas.com/v1/commodityprice?name={commodity}
```

### 5.2 요청 헤더

```
X-Api-Key: <YOUR_API_KEY>
```

### 5.3 지원 원자재

| Name | 설명 |
|------|------|
| gold | 금 |
| silver | 은 |
| copper | 구리 |
| crude_oil | WTI 원유 |
| brent_crude_oil | 브렌트 원유 |
| natural_gas | 천연가스 |
| platinum | 백금 |
| palladium | 팔라듐 |

### 5.4 응답 예시

```json
{
  "name": "gold",
  "price": 2045.30,
  "currency": "USD",
  "unit": "ounce"
}
```

## 6. UI 디자인

### 6.1 탭 구조

```
┌─────────┬─────────┬─────────┐
│ 📈 공모주│ 🏠 부동산│ 📊 원자재│
└─────────┴─────────┴─────────┘
```

### 6.2 원자재 카드 레이아웃

```
┌────────────────────────────────────┐
│ 🥇 금 (Gold)                       │
│                                    │
│     $2,045.30 / oz                 │
│     ▲ +15.20 (+0.75%)              │
│                                    │
│     업데이트: 10분 전               │
└────────────────────────────────────┘
```

### 6.3 그리드 레이아웃

```
┌──────────┐ ┌──────────┐
│   금     │ │   은     │
└──────────┘ └──────────┘
┌──────────┐ ┌──────────┐
│  구리    │ │  원유    │
└──────────┘ └──────────┘
```

## 7. 리스크 및 대응

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| API 무료 한도 초과 | 높음 | 캐싱 강화 (10분), Cron Job 활용 |
| API 키 노출 | 높음 | 서버사이드 API Route만 사용 |
| 가격 지연 | 낮음 | 실시간 아님 명시 (10분 지연) |

## 8. 일정 (예상)

| 단계 | 작업 |
|------|------|
| Phase 1 | API 연동 및 백엔드 개발 |
| Phase 2 | UI 컴포넌트 개발 |
| Phase 3 | 스타일링 및 테스트 |

## 9. 참고 자료

- [API Ninjas - Commodity Price API](https://api-ninjas.com/api/commodityprice)
- [Commodities-API](https://commodities-api.com/)
- [금융위원회 일반상품시세정보](https://www.data.go.kr/data/15094805/openapi.do)

---

**문서 버전**: v1.0
**작성일**: 2026-02-04
**상태**: Draft
