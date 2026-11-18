/* ==========================================================
   index.js — 홈 페이지
   - [D1~D5] processes.json을 불러와 흐름 바와 카드 목록 생성
   - [U3] 전공정/후공정 필터 (classList.toggle)
   - [U4] setTimeout 환영 토스트
   - [U5][U6] 3초 간격 문구 자동 전환 + 정지/재생
   ========================================================== */

const STAGE_LABEL = { front: '전공정', back: '후공정' };

const flowList = document.getElementById('flow-list');
const grid = document.getElementById('catalog-grid');
const filterBtns = document.querySelectorAll('.filter-btn');
const tickerText = document.getElementById('ticker-text');
const tickerBtn = document.getElementById('ticker-toggle');

let tickerTimer = null;   // setInterval ID 보관
let tickerIndex = 0;

/* ---------- [D4] 흐름 바 생성 ---------- */
function renderFlow(processes) {
  flowList.innerHTML = '';
  for (const p of processes) {
    const li = document.createElement('li');
    li.className = 'flow__item';
    li.innerHTML = `
      <a class="flow__link" href="process.html?id=${p.id}" style="--accent:${p.color}">
        <span class="flow__num">${p.id}</span>
        <span class="flow__name">${p.name}</span>
      </a>`;
    flowList.appendChild(li);
  }
}

/* ---------- [D4] 공정 카드 생성 ---------- */
function renderCards(processes) {
  grid.innerHTML = '';
  processes.forEach((p) => {
    const article = document.createElement('article');
    article.className = 'card';
    article.dataset.stage = p.stage;
    article.style.setProperty('--accent', p.color);
    // 대표 이미지: 실제 사진 지정 공정(웨이퍼)은 사진, 나머지는 공정 흐름 일러스트
    const photo = p.heroPhoto ? p.photos[0] : null;
    article.innerHTML = `
      <a class="card__link" href="process.html?id=${p.id}">
        <img class="card__img ${photo ? '' : 'card__img--diagram'}" src="${photo ? photo.thumb : p.image}" alt="${photo ? photo.alt : p.alt}" loading="lazy" width="400" height="260">
        <div class="card__body">
          <span class="card__badge card__badge--${p.stage}">${STAGE_LABEL[p.stage]}</span>
          <h3 class="card__title"><span class="card__num">${String(p.id).padStart(2, '0')}</span> ${p.name}</h3>
          <p class="card__en">${p.nameEn}</p>
          <p class="card__summary">${p.summary}</p>
          <span class="card__more">자세히 보기 →</span>
        </div>
      </a>`;
    article.querySelector('.card__img').addEventListener('error', (e) => { e.target.src = p.image; }, { once: true });
    grid.appendChild(article);
  });
}

/* ---------- [U3] 필터: 선택된 분류만 보이도록 클래스 토글 ---------- */
function setupFilters() {
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const stage = btn.dataset.stage;

      filterBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('filter-btn--active', active);
        b.setAttribute('aria-pressed', String(active));
      });

      grid.querySelectorAll('.card').forEach((card) => {
        const hide = stage !== 'all' && card.dataset.stage !== stage;
        card.classList.toggle('card--hidden', hide);
      });
    });
  });
}

/* ---------- [U5][U6] 오늘의 공정 한 줄 — 3초 자동 전환 ---------- */
function showTicker(processes) {
  const p = processes[tickerIndex];
  tickerText.classList.remove('ticker__text--in');
  void tickerText.offsetWidth;                       // 애니메이션 재시작용
  tickerText.innerHTML = `<strong>${p.name}</strong> — ${p.summary}`;
  tickerText.classList.add('ticker__text--in');
}

function startTicker(processes) {
  tickerTimer = setInterval(() => {                  // U5. 3초마다 반복
    tickerIndex = (tickerIndex + 1) % processes.length;
    showTicker(processes);
  }, 3000);
  tickerBtn.textContent = '⏸';
  tickerBtn.setAttribute('aria-label', '자동 전환 일시정지');
}

function stopTicker() {
  clearInterval(tickerTimer);                        // U6. 자동 반복 중단
  tickerTimer = null;
  tickerBtn.textContent = '▶';
  tickerBtn.setAttribute('aria-label', '자동 전환 재생');
}

function setupTicker(processes) {
  showTicker(processes);
  startTicker(processes);
  tickerBtn.addEventListener('click', () => {
    tickerTimer ? stopTicker() : startTicker(processes);
  });
}

/* ---------- [U4] 로드 1초 후 환영 토스트, 4초 뒤 사라짐 ---------- */
function showWelcomeToast() {
  const toast = document.getElementById('welcome-toast');
  const start = () => setTimeout(() => {
    toast.classList.add('toast--show');
    setTimeout(() => toast.classList.remove('toast--show'), 4000);
  }, 1000);
  // 인트로가 재생 중이면 인트로가 끝난 뒤에 토스트 시작
  if (window.introDone) start();
  else window.addEventListener('introdone', start, { once: true });
}

/* ---------- [D2] async/await로 전체 흐름 정리 + [D5] try...catch ---------- */
async function init() {
  showWelcomeToast();
  try {
    const processes = await fetchJSON('data/processes.json');
    renderFlow(processes);
    renderCards(processes);
    setupFilters();
    setupTicker(processes);
  } catch (error) {
    console.error(error);
    renderError(grid, '공정 목록(processes.json)을 가져오는 중 문제가 발생했어요.');
    flowList.innerHTML = '';
    tickerText.textContent = '데이터를 불러오지 못했어요.';
    tickerBtn.hidden = true;
  }
}

init();
