# 파충류가게 프로젝트 개요

작성 기준일: 2026-04-22

## 한 줄 요약

이 프로젝트는 Next.js 16 + Supabase 기반의 `파충류가게` 멤버 전용 웹서비스다. 일반적인 결제형 쇼핑몰보다는 오프라인 공간의 메뉴 소개, 이벤트 안내, 커뮤니티, 공지, 관리자 운영 기능을 묶은 서비스에 가깝다.

## 저장소 및 깃 상태

- 로컬 경로: `reptile-shop`
- 현재 브랜치: `main`
- 원격 저장소: `https://github.com/woo-skey/reptile-shop.git`
- 최근 커밋 흐름:
  - `2026-04-15`: 팝업 이미지 1:1 비율 보정
  - `2026-04-09`: 팝업 관리자 API 이전, 페이지 속도 개선
  - `2026-04-09`: 메뉴 검색, 페이지네이션, SEO 라우트 추가
  - `2026-04-08`: 메뉴/이벤트 카드 정렬과 UI 다듬기

## 프로젝트 성격

코드를 기준으로 보면 이 서비스의 핵심은 아래 다섯 가지다.

- 홈: 메인 배너, 메인 메뉴 일부, 이벤트 일부, 최근 커뮤니티 글, 최근 공지, 팝업, 메인 공지 배너 노출
- 메뉴: 음식과 주류 메뉴를 카테고리별로 조회
- 이벤트: 이벤트 전용 카드형 페이지 운영
- 커뮤니티: 회원이 글과 댓글을 남기는 단골용 공간
- 관리자 패널: 회원 권한, 게시글, 공지, 메뉴, 홈 공지, 팝업 관리

즉 `온라인 주문/결제` 중심이 아니라 `공간 운영 + 멤버 커뮤니티` 중심 구조다.

## 기술 스택

- 프레임워크: Next.js 16.2.2 App Router
- UI: React 19, Tailwind CSS 4, glass morphism 스타일
- 인증/DB/스토리지: Supabase
- 테마: `next-themes`
- 언어: TypeScript

주요 스크립트는 아래와 같다.

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## 주요 라우트

- `/`: 홈
- `/menu`: 메뉴
- `/event`: 이벤트
- `/community`: 커뮤니티 목록
- `/community/[id]`: 커뮤니티 상세
- `/notice`: 공지 목록
- `/notice/[id]`: 공지 상세
- `/mypage`: 마이페이지
- `/admin`: 관리자 대시보드
- `/admin/users`: 회원 관리
- `/admin/posts`: 커뮤니티 글 관리
- `/admin/notices`: 공지 관리
- `/admin/menu`: 메뉴/이벤트 관리
- `/admin/home-notice`: 메인 공지 배너 관리
- `/admin/popup`: 팝업 관리

## 데이터 구조 추정

코드에서 직접 사용하는 기준으로 핵심 테이블은 아래와 같다.

- `profiles`: 사용자 프로필과 역할
  - `id`, `username`, `display_name`, `role`, `avatar_url`, `created_at`, `updated_at`
- `posts`: 커뮤니티/공지 통합 게시글
  - `author_id`, `type`, `title`, `content`, `image_urls`, `is_pinned`, `created_at`, `updated_at`
- `comments`: 커뮤니티 댓글
  - `post_id`, `author_id`, `content`, `created_at`
- `menu_items`: 메뉴와 이벤트성 항목
  - `category`, `subcategory`, `name`, `description`, `note`, `abv`, `volume_ml`, `price`, `price_glass`, `price_bottle`, `sort_order`, `is_available`, `image_url`, `created_at`
- `popups`: 홈 팝업
  - `title`, `content`, `image_url`, `is_active`, `created_at`
- `home_notice_banner`: 홈 메인 공지 배너
  - `key`, `title`, `content`, `created_at`, `updated_at`

스토리지는 `post-images` 버킷을 사용한다.

## 인증 방식

Supabase Auth를 사용하지만 UI는 이메일 대신 아이디 기반 경험으로 감싼 구조다.

- 로그인 이메일 형식: `{username}@reptile.local`
- 회원가입 시 `display_name`, `username`, `password` 입력
- 관리자 여부는 `profiles.role`로 판별
- `/admin` 계열은 로그인 + 관리자 권한이 모두 필요

즉 사용자는 “아이디/비밀번호 로그인”처럼 느끼지만, 내부적으로는 Supabase 이메일 인증을 활용한다.

## Supabase 연결 상태

코드상으로는 Supabase가 서비스의 핵심 백엔드다.

