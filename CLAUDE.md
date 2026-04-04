# 파충류가게 — Claude 작업 규칙

## 작업 방식

- 코드 수정 후 반드시 `npm run build` 빌드 확인 → 통과 시 자동 commit + push
- SQL 변경이 필요하면 코드로 직접 수정하지 말고, SQL 문을 제공해서 Supabase SQL Editor에서 실행하도록 안내
- 모든 응답은 한국어로

## UI / 디자인

- UI 라벨에 이모지 사용 금지 → 인디고 도트(·) 사용
  ```tsx
  <span className="text-indigo-400/70 mr-1">·</span>향
  ```
- 다크 모드 기본값 유지 (첫 방문 포함)
- 라이트/다크 모드 양쪽 지원
- Glass morphism 디자인 시스템(glass-card, glass-input) 유지

## 버그 방지 패턴

- 확장 카드 그리드는 반드시 `items-start` 추가
- 필터/검색/정렬 변경 시 반드시 `setPage(1)` 호출
- 확장 카드 데이터 fetch 시 `if (!data[id])` 캐시 가드 쓰지 말 것 → `useEffect` 패턴 사용
- 폼 제출 후 DB re-fetch 기다리지 말고 로컬 state 즉시 업데이트

## 코드 작성 규칙

- 중첩 select 결과는 `as unknown as T[]` 패턴 사용
- JSX 내 따옴표 직접 사용 금지 → `&ldquo;` `&rdquo;` 사용
- `localStorage` 접근 시 `typeof window !== "undefined"` 체크

## 디자인 시스템

### 색상 (tailwind.config.ts에 정의)

| 이름 | 값 | 용도 |
|------|-----|------|
| reptile-green | `#456132` | 메인 컬러 |
| reptile-gold | `#C9A227` | 강조 (버튼, 보더) |
| reptile-yellow | `#F5D76E` | 서브 강조 |
| reptile-cream | `#F5F0E8` | 라이트모드 배경 |
| reptile-dark | `#1A1A0F` | 다크모드 배경 |

### Glass Morphism 클래스 (globals.css에 정의)

```css
.glass-card   — 카드 컨테이너
.glass-input  — 인풋 필드
```

### 폰트

- Playfair Display — 영문 제목
- Noto Serif KR — 한국어 본문
- IM Fell English — 장식용 영문

## 인증 전략

- Supabase Auth는 이메일 필수 → 내부적으로 `{아이디}@reptile.local` fake email 사용
- 회원가입 폼: 이름(display_name), 아이디(username), 비밀번호(password)
- Supabase 대시보드에서 이메일 확인(Confirm email) **반드시 OFF**

## 환경변수 (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 페이지 구조

| 경로 | 이름 | 접근 |
|------|------|------|
| `/` | 홈 | 전체 |
| `/community` | 커뮤니티 | 읽기: 전체 / 쓰기: 로그인 |
| `/notice` | 공지 | 읽기: 전체 / 쓰기: 관리자 |
| `/mypage` | 마이페이지 | 로그인 필요 |
| `/admin` | 관리자 | 관리자 전용 |
