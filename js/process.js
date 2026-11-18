/* ==========================================================
   process.js — 공정 상세 템플릿 (process.html?id=N)
   - URL 파라미터로 공정 id를 읽어 해당 데이터만 렌더링
   - [D1~D5] fetch / async·await / json / DOM 생성 / 오류 처리
   - [U3] 영상 탭 전환, 썸네일 클릭 시 YouTube 플레이어로 교체(classList)
   - [U5][U6] 세부 단계 3초 자동 재생 + 정지/재생
   ========================================================== */

const STAGE_LABEL = { front: '전공정', back: '후공정' };
const STEP_INTERVAL = 3000;

const root = document.getElementById('detail-root');
const miniFlow = document.getElementById('mini-flow');

let stepTimer = null;
let stepIndex = 0;

/* ---------- 공통: 사진이 안 열리면 SVG 일러스트로 대체 ---------- */
function attachImageFallback(fallbackSrc) {
  root.querySelectorAll('img[data-fallback]').forEach((img) => {
    img.addEventListener('error', () => {
      img.src = fallbackSrc;
      img.closest('figure')?.classList.add('photo--fallback');
    }, { once: true });
  });
}

function photoFigure(ph, fallback, extraClass = '') {
  return `
    <figure class="photo ${extraClass}">
      <img class="photo__img" src="${ph.src}" alt="${ph.alt}" loading="lazy" data-fallback="${fallback}">
      <figcaption class="photo__caption">
        ${ph.caption}
        <span class="photo__credit">사진: ${ph.author} ·
          <a href="${ph.page}" target="_blank" rel="noopener">Wikimedia Commons</a> · ${ph.license}</span>
      </figcaption>
    </figure>`;
}

/* ---------- 미니 흐름 바 (현재 공정 강조) ---------- */
function renderMiniFlow(processes, currentId) {
  // 지나온 단계(done) · 현재(current) · 남은 단계(todo)로 진행 상태 표시
  const state = (id) => (id < currentId ? 'done' : id === currentId ? 'current' : 'todo');
  miniFlow.innerHTML = processes.map((p) => `
    <li class="flow__item">
      <a class="flow__link flow__link--${state(p.id)}"
         href="process.html?id=${p.id}" style="--accent:${p.color}"
         ${p.id === currentId ? 'aria-current="step"' : ''}>
        <span class="flow__num">${p.id < currentId ? '✓' : p.id}</span>
        <span class="flow__name">${p.name}</span>
      </a>
    </li>`).join('');

  // 진행 막대: 1단계 색 → 현재 단계 색 그라데이션
  const current = processes.find((p) => p.id === currentId);
  const ratio = (currentId / processes.length) * 100;
  miniFlow.insertAdjacentHTML('beforebegin', `
    <div class="progress" aria-label="전체 공정 중 ${currentId}단계">
      <span class="progress__label">공정 진행 <strong>${currentId} / ${processes.length}</strong></span>
      <div class="progress__track">
        <span class="progress__bar" style="width:${ratio}%; background:linear-gradient(90deg, ${processes[0].color}, ${current.color})"></span>
      </div>
    </div>`);
}

