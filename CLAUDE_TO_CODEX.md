# Claude -> Codex 전달 메모

작성 기준일: 2026-04-24

이 문서는 Claude Code가 Codex에게 현재 작업 상태, 의사결정, 주의사항을 넘길 때 쓰는 전달용 메모다.
짧게 쓰되, 다음 사람이 바로 이어서 움직일 수 있을 정도로는 남긴다.

## 이 문서의 목적

- Claude Code가 방금 한 작업을 Codex가 빠르게 이어받게 한다.
- 코드 스타일, 운영 규칙, 수동 작업 여부를 놓치지 않게 한다.
- 같은 문제를 중복 조사하거나 이미 끝난 일을 다시 하지 않게 한다.

## 먼저 볼 것

- `CLAUDE.md`
- `CODING_STYLE.md`
- `PROJECT_OVERVIEW.md`
- 필요 시 `docs/TROUBLESHOOTING.md`

## Claude 쪽 기본 작업 규칙

- 응답과 UI 문구는 한국어 기준으로 본다.
- 코드 수정 후에는 가능한 한 검증하고, 이 저장소에서는 기본적으로 commit + push까지 마무리한다.
- SQL 변경은 코드로 우회하지 말고, Supabase SQL Editor에서 실행할 SQL로 남긴다.
- 다크 모드 기본값, glass 스타일, 차분한 관리자 UI를 유지한다.
- 폼 저장 후에는 DB 재조회만 기다리지 말고 로컬 state를 먼저 갱신하는 패턴을 선호한다.

## 지금 Codex가 알면 좋은 컨텍스트

### 최근 반영된 작업

- 홈 메인 배너가 `store_info.hero_image_url`을 읽고, 값이 있으면 signed URL로 렌더링되도록 변경됨
- 관리자 메인 배너 업로드/기본 복귀 UI 추가됨
- `/api/admin/store-info`에서 `hero_image_url` 저장 및 이전 파일 orphan 정리 지원
- `/api/upload`에 `DELETE` 핸들러가 추가되어 업로드 실패 파일 정리에 재사용 가능
- `MenuCalculatorModal`의 lint 오류는 이미 수정됨

### 최근 SQL 상태

아래 컬럼 추가가 필요했으며, 운영 DB에는 이미 반영된 것으로 간주하고 다시 확인 후 작업한다.

```sql
ALTER TABLE store_info ADD COLUMN IF NOT EXISTS hero_image_url text;
```

### 최근 Git / 배포 관련 메모

- 원격 저장소는 `woo-skey/reptile-shop`
- 이 저장소에서는 push까지 끝내는 기대치가 높다
- `gh` / git push 계정은 `woo-skey` 기준으로 맞춰둔 상태다

## Claude가 남길 때 꼭 적을 것

- 이번 작업 목표
- 실제 수정 파일 목록
- 검증 결과 (`npm run lint`, `npm run build`, 수동 확인 등)
- commit hash
- push 여부
- 남은 이슈 / 수동 작업 필요사항

## 빠른 전달 템플릿

```md
## YYYY-MM-DD HH:mm

- 작업 목표:
- 수정 파일:
  - `path/to/file`
- 핵심 변경:
- 검증:
  - `npm run lint`:
  - `npm run build`:
  - 수동 확인:
- commit:
- push:
- 남은 이슈:
- Codex가 바로 보면 좋은 포인트:
```

## 현재 후보 작업

- 업로드 폼 전반을 `raw storage path + renderable URL` 패턴으로 통일
- 업로드 후 저장 실패 시 orphan 파일 cleanup을 이벤트/메뉴/팝업에도 확대
- 팝업 생성/수정 화면도 메인 배너와 같은 이미지 처리 방식으로 맞추기
- 관리자 UI의 영어 문구와 `confirm` / `alert` 의존 정리

