/* ==========================================================
   intro.js — 첫 접속 인트로 애니메이션 (index.html)
   웨이퍼 드로잉 → 다이(칩) 점등 → 회로 발광 → 칩 확대 → 타이틀·로딩 → 화면 분리
   - [U4] setTimeout으로 단계별 연출과 자동 종료
   - [U5][U6] setInterval로 공정 이름 로딩 표시, 종료 시 clearInterval
   - 같은 세션에서는 한 번만 재생, 건너뛰기 버튼·Esc 지원, '동작 줄이기' 설정 존중
   ========================================================== */

(function () {
  const INTRO_KEY = 'fabtour-intro-seen';
  const intro = document.getElementById('intro');
  const html = document.documentElement;

  const finish = () => {
    window.introDone = true;
    window.dispatchEvent(new Event('introdone'));
  };

  // 인트로를 건너뛰는 경우: 이미 봤거나, 동작 줄이기 설정, 요소 없음
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!intro || html.classList.contains('intro-seen') || reduce) {
    intro?.remove();
    html.classList.remove('intro-playing');
    finish();
    return;
  }

  html.classList.add('intro-playing');            // 스크롤 잠금

  /* ---- 1. 웨이퍼 위 다이(칩) 격자 생성: 중심에서 바깥으로 물결처럼 점등 ---- */
  const grid = intro.querySelector('#intro-dies');
  const CX = 200, CY = 200, R = 158, SIZE = 22, GAP = 3;
  for (let y = CY - R; y < CY + R; y += SIZE + GAP) {
    for (let x = CX - R; x < CX + R; x += SIZE + GAP) {
      const mx = x + SIZE / 2, my = y + SIZE / 2;
      const dist = Math.hypot(mx - CX, my - CY);
      if (dist + SIZE * 0.7 > R) continue;          // 웨이퍼 원 안쪽만
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', SIZE);
      rect.setAttribute('height', SIZE);
      rect.setAttribute('rx', 2);
      rect.setAttribute('class', 'intro__die');
      rect.style.animationDelay = `${0.6 + dist / 260}s`;   // 거리 비례 지연 → 물결
      grid.appendChild(rect);
    }
  }

  /* ---- 2. 공정 이름 로딩 표시 (setInterval) ---- */
  const steps = ['웨이퍼 제조', '산화', '포토', '식각', '증착 & 이온주입', '금속 배선', 'EDS', '패키징'];
  const label = intro.querySelector('#intro-step');
  const bar = intro.querySelector('#intro-bar');
  let i = 0;
  let stepTimer = null;
  const timers = [];

  timers.push(setTimeout(() => {
    stepTimer = setInterval(() => {
      label.textContent = `${String(i + 1).padStart(2, '0')} ${steps[i]}`;
      bar.style.width = `${((i + 1) / steps.length) * 100}%`;
      i++;
      if (i >= steps.length) clearInterval(stepTimer);
    }, 150);
  }, 2300));

  /* ---- 3. 종료: 화면이 위아래로 갈라지며 본문 공개 ---- */
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    timers.forEach(clearTimeout);
    clearInterval(stepTimer);
    intro.classList.add('intro--open');
    html.classList.remove('intro-playing');
    try { sessionStorage.setItem(INTRO_KEY, '1'); } catch (e) { /* 무시 */ }
    setTimeout(() => { intro.remove(); finish(); }, 900);
  };

  timers.push(setTimeout(close, 4300));           // 자동 종료
  intro.querySelector('#intro-skip').addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();

/* 푸터의 '인트로 다시 보기' */
document.getElementById('intro-replay')?.addEventListener('click', () => {
  try { sessionStorage.removeItem('fabtour-intro-seen'); } catch (e) { /* 무시 */ }
  window.scrollTo(0, 0);
  location.reload();
});
