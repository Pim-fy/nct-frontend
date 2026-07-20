# nct-frontend

React 19 + Tailwind CSS v4 + JSX 기반 프론트엔드 프로젝트

## 기술 스택

- **React** 19
- **Tailwind CSS** v4 (vite plugin 방식)
- **React Router DOM** v7
- **TanStack Query** v5
- **Axios**
- **Vite** 8
- **JavaScript (JSX)** - TypeScript 미사용

## 시작하기

```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 환경 변수

`.env.example`을 복사하여 `.env` 파일을 생성 후 값을 설정하세요.

```bash
cp .env.example .env
```

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `VITE_API_URL` | 백엔드 API 서버 주소 | `http://localhost:8080` |
| `VITE_AI_API_URL` | AI 서버 주소 | `http://localhost:8090` |
| `VITE_KAKAO_MAP_KEY` | 카카오 지도 API 키 | - |

## 프로젝트 구조

```
src/
├── api/              # API 함수 모음
├── assets/           # 정적 자원 (CSS, 폰트, 이미지)
├── components/       # 재사용 컴포넌트
│   ├── admin/        # 어드민 전용 컴포넌트
│   ├── card/         # 카드 컴포넌트
│   ├── common/       # 공통 컴포넌트
│   ├── Icon/         # 아이콘 컴포넌트
│   ├── modules/      # 기능별 모듈 컴포넌트
│   ├── mypage/       # 마이페이지 컴포넌트
│   └── skeleton/     # 스켈레톤 로딩 컴포넌트
├── context/          # React Context
├── hooks/            # 커스텀 훅
├── layouts/          # 레이아웃 컴포넌트
│   └── user/
│       ├── headers/  # 헤더 컴포넌트
│       └── footers/  # 푸터 컴포넌트
├── pages/            # 페이지 컴포넌트
│   ├── admin/        # 관리자 페이지
│   ├── aiplan/       # AI 플랜 페이지
│   ├── area/         # 지역 목록/상세
│   ├── auth/         # 인증 페이지
│   ├── customersupport/ # 고객센터
│   ├── error/        # 에러 페이지
│   ├── landing/      # 랜딩 페이지
│   ├── main/         # 메인 페이지
│   ├── search/       # 검색 페이지
│   ├── showcase/     # 커뮤니티
│   └── user/         # 사용자 페이지
├── routes/           # 라우트 설정
└── utils/            # 유틸리티 함수
```

## Path Alias

| Alias | 경로 |
|-------|------|
| `@` | `src/` |
| `@assets` | `src/assets/` |
| `@components` | `src/components/` |
| `@modules` | `src/components/modules/` |
| `@pages` | `src/pages/` |
| `@utils` | `src/utils/` |
| `@hooks` | `src/hooks/` |
| `@context` | `src/context/` |
| `@routes` | `src/routes/` |
| `@layouts` | `src/layouts/` |
| `@api` | `src/api/` |

## 라우트 구조

| 레이아웃 | 경로 | 접근 권한 |
|---------|------|---------|
| `LandingLayout` | `/` | 공개 |
| `UserLayout` | `/:region`, `/search/*`, `/showcase/*`, `/customersupport/*` 등 | 공개 |
| `UserLayout` (Protected) | `/user/mypage`, `/showcase/*/write`, `/plan` | 로그인 필요 |
| `AdminLayout` | `/admin/*` | ROLE_ADMIN |
