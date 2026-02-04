# Plan: 부동산 청약 일정 기능

## 1. 개요

### 1.1 기능 설명
기존 공모주(IPO) 청약 일정 대시보드에 **부동산(아파트) 청약 일정** 정보를 추가하여 사용자에게 통합 청약 정보 서비스를 제공한다.

### 1.2 목표
- 공공데이터포털 API를 활용하여 부동산 청약 일정 데이터 수집
- 기존 UI 패턴과 일관된 디자인으로 부동산 청약 캘린더 컴포넌트 개발
- IPO 청약과 부동산 청약을 탭/토글로 구분하여 표시

### 1.3 데이터 소스
| 소스 | URL | 설명 |
|------|-----|------|
| 공공데이터포털 API | https://www.data.go.kr/data/15098547/openapi.do | 한국부동산원 청약홈 분양정보 조회 서비스 |
| 청약홈 (백업) | https://www.applyhome.co.kr | 청약캘린더 (API 불가시 크롤링 고려) |

## 2. 요구사항

### 2.1 기능 요구사항 (FR)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | 공공데이터포털 API로 아파트 분양정보 조회 | P0 (필수) |
| FR-02 | 청약 일정 목록을 카드 형태로 표시 | P0 (필수) |
| FR-03 | IPO/부동산 탭 전환 UI 추가 | P0 (필수) |
| FR-04 | 청약 상태별 시각화 (예정/진행/마감) | P1 (중요) |
| FR-05 | 현재 또는 다가오는 청약으로 자동 스크롤 | P1 (중요) |
| FR-06 | 공급유형별 필터링 (특별공급, 1순위, 2순위 등) | P2 (선택) |
| FR-07 | 지역별 필터링 | P2 (선택) |

### 2.2 비기능 요구사항 (NFR)

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-01 | API 응답 시간 | 5초 이내 |
| NFR-02 | 데이터 캐싱 | 1시간 TTL (기존 패턴 유지) |
| NFR-03 | 에러 핸들링 | API 실패시 빈 목록 + 에러 메시지 |
| NFR-04 | 반응형 디자인 | 모바일/데스크톱 대응 |

## 3. 데이터 구조

### 3.1 API 응답 예상 필드 (공공데이터포털)

```typescript
interface RealEstateSubscription {
  id: string;                    // 공고번호
  name: string;                  // 주택명 (단지명)
  region: string;                // 공급지역명
  location: string;              // 공급위치
  announcementDate: string;      // 모집공고일
  subscriptionStartDate: string; // 청약접수시작일
  subscriptionEndDate: string;   // 청약접수종료일
  winnerAnnouncementDate: string;// 당첨자발표일
  contractStartDate?: string;    // 계약시작일
  contractEndDate?: string;      // 계약종료일
  totalSupply: number;           // 공급세대수
  supplyType: string;            // 공급유형 (특별공급, 1순위, 2순위 등)
  buildingType: string;          // 주택유형 (APT, 오피스텔 등)
  status: string;                // 상태 (예정/진행/마감)
  url?: string;                  // 상세 공고 URL
}
```

### 3.2 UI에 표시할 핵심 정보

| 필드 | 설명 | 표시 방식 |
|------|------|----------|
| name | 단지명 | 카드 제목 |
| region + location | 위치 | 서브 타이틀 |
| subscriptionStartDate ~ subscriptionEndDate | 청약 기간 | 날짜 배지 |
| totalSupply | 공급 세대수 | 숫자 강조 |
| supplyType | 공급 유형 | 태그 |
| status | 상태 | 상태 배지 (색상 구분) |

## 4. 구현 계획

### 4.1 파일 구조

```
src/
├── lib/
│   ├── crawler.ts              # (기존) IPO 크롤러
│   └── realEstateCrawler.ts    # (신규) 부동산 API 클라이언트
├── components/
│   ├── IPOCalendar.tsx         # (기존) 공모주 캘린더
│   ├── RealEstateCalendar.tsx  # (신규) 부동산 캘린더
│   └── TabSelector.tsx         # (신규) IPO/부동산 탭 전환
├── app/
│   ├── page.tsx                # (수정) 탭 전환 로직 추가
│   └── api/
│       ├── ipo/route.ts        # (기존) IPO API
│       └── real-estate/route.ts# (신규) 부동산 API
```

### 4.2 구현 순서

1. **Phase 1: 백엔드 (API)**
   - [ ] 공공데이터포털 API 키 발급 및 설정
   - [ ] `realEstateCrawler.ts` 작성 (API 호출 + 데이터 변환)
   - [ ] `/api/real-estate/route.ts` 엔드포인트 생성
   - [ ] 캐싱 로직 적용

2. **Phase 2: 프론트엔드 (UI)**
   - [ ] `RealEstateCalendar.tsx` 컴포넌트 개발
   - [ ] `TabSelector.tsx` 탭 전환 컴포넌트 개발
   - [ ] `page.tsx` 수정 (탭 통합)

3. **Phase 3: 기능 고도화**
   - [ ] 자동 스크롤 기능
   - [ ] 필터링 기능 (선택사항)
   - [ ] 반응형 스타일링 조정

### 4.3 환경 변수

```env
# .env.local
REAL_ESTATE_API_KEY=<공공데이터포털_API_KEY>
REAL_ESTATE_API_URL=https://api.odcloud.kr/api/...
```

## 5. 리스크 및 대응

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| API 키 발급 지연 | 높음 | 청약홈 직접 크롤링으로 대체 가능 |
| API 호출 제한 (Rate Limit) | 중간 | 캐싱 강화 + Cron Job 활용 |
| 데이터 형식 변경 | 낮음 | 타입 가드 + 에러 로깅 |

## 6. 일정 (예상)

| 단계 | 작업 |
|------|------|
| Phase 1 | API 연동 및 백엔드 개발 |
| Phase 2 | UI 컴포넌트 개발 |
| Phase 3 | 테스트 및 배포 |

## 7. 참고 자료

- [공공데이터포털 - 청약홈 분양정보 API](https://www.data.go.kr/data/15098547/openapi.do)
- [청약홈 공식 사이트](https://www.applyhome.co.kr)
- [청약홈 청약캘린더](https://www.applyhome.co.kr/ai/aib/selectSubscrptCalenderView.do)

---

**문서 버전**: v1.0
**작성일**: 2026-02-04
**상태**: Draft
