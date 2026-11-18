/* ==========================================================
   common.js — 모든 페이지 공통 기능
   - [U3] 다크 모드 / 모바일 메뉴 토글 (classList.toggle)
   - [D1][D2][D3][D5] fetchJSON: fetch + async/await + response.json() + 오류 처리
   ========================================================== */

const THEME_KEY = 'fabtour-theme';

/* ---------- [D1~D3, D5] 공통 JSON 로더 ---------- */
async function fetchJSON(url) {
  const response = await fetch(url);                // D1. 외부 JSON 요청
  if (!response.ok) {                                // 404 등은 직접 에러로 던짐
    throw new Error(`HTTP ${response.status} — ${url}`);
  }
  return await response.json();                      // D3. JSON → JS 객체
}

/* 오류 안내 메시지 (D5에서 사용) */
function renderError(container, message) {
  container.innerHTML = `
    <div class="status status--error" role="alert">
      <p class="status__title">⚠️ 데이터를 불러오지 못했어요</p>
      <p class="status__desc">${message}</p>
      <p class="status__hint">VS Code의 Live Server로 열었는지, 또는 배포된 주소로 접속했는지 확인해 주세요.</p>
    </div>`;
}

/* ---------- [U3] 다크 모드 토글 ---------- */
function setupThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const applyIcon = () => {
    const isDark = document.body.classList.contains('theme-dark');
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.setAttribute('aria-pressed', String(isDark));
    btn.setAttribute('aria-label', isDark ? '라이트 모드 전환' : '다크 모드 전환');
  };

  // 저장된 테마 복원 (브라우저 저장소가 막혀 있어도 페이지는 동작하도록 try...catch)
  try {
    if (localStorage.getItem(THEME_KEY) === 'dark') document.body.classList.add('theme-dark');
  } catch (e) { /* 무시 */ }
  applyIcon();

  btn.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('theme-dark');   // ← classList.toggle
    applyIcon();
    try { localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light'); } catch (e) { /* 무시 */ }
  });
}

/* ---------- [U3] 모바일 햄버거 메뉴 토글 ---------- */
function setupMenuToggle() {
  const btn = document.getElementById('menu-toggle');
  const nav = document.getElementById('site-nav');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('header__nav--open');      // ← classList.toggle
    btn.setAttribute('aria-expanded', String(isOpen));
    btn.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
    btn.textContent = isOpen ? '✕' : '☰';
  });

  // 메뉴 링크를 누르면 자동으로 닫기
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (nav.classList.contains('header__nav--open')) btn.click();
    });
  });
}

/* ---------- 푸터 연도 ---------- */
function setupYear() {
  document.querySelectorAll('.js-year').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

setupThemeToggle();
setupMenuToggle();
setupYear();
