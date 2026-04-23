# 트러블슈팅

프로젝트 운영 중 해결한 비자명한 문제들의 기록. 같은 문제를 두 번 파지 않기 위한 참고.

---

## 1. 모달 배경이 투명해서 뒤 배경이 비치는 문제

**기록일**: 2026-04-23
**최종 커밋**: `099a96b`
**영향 범위**: 관리자 메뉴/이벤트/팝업 편집 모달, 홈 팝업, 이벤트 상세 모달

### 증상

- 관리자에서 메뉴 아이템 `Edit` 버튼 클릭 → 열린 편집 모달 안에 뒤 페이지의 메뉴 리스트가 그대로 비쳐 보임.
- 다크/라이트 테마 양쪽에서 재현됨.
- 리스트 뷰와 그리드 뷰 모두 동일.

### 원인

원인이 하나가 아니라 **여러 레이어가 겹쳐** 있었음. 디버깅하며 차례로 벗겨냄.

1. **`.glass-card` 클래스가 반투명**
   - `background: rgba(255,255,255,0.06)` (라이트) / `rgba(0,0,0,0.25)` (다크).
   - 평범한 카드용 스타일을 모달에도 그대로 써서 오버레이 위에 얹을 때 뒷 페이지가 비쳤음.
2. **`var(--background)` CSS 변수 기반 inline style이 특정 조건에서 무효화**
   - `style={{ backgroundColor: 'var(--background)' }}`가 DOM에는 들어가지만 실제 computed style이 적용되지 않는 케이스가 있었음. 원인 정확히 특정 못함 — Tailwind v4 theme inline 토큰 처리나 cascade와 관련된 것으로 추정.
3. **Vercel 스냅샷 URL로 테스트하면서 최신 코드가 반영 안 된다는 착각**
   - 각 배포는 `reptile-shop-<hash>-woo-skeys-projects.vercel.app` 형태의 **immutable URL**을 받음. 이 URL은 영구적으로 그 시점의 배포만 가리킴.
   - 프로덕션 alias `reptile-shop.vercel.app`은 자동으로 최신 배포로 바뀌지만, 다른 스냅샷 URL에 직접 접속하면 수정이 반영 안 된 것처럼 보임.
4. **브라우저 CSS/JS 캐시**
   - 하드 새로고침 없이 재확인하면 이전 번들이 적용됨.

### 해결

최종적으로 들어간 3중 방어가 전부 필요했던 건 아닐 수 있지만 확실한 불투명을 보장하려 중첩 적용.

**1) 모달 전용 `.glass-modal` CSS 클래스 신설 (`src/app/globals.css`)**

```css
.glass-modal {
  background-color: #F5F0E8 !important;
  border: 1px solid rgba(201, 162, 39, 0.35);
  border-radius: 0.75rem;
  box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.6);
}
:root.dark .glass-modal {
  background-color: #1A1A0F !important;
  border-color: rgba(201, 162, 39, 0.3);
}
```

- `!important`를 붙여 어떤 규칙도 배경을 덮지 못하게 고정.

**2) Tailwind 임의 hex 유틸을 모달 className에 병기**

```tsx
className="glass-modal ... bg-[#F5F0E8] dark:bg-[#1A1A0F]"
```

- CSS 변수(`var(--background)`) 의존을 제거하고 class로 컴파일된 hex를 직접 심음.

**3) 편집 모달을 React Portal로 `<body>`에 렌더링 (`MenuEditModalButton.tsx`)**

```tsx
{open && typeof document !== 'undefined' && createPortal(
  <div className="fixed inset-0 z-50 ...">...</div>,
  document.body
)}
```

- `<table>/<td>` 같은 특수 컨텍스트에 걸쳐 있을 때 `position: fixed` 오버레이가 stacking context에 갇히는 경우 대비.

### 검증 순서

1. 하드 새로고침(`Cmd + Shift + R`).
2. 여전히 이상하면 **시크릿 창**에서 접속해 캐시 배제.
3. 그래도 이상하면 Chrome DevTools → Elements 탭에서 `<div role="dialog">`의 class에 `bg-[#1A1A0F]`가 있는지 확인. 없으면 JS 번들이 오래된 것.
4. Computed 탭에서 `background-color` 값이 `rgb(26, 26, 15)` 또는 `rgb(245, 240, 232)`으로 찍히는지 확인. 아니면 CSS 자체가 무효화된 것.

### 교훈

- **Vercel 테스트는 반드시 `reptile-shop.vercel.app` (프로덕션 alias)로**. 해시가 붙은 스냅샷 URL은 디버깅 외엔 사용 금지.
- **CSS 변수 기반 inline style은 100% 신뢰하기 어려움**. 테마 전환이 필요할 땐 Tailwind `dark:` variant + 임의 hex 유틸을 우선 고려.
- **모달은 Portal 기본 채택이 안전**. table/flex/transform 조상이 언제든 stacking context를 만들 수 있음.
- **`glass-card`와 같은 반투명 유틸을 오버레이 위 컨테이너에 그대로 쓰지 말 것**. 반드시 불투명 배경을 강제하는 별도 클래스를 사용.

### 관련 파일

- `src/app/globals.css` — `.glass-modal` 정의
- `src/components/menu/MenuEditModalButton.tsx` — Portal 적용
- `src/components/menu/MenuAddModalButton.tsx`
- `src/components/event/EventEditModalButton.tsx`
- `src/components/event/EventWriteModalButton.tsx`
- `src/components/event/EventDetailModal.tsx`
- `src/components/admin/PopupEditModalButton.tsx`
- `src/components/HomePopup.tsx`