- SSR 클라이언트: `src/lib/supabase/server.ts`
- 브라우저 클라이언트: `src/lib/supabase/client.ts`
- 비인증 조회용 퍼블릭 클라이언트: `src/lib/supabase/public-server.ts`
- 업로드/관리자 우회 작업: `SUPABASE_SERVICE_ROLE_KEY` 사용

필수 환경변수:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

이 저장소만 기준으로 확실히 말할 수 있는 연결 상태는 아래까지다.

- Supabase 연동 코드는 전체 기능에 깊게 연결되어 있다.
- 운영 프로젝트가 이미 있었다는 전제와 코드 구조가 잘 맞는다.
- 로컬 저장소에는 실제 Supabase URL이나 키가 커밋되어 있지 않다.
- 따라서 현재 로컬 환경에서 어떤 Supabase 프로젝트에 연결되는지는 코드만으로는 확인할 수 없다.

로컬 검증 메모:

- `npm run build`를 실행하면 현재 로컬에서는 `supabaseUrl is required.` 오류로 prerender 단계가 멈춘다.
- 즉 이 체크아웃에는 빌드에 필요한 Supabase 환경변수가 현재 주입되어 있지 않은 상태로 보인다.

## Vercel 연결 상태

코드상으로는 Vercel 배포를 전제로 해도 이상하지 않은 표준 Next.js 구조다.

- `vercel.json`은 없다.
- `.vercel` 디렉터리도 저장소에 없다.
- 별도 서버 설정 파일 없이 Next.js 기본 빌드 흐름을 사용한다.

이 의미는 아래와 같다.

- Vercel 프로젝트 자체는 있을 수 있다.
- 다만 그 연결 정보는 저장소에 커밋된 형태가 아니라 Vercel 대시보드 또는 개인 로컬 설정에 있을 가능성이 높다.
- 저장소만 보고는 현재 어떤 Vercel 프로젝트와 링크되어 있는지 단정할 수 없다.

추가 메모:

- `metadataBase`가 명시되지 않아 로컬 빌드 중 `http://localhost:3000` fallback 경고가 뜬 적이 있다.
- 운영 배포에서는 `NEXT_PUBLIC_SITE_URL`이 정확히 들어가 있어야 소셜 메타 URL이 안정적이다.

## GitHub 연결 상태

로컬 git remote 기준으로 GitHub 연결은 확인된다.

- `origin` fetch/push 모두 `https://github.com/woo-skey/reptile-shop.git`
- 기본 작업 브랜치는 `main`

즉 저장소 자체는 GitHub 원격과 정상적으로 연결된 체크아웃이다.

## SQL 보강 이력

현재 저장소의 `sql` 폴더에는 최근 보강분 두 개가 있다.

- `sql/add_menu_image_url.sql`
  - `menu_items.image_url` 컬럼 추가
- `sql/add_home_notice_banner.sql`
  - `home_notice_banner` 테이블, 트리거, 기본 row, public select policy 추가

이 둘은 초기 스키마 전체라기보다 운영 중 추가된 기능용 변경분으로 보는 것이 자연스럽다.

## 현재 코드베이스 특징

- 홈, 메뉴, 이벤트, 커뮤니티, 공지, 마이페이지, 관리자까지 기능 범위가 넓다.
- 메뉴는 단순 목록이 아니라 카테고리, 사진 뷰, 검색, 정렬 순서를 가진다.
- 이벤트는 `event_post`와 메뉴 내 `event` 카테고리가 나뉘어 있다.
- 팝업과 메인 공지처럼 운영자가 자주 바꿀 수 있는 콘텐츠 관리 기능이 포함돼 있다.
- 커뮤니티는 게시글 + 이미지 업로드 + 댓글 작성/수정/삭제까지 지원한다.

## 로컬 실행 시 유의사항

- `node_modules`는 설치되어 있다.
- `npm run lint`는 실행 가능하다.
- `npm run build`는 현재 로컬 환경변수 부재 시 실패할 수 있다.
- 이 프로젝트는 대부분의 주요 페이지가 Supabase 데이터를 직접 읽으므로, 환경변수 없이 정적 빌드 검증이 어렵다.

## 빠른 결론

이 저장소는 이미 운영 중이던 `파충류가게` 서비스의 실코드로 보이며, GitHub 원격 연결은 로컬에서 확인된다. Supabase와 Vercel도 코드 구조상 강하게 연결되어 있지만, 실제 운영 프로젝트 식별 정보는 저장소에 없어서 현재 로컬만으로는 `어느 프로젝트와 연결되었는지`를 확정할 수는 없다. 다만 기능 구조, 환경변수 의존성, SQL 보강 이력을 보면 `운영 서비스 + 추가 기능 보강이 계속 들어가는 형태`라는 해석이 가장 잘 맞는다.