/* ---------- [D4] 상세 내용 렌더링 ---------- */
function renderDetail(p, prev, next) {
  document.title = `${p.name} 공정 | Fab Tour`;
  document.body.style.setProperty('--accent', p.color);

  // 웨이퍼처럼 heroPhoto가 있으면 실제 사진을 대표로, 나머지 사진은 Deep Dive의 '현장·장비 사진'으로
  const photos = p.photos || [];
  const mainPhoto = p.heroPhoto ? photos[0] : null;
  const morePhotos = p.heroPhoto ? photos.slice(1) : photos;

  const stepsHTML = p.steps.map((s, i) => `
    <li class="player__step" data-index="${i}">
      <span class="player__step-num">STEP ${i + 1}</span>
      <h3 class="player__step-title">${s.title}</h3>
      <p class="player__step-desc">${s.desc}</p>
    </li>`).join('');

  const videoTabs = p.videos.map((v, i) => `
    <button class="video__tab ${i === 0 ? 'video__tab--active' : ''}" type="button"
            data-index="${i}" aria-pressed="${i === 0}">
      <span class="video__level">${v.level}</span>${v.title}
    </button>`).join('');

  const d = p.deep;
  const paramsRows = d.params.map((r) => `<tr><th scope="row">${r.name}</th><td>${r.desc}</td></tr>`).join('');
  const issueRows = d.issues.map((r) => `<tr><th scope="row">${r.issue}</th><td>${r.cause}</td><td>${r.solution}</td></tr>`).join('');
  const equipHTML = d.equipment.map((e) => `<li class="chips__item">${e}</li>`).join('');
  const trendHTML = d.trends.map((t) => `<li>${t}</li>`).join('');
  const pointsHTML = p.keyPoints.map((k) => `<li class="points__item">${k}</li>`).join('');
  // 유형별 심화: 그룹마다 탭(상세) ↔ 표(한눈에 비교) 전환
  const groupsHTML = (d.groups || []).map((g, gi) => `
    <div class="types" data-group="${gi}">
      <div class="types__head">
        <h4 class="types__title">${g.title}</h4>
        <button class="types__toggle" type="button" aria-pressed="false">표로 한눈에 비교</button>
      </div>
      <p class="types__intro">${g.intro}</p>
      <div class="types__tabs" role="tablist" aria-label="${g.title} 유형">
        ${g.types.map((t, ti) => `
          <button class="types__tab ${ti === 0 ? 'types__tab--active' : ''}" type="button" role="tab"
                  aria-selected="${ti === 0}" data-index="${ti}">${t.name}</button>`).join('')}
      </div>
      <div class="types__panel" role="tabpanel" aria-live="polite"></div>
      <div class="table-wrap types__table">
        <table class="table">
          <thead><tr><th scope="col">방식</th><th scope="col">핵심 원리</th><th scope="col">장점</th><th scope="col">한계</th><th scope="col">주 용도</th></tr></thead>
          <tbody>${g.types.map((t) => `
            <tr><th scope="row">${t.name}<span class="types__en">${t.en}</span></th>
              <td>${t.principle}</td><td>${t.pros}</td><td>${t.cons}</td><td>${t.use}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`).join('');

  const interviewHTML = d.interview.map((it, i) => `
    <details class="qa" ${i === 0 ? 'open' : ''}>
      <summary class="qa__q">Q. ${it.q}</summary>
      <p class="qa__a">${it.a}</p>
    </details>`).join('');

  root.innerHTML = `
    <article class="detail__article">
      <header class="detail__hero ${mainPhoto ? '' : 'detail__hero--text'}">
        <div class="detail__text">
          <span class="card__badge card__badge--${p.stage}">${STAGE_LABEL[p.stage]} · ${p.id} / 8</span>
          <h1 class="detail__title">${p.name}</h1>
          <p class="detail__en">${p.nameEn}</p>
          <p class="detail__summary">${p.summary}</p>
        </div>
        ${mainPhoto ? photoFigure(mainPhoto, p.image, 'photo--hero') : ''}
      </header>

      <!-- 공정 흐름 일러스트 (단면도 4컷 / 금속 배선은 BEOL 단면) -->
      <figure class="flowfig">
        <img class="flowfig__img" src="${p.image}" alt="${p.alt}" width="960" height="540">
        <figcaption class="flowfig__caption">공정 흐름 일러스트 · Fab Tour 제작</figcaption>
      </figure>

      <!-- 비전공자: 비유 + 영상 + 해설 자막 -->
      <section class="detail__section easy" aria-labelledby="easy-title">
        <p class="easy__tag">01 · 비전공자도 OK</p>
        <h2 class="section-title" id="easy-title">💬 쉽게 말하면</h2>
        <p class="easy__analogy">${p.easy.analogy}</p>
      </section>

      <section class="detail__section video" aria-labelledby="video-title">
        <h2 class="section-title" id="video-title" data-label="02 · VIDEO">🎬 영상으로 보기</h2>
        <p class="section-desc">썸네일을 누르면 재생돼요. 한국어 자막(자동 생성)이 켜진 상태로 시작하며, 플레이어의 CC 버튼으로 끌 수 있어요.</p>
        <div class="video__tabs" role="group" aria-label="영상 선택">${videoTabs}</div>
        <div class="video__frame" id="video-frame"></div>
        <p class="video__meta" id="video-meta"></p>

        <div class="subtitle" aria-labelledby="subtitle-label">
          <p class="subtitle__label" id="subtitle-label">쉬운 해설 자막 <span id="subtitle-count"></span></p>
          <p class="subtitle__line" id="subtitle-line" aria-live="polite"></p>
          <div class="subtitle__controls">
            <button class="subtitle__btn" type="button" id="subtitle-prev" aria-label="이전 자막">◀</button>
            <button class="subtitle__btn" type="button" id="subtitle-next" aria-label="다음 자막">▶</button>
          </div>
        </div>
      </section>

      <section class="detail__section overview" aria-labelledby="about-title">
        <h2 class="section-title" id="about-title" data-label="03 · OVERVIEW">공정 개요</h2>
        <p class="detail__desc">${p.description}</p>
      </section>

      <section class="detail__section player" aria-labelledby="player-title">
        <div class="player__head">
          <h2 class="section-title" id="player-title" data-label="04 · STEP PLAYER">세부 단계 재생</h2>
          <div class="player__controls">
            <button class="player__btn" type="button" id="step-toggle">⏸ 일시정지</button>
            <button class="player__btn player__btn--ghost" type="button" id="step-restart">↺ 처음부터</button>
          </div>
        </div>
        <div class="player__progress" aria-hidden="true"><span class="player__bar" id="step-bar"></span></div>
        <ol class="player__steps" id="step-list" aria-live="polite">${stepsHTML}</ol>
      </section>

      <!-- 전공자: 포트폴리오 수준 심화 정리 -->
      <section class="detail__section deep" aria-labelledby="deep-title">
        <p class="easy__tag easy__tag--deep">05 · 전공자 Deep Dive</p>
        <h2 class="section-title" id="deep-title">🔬 원리와 메커니즘</h2>
        <p class="detail__desc">${d.principle}</p>

        ${groupsHTML ? `<h3 class="deep__subtitle">유형별 심화</h3>${groupsHTML}` : ''}

        <h3 class="deep__subtitle">핵심 수식 · 포인트</h3>
        <ul class="points">${pointsHTML}</ul>

        <div class="deep__grid">
          <div>
            <h3 class="deep__subtitle">핵심 공정 변수</h3>
            <table class="table">
              <thead><tr><th scope="col">변수 · 지표</th><th scope="col">의미</th></tr></thead>
              <tbody>${paramsRows}</tbody>
            </table>
          </div>
          <div>
            <h3 class="deep__subtitle">주요 장비</h3>
            <ul class="chips">${equipHTML}</ul>
            ${morePhotos.length ? '<h3 class="deep__subtitle">현장·장비 사진</h3>' : ''}
            ${morePhotos.map((ph) => photoFigure(ph, p.image, 'photo--sub')).join('')}
          </div>
        </div>

        <h3 class="deep__subtitle">이슈 → 원인 → 해결</h3>
        <div class="table-wrap">
          <table class="table table--issues">
            <thead><tr><th scope="col">이슈</th><th scope="col">원인</th><th scope="col">해결 방향</th></tr></thead>
            <tbody>${issueRows}</tbody>
          </table>
        </div>

        <h3 class="deep__subtitle">최신 트렌드</h3>
        <ul class="trends">${trendHTML}</ul>
      </section>

      <section class="detail__section interview" aria-labelledby="qa-title">
        <h2 class="section-title" id="qa-title" data-label="06 · INTERVIEW">🎤 면접 포인트</h2>
        <p class="section-desc">질문을 눌러 모범 답변을 펼쳐 보세요.</p>
        ${interviewHTML}
      </section>

      <nav class="pager" aria-label="이전·다음 공정">
        ${prev ? `<a class="pager__link" href="process.html?id=${prev.id}">← ${prev.id}. ${prev.name}</a>` : '<span></span>'}
        ${next
          ? `<a class="pager__link pager__link--next" href="process.html?id=${next.id}">${next.id}. ${next.name} →</a>`
          : '<a class="pager__link pager__link--next" href="quiz.html">투어 완료! 퀴즈 풀기 →</a>'}
      </nav>
    </article>`;

  attachImageFallback(p.image);
}

/* ---------- [U3] 영상: 탭 전환 + 클릭하면 재생 ---------- */
function setupVideos(videos) {
  const frame = document.getElementById('video-frame');
  const meta = document.getElementById('video-meta');
  const tabs = document.querySelectorAll('.video__tab');

  // 썸네일(가벼운 이미지)만 먼저 보여 주고, 클릭 시 실제 플레이어(iframe)로 교체
  const showThumbnail = (v) => {
    frame.classList.remove('video__frame--playing');
    frame.innerHTML = `
      <button class="video__facade" type="button" aria-label="${v.title} 영상 재생">
        <img class="video__thumb" src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="${v.title} 영상 썸네일" loading="lazy">
        <span class="video__play" aria-hidden="true">▶</span>
        ${v.start ? `<span class="video__start">${Math.floor(v.start / 60)}:${String(v.start % 60).padStart(2, '0')}부터 재생</span>` : ''}
      </button>`;
    meta.innerHTML = `<strong>${v.title}</strong> · ${v.channel} ·
      <a href="https://www.youtube.com/watch?v=${v.id}${v.start ? `&t=${v.start}s` : ''}" target="_blank" rel="noopener">YouTube에서 보기</a>`;

    frame.querySelector('.video__facade').addEventListener('click', () => {
      const params = new URLSearchParams({
        autoplay: '1', start: String(v.start || 0), rel: '0',
        cc_load_policy: '1', cc_lang_pref: 'ko', hl: 'ko',
      });
      frame.innerHTML = `
        <iframe class="video__iframe" src="https://www.youtube-nocookie.com/embed/${v.id}?${params}"
          title="${v.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
      frame.classList.add('video__frame--playing');
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle('video__tab--active', on);
        t.setAttribute('aria-pressed', String(on));
      });
      showThumbnail(videos[Number(tab.dataset.index)]);
    });
  });

  showThumbnail(videos[0]);
}

