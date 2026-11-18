# Fab Tour — 반도체 8대 공정 인터랙티브 도감

2026-2 웹퍼블리싱 기말 프로젝트 · 김무겸

## 실행 방법
- **VS Code → Live Server**로 `index.html`을 연다. (더블클릭으로 열면 `fetch()`가 막혀 오류 안내가 표시됨)
- 배포: GitHub 저장소에 업로드 → Settings → Pages → Branch `main` / `root` 선택

## 폴더 구조
```
fab-tour/
├── index.html        홈 (흐름 바 + 공정 카드 + 필터)
├── process.html      공정 상세 템플릿 (process.html?id=1~8)
├── quiz.html         셀프 퀴즈
├── css/style.css     전체 스타일 (BEM)
├── js/common.js      공통: 다크모드·메뉴 토글, fetchJSON
├── js/index.js       홈 기능
├── js/process.js     상세 페이지 기능
├── js/quiz.js        퀴즈 기능
├── data/processes.json, quiz.json
└── assets/img/       공정 일러스트(SVG), 파비콘
```

## 프로젝트 품질 기준 매핑 (설명서 ③용)

| 기준 | 구현 위치 | 핵심 코드 |
|---|---|---|
| L1 Flexbox | 헤더, 공정 흐름 바 | `.header__inner`, `.flow__list { display:flex; justify-content:space-between; }` |
| L2 Grid | 공정 카드 목록, 세부 단계 | `.catalog__grid { display:grid; grid-template-columns:repeat(3,1fr); }` |
| L3 반응형 | 카드·단계 3열→2열→1열 | `@media (max-width:1024px)`, `(max-width:640px)` |
| L4 Sticky | 상단 헤더 | `.header { position:sticky; top:0; }` |
| L6 BEM/외부 파일 | 전체 | `card__title`, `filter-btn--active` / css·js·data 분리 |
| U1 Transition | 카드·버튼·메뉴 hover | `transition: all 0.3s ease;` |
| U2 Transform | 카드 hover, 활성 단계 | `transform: translateY(-8px) scale(1.02);` |
| U3 JS Toggle | 다크모드, 햄버거 메뉴, 필터 | `document.body.classList.toggle('theme-dark')` |
| U4 setTimeout | 홈 로드 1초 후 환영 토스트, 4초 후 사라짐 | `setTimeout(() => toast.classList.add('toast--show'), 1000)` |
| U5 setInterval | 홈 '오늘의 공정 한 줄', 상세 '세부 단계 재생' (3초) | `setInterval(..., 3000)` |
| U6 clearInterval | ⏸ 일시정지 버튼 | `clearInterval(stepTimer)` |
| U7 Form 검사 | 퀴즈 닉네임·문항 빈 값 경고 | `required`, `<label for>`, 빈 값이면 경고 문구 + 포커스 이동 |
| D1 fetch | 공정·퀴즈 데이터 로드 | `fetch('data/processes.json')` |
| D2 async/await | 모든 `init()` 함수 | `const data = await fetchJSON(url)` |
| D3 JSON | 공통 로더 | `return await response.json()` |
| D4 DOM 생성 | 카드 8장, 흐름 바, 세부 단계, 퀴즈 문항 | `for...of` / `map()`으로 `<article>`, `<li>` 생성 |
| D5 Error | 데이터 로드 실패, 없는 공정 id(`?id=99`) | `try...catch` → `renderError()` 안내 박스 |
| A1 시맨틱 | 전체 | `<header> <nav> <main> <section> <article> <footer> <fieldset>` |
| A2 H1 규칙 | 페이지마다 h1 1개 → h2 → h3 | 홈: 히어로 제목 / 상세: 공정명 / 퀴즈: '셀프 퀴즈' |
| A3 Alt & Focus | 모든 이미지 alt, `:focus-visible` 윤곽선, 본문 바로가기 링크 | `alt="${p.alt}"`, `outline: 3px solid` |
| A4 배포 | GitHub Pages | (배포 후 URL 기입) |

