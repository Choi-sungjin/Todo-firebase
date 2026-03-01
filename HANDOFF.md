# HANDOFF.md

AI(Cursor/GPT)와 사람이 함께 개발할 때 공유하는 문맥 문서.  
**작업할 때마다 이 파일을 먼저 읽고, 작업 후 해당 섹션을 갱신하세요.**

---

## 문서 구조 (목차)

| # | 섹션 | 용도 |
|---|------|------|
| 1 | 목표/범위 | 이번 턴에서 바꿀 것·안 바꿀 것 |
| 2 | 변경 파일 | 수정 대상 파일 경로·역할 |
| 3 | 디자인 결정 | 색·타이포·컴포넌트 규칙 |
| 4 | JS 의존성 | 유지할 id/class, 스크립트 로드 순서 |
| 5 | 다음 작업자 TODO | 이어서 할 일 3~5개 |
| 6 | 금지사항 | 이번 턴에서 건드리지 말 영역 |
| 7 | 파일 구조 변경 소통 규칙 | Cursor 협업용 템플릿·실행 순서 |
| 8 | 대형 서비스 UI 포맷 | Netflix 등 참고 시 시각·컴포넌트 기준 |
| 9 | 롤백 위치/방법 | 복구 절차·Cursor 요청 문장 |

---

## 1. 목표 / 범위

### 이번에 바꾸는 것
- HANDOFF.md 구조 정리(목차 추가), 변경 파일·JS 의존성 목록을 현재 코드베이스와 동기화
- (다음 턴에서 할 일은 `5. 다음 작업자 TODO`에 기록)

### 바꾸지 않는 것
- Firebase 연동 구조 (Realtime Database, suggest.js에서 스크립트 로드)
- 탭 필터 로직 (오늘/내일/전체일정/지난일정)
- 할일 CRUD, 종일 체크박스 ↔ 시간 입력 연동

---

## 2. 변경 파일

| 경로 | 설명 |
|------|------|
| `index.html` | 마크업, 모달/타임피커/날짜선택 팝업 구조 |
| `css/style.css` | 전역·헤더·탭·카드·스케줄·모달·다크테마 |
| `css/motion.css` | 애니메이션 (있을 경우) |
| `js/suggest.js` | 스크립트 로드 순서, 진입점 (keywords/templates fetch 후 storage→schedule→app→time-picker) |
| `js/app.js` | 모달·할일 목록·폼·저장/수정/삭제 |
| `js/schedule.js` | 간트 차트 렌더, 월 이동, 클릭 처리 |
| `js/storage.js` | 로컬/Firebase 저장 |
| `js/time-picker.js` | 원형 시계 타임피커 (시/분 선택, 오전·오후·종일, 적용/취소) |
| `data/keywords.json` | 카테고리 자동 추천용 키워드 (suggest.js에서 fetch) |
| `data/templates.json` | 템플릿 목록 `templates` (suggest.js에서 fetch) |
| `HANDOFF.md` | 협업 문맥·구조 변경 규칙·롤백 방법 |

---

## 3. 디자인 결정

- **폰트**: Pretendard Variable (CDN), fallback `Apple SD Gothic Neo`, `Noto Sans KR`, system-ui
- **색 (라이트)**: `--bg #f8f9fb`, `--card #fff`, `--primary #0b6bcb`, `--primary-hover #095196`, `--text-primary #1a1a1a`, `--separator #e8e8e8`
- **색 (다크)**: `--bg #0f0f0f`, `--card #1a1a1a`, `--primary #4a9eff`, `--separator #2a2a2a`
- **radius**: `--radius-sm` 6px, `--radius-md` 10px, `--radius-lg` 14px, `--radius-xl` 18px
- **타임피커**: 노란 테두리 시간 입력란, 시/분 모드 버튼, 오전/오후/종일 버튼, 종일은 "적용" 시에만 반영
- **카드**: 왼쪽 4px 바 대신 6px 원형 도트로 우선순위 표시, 카드는 1px 테두리 + 호버 시만 그림자
- **탭**: 밑줄 탭(선택 시 `border-bottom` + primary 색), 채워진 pill 사용 안 함

