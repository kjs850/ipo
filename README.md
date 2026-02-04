# 청약 캘린더 (IPO & Real Estate)

공모주(IPO)와 부동산 청약 정보를 한눈에 확인할 수 있는 통합 대시보드입니다.

## 주요 기능

### 공모주 청약
- **38커뮤니케이션** 데이터 실시간 크롤링
- 수요예측 결과, 청약 일정 통합 뷰
- 투자 매력도 자동 분석 (경쟁률 450:1 이상, 의무보유확약 15% 이상)
- Daum Finance 연동 실시간 주가 및 수익률 표시

### 부동산 청약
- **공공데이터포털 API** (한국부동산원 청약홈) 연동
- 전국 아파트/오피스텔 청약 일정 조회
- 공급세대수, 청약기간, 당첨발표일 확인
- 청약 상태별 시각화 (예정/진행/마감)

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS (Custom)
- **Deployment**: Vercel
- **Data Sources**:
  - 38.co.kr (공모주)
  - 공공데이터포털 API (부동산)

## 로컬 실행

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일에 API 키 입력

# 개발 서버 실행
npm run dev
```

http://localhost:3000 에서 확인

## 환경변수

```env
# 공공데이터포털 - 청약홈 분양정보 API
REAL_ESTATE_API_KEY=your_api_key_here
```

API 키 발급: https://www.data.go.kr/data/15098547/openapi.do

## 배포 (Vercel)

### 자동 배포
GitHub 저장소에 Push하면 자동으로 배포됩니다.

### 환경변수 설정
Vercel 대시보드 → Settings → Environment Variables:
- `REAL_ESTATE_API_KEY`: 공공데이터포털 API 키

### Cron Job
`vercel.json`에 의해 매일 자동 데이터 갱신:
- 오전 7시: 공모주 데이터
- 오전 8시: 부동산 데이터

## 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   ├── ipo/route.ts          # 공모주 API
│   │   └── real-estate/route.ts  # 부동산 API
│   ├── page.tsx                  # 메인 페이지
│   └── layout.tsx
├── components/
│   ├── IPOCalendar.tsx           # 공모주 캘린더
│   ├── RealEstateCalendar.tsx    # 부동산 캘린더
│   ├── TabSelector.tsx           # 탭 전환
│   └── Navbar.tsx
└── lib/
    ├── crawler.ts                # 38.co.kr 크롤러
    └── realEstateCrawler.ts      # 공공데이터 API 클라이언트
```

## 라이선스

MIT
