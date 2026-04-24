# Codex -> Claude 전달 메모

작성 기준일: 2026-04-24

이 문서는 Codex가 Claude Code에게 현재 작업 상태, 변경 이유, 다음 액션을 넘길 때 쓰는 전달용 메모다.
추상적인 설명보다, 바로 이어서 실행 가능한 정보 위주로 적는다.

## 이 문서의 목적

- Codex가 파악한 코드베이스 관례를 Claude가 바로 이어받게 한다.
- 최근 수정 내용과 미완료 이슈를 빠르게 공유한다.
- "왜 이렇게 바꿨는지"와 "다음에 뭘 하면 되는지"를 남긴다.

## 먼저 볼 것

- `AGENTS.md`
- `CLAUDE.md`
- `CODING_STYLE.md`
- `PROJECT_OVERVIEW.md`

## Codex 쪽 기본 작업 관점

- 큰 리팩터링보다 현재 구조에 맞는 보수적인 수정부터 선호한다.
- 서버 컴포넌트에서 데이터 fetch, 클라이언트 컴포넌트에서 인터랙션 처리하는 패턴을 유지한다.
- Next.js 관련 수정 전에는 `AGENTS.md` 지침대로 `node_modules/next/dist/docs/`의 관련 문서를 먼저 확인한다.
- dirty worktree가 있어도 남의 변경을 되돌리지 않고, 필요한 파일만 좁게 수정한다.
- 가능하면 lint / build까지 검증하고, 이 저장소에서는 기본적으로 commit + push까지 끝내는 쪽으로 움직인다.

## Claude가 알면 좋은 현재 컨텍스트

### 최근 Codex 작업 요약

- 홈 배너가 DB의 `hero_image_url`을 우선 사용하고, 없으면 기본 이미지로 fallback 되도록 정리
- `MainBannerForm` 저장 직후 signed URL 미리보기가 안정적으로 보이도록 수정
- 배너 업로드 후 저장 실패 시 `/api/upload DELETE`로 orphan cleanup 추가
- `MenuCalculatorModal`의 hooks lint 문제 해결
- 홈에서 팝업 이미지와 hero 이미지 signed URL 변환을 병렬 처리

### 최근 완료 커밋

- `bb24922 Add configurable main banner`
- `bdd21a7 Fix banner upload flow and calculator lint`

### 현재 남은 개선 후보

- 이벤트/메뉴/팝업 업로드 폼들이 아직 public URL 저장 패턴과 orphan cleanup 누락을 갖고 있음
- `PostEditForm`은 cleanup을 client-side Supabase remove에 의존하고 있어 RLS에 막힐 수 있음
- 일부 관리자 UI 문구가 영어로 남아 있음
- `confirm` / `alert` 기반 UX가 관리자 화면 곳곳에 남아 있음
- 자주 열리는 페이지에 `select('*')`가 많아 payload를 줄일 여지가 있음

## Codex가 남길 때 꼭 적을 것

- 무엇을 바꿨는지 한 문장
- 수정한 파일
- 왜 이렇게 했는지
- 확인한 것과 확인 못 한 것
- commit / push 상태
- Claude가 다음에 바로 할 수 있는 일

## 빠른 전달 템플릿

```md
## YYYY-MM-DD HH:mm

- 한 줄 요약:
- 수정 파일:
  - `path/to/file`
- 변경 이유:
- 검증:
  - `npm run lint`:
  - `npm run build`:
  - 수동 확인:
- commit:
- push:
- 미완료 / 리스크:
- Claude 다음 액션 제안:
```

## 실무 팁

- SQL 변경이 필요한 기능이면, 코드 수정과 별개로 Supabase SQL Editor용 SQL 문장을 같이 남긴다.
- 배포/빌드 실패가 나면 기능 버그와 환경변수 누락을 먼저 분리해서 본다.
- 이미지 저장은 가능하면 "DB에는 raw path 저장, 렌더링 시 signed/public URL 변환" 쪽으로 맞추는 것이 지금 구조와 가장 잘 맞는다.