/* ---------- [U3] 유형별 심화: 탭 전환 + 표 보기 토글 ---------- */
function setupTypes(groups) {
  document.querySelectorAll('.types').forEach((box) => {
    const g = groups[Number(box.dataset.group)];
    const panel = box.querySelector('.types__panel');
    const tabs = box.querySelectorAll('.types__tab');

    const show = (i) => {
      const t = g.types[i];
      tabs.forEach((tab, k) => {
        tab.classList.toggle('types__tab--active', k === i);
        tab.setAttribute('aria-selected', String(k === i));
      });
      panel.innerHTML = `
        <p class="types__name">${t.name} <span class="types__en">${t.en}</span></p>
        <p class="types__principle">${t.principle}</p>
        <dl class="types__facts">
          <div class="types__fact types__fact--pros"><dt>장점</dt><dd>${t.pros}</dd></div>
          <div class="types__fact types__fact--cons"><dt>한계</dt><dd>${t.cons}</dd></div>
          <div class="types__fact types__fact--use"><dt>주 용도</dt><dd>${t.use}</dd></div>
        </dl>`;
    };

    tabs.forEach((tab) => tab.addEventListener('click', () => show(Number(tab.dataset.index))));

    const toggle = box.querySelector('.types__toggle');
    toggle.addEventListener('click', () => {
      const isTable = box.classList.toggle('types--table');       // ← classList.toggle
      toggle.setAttribute('aria-pressed', String(isTable));
      toggle.textContent = isTable ? '탭으로 자세히 보기' : '표로 한눈에 비교';
    });

    show(0);
  });
}