---

## 4. JS 의존성 (건드리면 깨질 수 있는 id / class)

### 반드시 유지할 id
- **헤더/탭**: `theme-toggle`, `header-date`, `open-modal`
- **할일 목록**: `todo-list`, `todo-list-cards`, `empty-state`, `date-filter-bar`, `date-filter-text`, `date-filter-clear`
- **스케줄**: `prev-month`, `next-month`, `current-month-label`, `schedule-chart`
- **모달**: `modal-overlay`, `modal`, `modal-title`, `todo-input`, `autocomplete-list`, `template-suggestion`, `template-name`, `apply-template`, `subtask-suggestion`, `subtask-chips`
- **모달 폼**: `start-date-input`, `deadline-input`, `all-day-checkbox`, `time-inputs-row`, `start-time-input`, `end-time-input`, `category-select`, `priority-select`, `memo-input`, `add-btn`, `close-modal`
- **타임피커**: `time-picker-overlay`, `time-picker-title`, `time-picker-display`, `time-picker-apply`, `time-picker-cancel`, `time-picker-mode-hour`, `time-picker-mode-minute`, `time-picker-am`, `time-picker-pm`, `time-picker-all-day`, `clock-face`, `clock-hand-hour`, `clock-hand-minute`
- **날짜 선택 팝업**: `date-choice-overlay`, `date-choice-title`, `date-choice-view`, `date-choice-add`, `date-choice-close`

### data / class 규칙
- 탭: `.tab`, `data-tab="today|tomorrow|all|past"`, 선택 시 `.active`
- 할일 카드: `.todo-card`, `.priority-high|medium|low`, `.todo-done-toggle.checked`
- **스크립트 로드 순서** (suggest.js 기준): `keywords.json`·`templates.json` fetch 후 → `storage.js` → `schedule.js` → `app.js` → `time-picker.js` (순서 변경 시 오류 가능)

---

## 5. 다음 작업자 TODO (3~5개)

- [ ] `js/` 하위 구조 개편안(예: `core/`, `features/`, `ui/`) 1안 작성
- [ ] 구조 개편안 기준으로 `index.html` script 로드 전략(직접 로드 vs 번들) 결정
- [ ] 경로 변경 시 `7. 파일 구조 변경 소통 규칙` 실행 순서대로 진행 후, 영향 파일(`index.html`, `js/suggest.js`, README) 반영
- [ ] 구조 변경 적용 후 `7. 구조 변경 시 최소 검증 체크리스트` 실행 및 결과 기록
- [ ] 작업 종료 시 HANDOFF.md의 `1. 목표/범위`를 다음 턴 기준으로 갱신

---

## 6. 금지사항 (이 턴에서 건드리지 말 영역)

- Firebase 연동 방식(Realtime Database 연결 흐름) 변경 금지
- `js/storage.js`의 기존 데이터 키 스키마 변경 금지

---

## 7. 파일 구조 변경 소통 규칙 (Cursor 협업용)

파일/폴더를 옮기거나 새로 만들 때는 **코드 수정 전에** 아래 형식으로 먼저 합의합니다.

### 변경 제안 템플릿
- 목적: 왜 구조를 바꾸는지 1~2줄
- 변경 범위: `추가/이동/이름변경/삭제` 대상 경로
- 영향도: 깨질 수 있는 import, script 순서, id/class, 데이터 키
- 롤백 방법: 되돌리는 명령 또는 수동 절차
- 검증 방법: 변경 후 확인할 체크 항목 3개

### 실행 순서
1. `HANDOFF.md`의 `1. 목표/범위`에 이번 구조 변경 목적을 먼저 기록
2. `2. 변경 파일` 표에 신규/이동 경로를 반영
3. Cursor에게 "구조 변경 후 함께 수정할 참조 파일" 목록을 요청
4. 구조 변경 적용 (이동/리네임/생성/삭제)
5. 참조 경로/로드 순서/문서(README, HANDOFF) 동기화
6. 검증 완료 후 `5. 다음 작업자 TODO`와 `6. 금지사항` 갱신

