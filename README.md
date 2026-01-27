This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# IPO Data Dashboard

대한민국 공모주(IPO) 정보를 실시간으로 크롤링하고, 투자 판단을 돕는 대시보드입니다.

## 🚀 배포 가이드 (Vercel)

이 프로젝트는 [Vercel](https://vercel.com)에 최적화되어 있습니다.

### 1. 자동 배포 (권장)
GitHub 저장소에 Push하면 자동으로 배포되도록 설정합니다.

1. Vercel 대시보드 접속
2. **Add New...** > **Project** 클릭
3. `kjs850/ipo` 저장소 Import
4. **Deploy** 클릭

### 2. 수동 배포 (문제 발생 시)
GitHub 연동이 원활하지 않을 경우, 터미널에서 직접 배포할 수 있습니다.

```bash
# 1. Vercel CLI로 로그인
npx vercel login

# 2. 프로덕션 배포
npx vercel --prod
```

### 3. Cron Job (자동 업데이트)
`vercel.json`에 의해 매일 **오전 9시, 오후 9시**에 데이터가 자동 갱신됩니다.
별도의 설정이 필요 없습니다.

## 🛠 로컬 실행

```bash
npm install
npm run dev
```

## 📝 주요 기능
- **38커뮤니케이션** 데이터 실시간 크롤링
- 수요예측 결과, 청약 일정 통합 뷰
- 투자 매력도 자동 분석 (경쟁률 450:1 이상 등 하이라이트)