## 공정 상세 페이지 구성
| 대상 | 섹션 | 내용 |
|---|---|---|
| 비전공자 | 💬 쉽게 말하면 | 한 줄 비유 |
| 비전공자 | 🎬 영상으로 보기 | YouTube 영상(입문·현장·심화) 탭, 썸네일 클릭 시 재생, 한국어 자막 자동 ON |
| 비전공자 | 쉬운 해설 자막 | 영상 자막 스타일의 4~5줄 해설 (◀ ▶) |
| 공통 | 공정 개요 · 세부 단계 재생 | 개요 + 3초 자동 재생 단계 |
| 전공자 | 🔬 Deep Dive | 원리·메커니즘, 핵심 수식, 공정 변수 표, 주요 장비, 이슈→원인→해결 표, 최신 트렌드 |
| 전공자 | 🎤 면접 포인트 | `<details>` 아코디언 Q&A |

## 디자인 시스템
- **공정 단계 색상**: 1→8단계가 청록 → 파랑 → 남색 → 보라 → 자홍으로 이어지는 진행 팔레트 (`--step-1` ~ `--step-8`, 흰 글자 대비 확보한 700 톤)
- **진행 표시**: 공정 페이지 상단에 진행 막대(1단계 색 → 현재 단계 색)와 지나온 단계 ✓ / 현재 강조 / 남은 단계 흐림
- **홈 전용 칩 테마**: 어두운 히어로 + 회로 패턴(`circuit-tile-glow.svg`) + 신호가 흐르는 칩 일러스트(`hero-chip.svg`), 본문 배경은 옅은 회로 패턴(`circuit-tile.svg`) — 공정 페이지는 기본 배경

## 사진·영상 출처
**사진 — Wikimedia Commons** (원본 주소로 연결, 각 사진 하단에 저작자·라이선스 표기)

| 공정 | 파일 | 저작자 | 라이선스 |
|---|---|---|---|
| 웨이퍼 제조 | 12-inch_silicon_wafer.jpg | Peellden | CC BY-SA 3.0 |
| 웨이퍼 제조 | Silicon_single_crystal.jpg | Massimiliano Lincetto | CC BY-SA 4.0 |
| 산화 | Centrotherm_diffusion_furnaces_at_LAAS_0481.jpg | Guillaume Paumier | CC BY-SA 3.0 |
| 포토 | Photolithography_lab_in_the_LCN_cleanroom.jpg | UCL Faculty of Mathematical & Physical Sciences | CC BY 2.0 |
| 식각 | Oxygen_Plasma_Cleaning.JPG | Maxfisch | CC0 |
| 식각 | Reactive_Ion_Etcher.JPG | AlabamaUSA | CC BY-SA 3.0 |
| 증착·이온주입 | Chemical_vapour_deposition_machine_in_the_LCN.jpg | UCL Faculty of Mathematical & Physical Sciences | CC BY 3.0 |
| 증착·이온주입 | Ion_implantation_machine_at_LAAS_0522.jpg | Guillaume Paumier | CC BY-SA 3.0 |
| EDS | Wafer_prober_service_configuration.jpg | Ixnayonthetimmay | CC BY-SA 3.0 |
| EDS | Wafer_mit_90_Uc61000_chips.jpg | Eclipse | CC BY-SA 3.0 |
| 패키징 | Integrated_circuit_wire_bonding.jpg | Mister rf | CC BY-SA 4.0 |

**공정 흐름 일러스트 — 직접 제작** (`assets/img/process-1~8.svg`)
- 공정마다 단면 구조가 단계별로 바뀌는 4컷 흐름도, 금속 배선은 트랜지스터~M6 Cu 배선~패드·범프까지의 BEOL 단면 + 듀얼 다마신 4단계
- 상세 페이지 상단과 홈 카드에 사용, 실제 장비 사진은 Deep Dive의 '현장·장비 사진'에 배치
- 사진을 못 불러오면 해당 공정 일러스트로 자동 대체

**영상 — YouTube 공식 채널 임베드** (전부 임베드 허용·한국어 자동 자막 확인)
- 삼성전자 반도체 뉴스룸: 반도체 백과사전 EP.6(8대 공정 요약, 공정별 챕터 시작 시점 지정), '인생맛칩' 공정별 시리즈(PHOTO·ETCH·DIFF·CVD·IMP·METAL·CMP·EDS·패키징), 웨이퍼·식각 쇼츠
- SK하이닉스: 반도체 hy-스쿨2 7교시(Test 공정)

## 동적 상세 페이지 원리
```js
const id = Number(new URLSearchParams(location.search).get('id')) || 1;
const processes = await fetchJSON('data/processes.json');
const p = processes.find((item) => item.id === id);   // 해당 공정만 렌더링
```
공정 8개를 HTML 8개로 만드는 대신, 템플릿 1개 + JSON 데이터로 페이지를 동적 생성한다.