/* ---------- 쉬운 해설 자막 (이전/다음) ---------- */
function setupSubtitles(lines) {
  const lineEl = document.getElementById('subtitle-line');
  const countEl = document.getElementById('subtitle-count');
  let i = 0;
  const show = () => {
    lineEl.classList.remove('subtitle__line--in');
    void lineEl.offsetWidth;
    lineEl.textContent = lines[i];
    lineEl.classList.add('subtitle__line--in');
    countEl.textContent = `${i + 1} / ${lines.length}`;
  };
  document.getElementById('subtitle-prev').addEventListener('click', () => { i = (i - 1 + lines.length) % lines.length; show(); });
  document.getElementById('subtitle-next').addEventListener('click', () => { i = (i + 1) % lines.length; show(); });
  show();
}

/* ---------- [U5][U6] 세부 단계 자동 재생 ---------- */
function highlightStep(total) {
  document.querySelectorAll('.player__step').forEach((el, i) => {
    el.classList.toggle('player__step--active', i === stepIndex);
    el.classList.toggle('player__step--done', i < stepIndex);
  });
  document.getElementById('step-bar').style.width = `${((stepIndex + 1) / total) * 100}%`;
}

function setupPlayer(total) {
  const toggleBtn = document.getElementById('step-toggle');
  const restartBtn = document.getElementById('step-restart');

  const play = () => {
    stepTimer = setInterval(() => {                  // U5. 3초마다 다음 단계
      stepIndex = (stepIndex + 1) % total;
      highlightStep(total);
    }, STEP_INTERVAL);
    toggleBtn.textContent = '⏸ 일시정지';
  };
  const pause = () => {
    clearInterval(stepTimer);                        // U6. 자동 재생 중단
    stepTimer = null;
    toggleBtn.textContent = '▶ 재생';
  };

  toggleBtn.addEventListener('click', () => (stepTimer ? pause() : play()));
  restartBtn.addEventListener('click', () => {
    pause();
    stepIndex = 0;
    highlightStep(total);
    play();
  });

  // 단계를 직접 클릭하면 그 단계로 이동하고 멈춤
  document.querySelectorAll('.player__step').forEach((el) => {
    el.addEventListener('click', () => {
      pause();
      stepIndex = Number(el.dataset.index);
      highlightStep(total);
    });
  });

  highlightStep(total);
  play();
}

/* ---------- 초기화 ---------- */
async function init() {
  const id = Number(new URLSearchParams(location.search).get('id')) || 1;

  try {
    const processes = await fetchJSON('data/processes.json');
    const index = processes.findIndex((p) => p.id === id);

    if (index === -1) {
      // 존재하지 않는 id → 사용자 안내 (D5와 같은 맥락의 예외 처리)
      throw new Error(`id=${id} 에 해당하는 공정이 없어요. 1~${processes.length} 사이의 공정을 선택해 주세요.`);
    }

    const p = processes[index];
    renderMiniFlow(processes, id);
    renderDetail(p, processes[index - 1], processes[index + 1]);
    setupVideos(p.videos);
    setupTypes(p.deep.groups || []);
    setupSubtitles(p.easy.captions);
    setupPlayer(p.steps.length);
  } catch (error) {
    console.error(error);
    renderError(root, error.message);
    root.insertAdjacentHTML('beforeend', '<p class="status__back"><a class="btn btn--primary" href="index.html">홈으로 돌아가기</a></p>');
  }
}

init();