### Cursor에게 요청할 때 쓰는 문장 예시
- "아래 파일 구조 변경안을 기준으로, 깨질 수 있는 참조 경로를 전부 찾아서 수정해줘."
- "script 로드 순서와 JS 의존 id/class가 유지되는지 체크해줘."
- "변경 후 테스트 체크리스트(렌더/입력/저장/수정/삭제) 실행 결과를 요약해줘."

### 구조 변경 시 최소 검증 체크리스트
- `index.html`의 script 로드 순서가 기존 규칙과 일치
- `js/*.js`의 참조 경로 및 모듈/전역 의존성 오류 없음
- 할일 추가/수정/삭제, 타임피커, 탭 필터, 스케줄 렌더 정상 동작

---

## 8. 대형 서비스 느낌 UI 포맷 (현재 구조 기준)

Netflix/대형 서비스처럼 보이게 할 때는 아래 포맷을 기본값으로 사용합니다.

### 시각 시스템 포맷
- 레이아웃: 상단 고정 헤더 + 컨텐츠 최대 폭 `1200~1360px` + 좌우 안전 여백
- 카드: 큰 썸네일형 카드, `12~16px` 라운드, 기본은 얕은 대비, hover 시 `scale(1.02)` + 그림자 강화
- 타이포: 제목/본문/캡션 계층 3단 고정, 숫자/메타 정보는 대비 낮춤
- 간격: 4px 배수 스케일 (`4/8/12/16/24/32/48`)만 사용
- 컬러: 배경은 다크 그라데이션 계열, 액션 색은 1개(primary) + 상태 색(성공/경고/위험) 분리
- 모션: 페이지 진입 200~300ms, 카드 hover 120~180ms, 모달 180~220ms

### 컴포넌트 포맷
- 헤더: 브랜드/날짜/핵심 액션(추가, 테마 토글) 우선 배치
- 탭: 가로 스크롤 가능한 카테고리 바, 선택 상태는 underline + 색 대비
- 리스트: 카드 그리드(데스크탑 3~4열, 태블릿 2열, 모바일 1열)
- 모달: 배경 블러 + 명확한 CTA(저장/취소), 입력 필드 높이 일관화
- 빈 상태: 아이콘 + 1문장 안내 + 바로 실행 버튼 1개

### 구현 대상 파일 (현재 구조 매핑)
- `index.html`: 레이아웃 구획(헤더/탭/리스트/모달) 및 접근성 속성
- `css/style.css`: 디자인 토큰, 레이아웃, 카드, 탭, 모달, 반응형
- `css/motion.css`: 진입/hover/모달 트랜지션 타이밍
- `js/app.js`, `js/schedule.js`: 상태 class 토글(hover/active/empty-state)

---

## 9. 롤백 위치 / 방법

구조/디자인 변경 후 이상이 생기면 아래 순서로 롤백합니다.

### 롤백 기준 위치
- 1순위: 변경 직전 커밋 (`git log --oneline`으로 확인)
- 2순위: `HANDOFF.md`의 직전 확정 버전(목표/변경 파일/금지사항 기준)
- 3순위: 핵심 파일 백업본 (`index.html`, `css/style.css`, `css/motion.css`, `js/app.js`, `js/schedule.js`)

### 롤백 절차 (비파괴 우선)
1. 현재 변경사항 확인: `git status`
2. 문제 범위만 선택 복구: `git restore --source <commit> -- index.html css/style.css css/motion.css js/app.js js/schedule.js`
3. 로드 순서/핵심 기능 재검증: 탭, CRUD, 타임피커, 스케줄 렌더
4. `HANDOFF.md`에 롤백 사유/범위/결과 기록

### Cursor 전달용 롤백 요청 문장
- "아래 커밋 기준으로 UI 변경 파일만 선택 롤백해줘. 데이터 스키마와 Firebase 연결은 유지해."
- "롤백 후 깨진 참조 경로와 script 로드 순서까지 함께 검증해줘."

---

*마지막 업데이트: 2026-03-01, Cursor 턴 – 목차 추가, 변경 파일·JS 의존성 목록 동기화, 섹션 5·7 연계 명시*
