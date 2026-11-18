/* ==========================================================
   quiz.js — 셀프 퀴즈
   - [D1~D5] quiz.json을 불러와 문항 생성
   - [U7] 빈 값 검사 + 경고 메시지, required / label for 연결
   ========================================================== */

const form = document.getElementById('quiz-form');
const questionsBox = document.getElementById('quiz-questions');
const resultBox = document.getElementById('quiz-result');
const nicknameInput = document.getElementById('nickname');
const nicknameError = document.getElementById('nickname-error');

let quizData = [];

/* ---------- [D4] 문항 생성 ---------- */
function renderQuestions(quiz) {
  questionsBox.innerHTML = quiz.map((q, i) => {
    let inputs;
    if (q.type === 'choice') {
      inputs = q.options.map((opt, j) => `
        <div class="quiz__option">
          <input class="quiz__radio" type="radio" id="${q.id}-${j}" name="${q.id}" value="${opt}" required>
          <label class="quiz__option-label" for="${q.id}-${j}">${opt}</label>
        </div>`).join('');
    } else {
      inputs = `
        <label class="quiz__label quiz__label--sr" for="${q.id}-input">답 입력</label>
        <input class="quiz__input" type="text" id="${q.id}-input" name="${q.id}" required placeholder="정답을 입력하세요">`;
    }
    return `
      <fieldset class="quiz__question" id="${q.id}-box">
        <legend class="quiz__legend"><span class="quiz__qnum">Q${i + 1}</span> ${q.question}</legend>
        ${inputs}
        <p class="quiz__error" id="${q.id}-error" aria-live="polite"></p>
      </fieldset>`;
  }).join('');
}

/* ---------- [U7] 유효성 검사 ---------- */
function getAnswer(q) {
  if (q.type === 'choice') {
    const checked = form.querySelector(`input[name="${q.id}"]:checked`);
    return checked ? checked.value : '';
  }
  return form.elements[q.id].value.trim();
}

function validate() {
  let firstInvalid = null;

  // 닉네임 빈 값 검사
  const nickname = nicknameInput.value.trim();
  const nickInvalid = nickname === '';
  nicknameError.textContent = nickInvalid ? '닉네임을 입력해 주세요.' : '';
  nicknameInput.classList.toggle('quiz__input--invalid', nickInvalid);
  nicknameInput.setAttribute('aria-invalid', String(nickInvalid));
  if (nickInvalid) firstInvalid = nicknameInput;

  // 문항별 빈 값 검사
  quizData.forEach((q) => {
    const empty = getAnswer(q) === '';
    const box = document.getElementById(`${q.id}-box`);
    document.getElementById(`${q.id}-error`).textContent = empty ? '이 문항에 답해 주세요.' : '';
    box.classList.toggle('quiz__question--invalid', empty);
    if (empty && !firstInvalid) firstInvalid = box.querySelector('input');
  });

  if (firstInvalid) firstInvalid.focus();           // 첫 번째 빈 칸으로 포커스 이동
  return !firstInvalid;
}

/* ---------- 채점 ---------- */
function grade() {
  let score = 0;
  const rows = quizData.map((q, i) => {
    const user = getAnswer(q);
    // 대소문자·공백·단위(nm) 차이는 정답으로 인정
    const normalize = (s) => s.toLowerCase().replace(/\s|nm/g, '');
    const correct = normalize(user) === normalize(q.answer);
    if (correct) score++;
    document.getElementById(`${q.id}-box`).classList.add(correct ? 'quiz__question--correct' : 'quiz__question--wrong');
    return `
      <li class="result__item ${correct ? 'result__item--correct' : 'result__item--wrong'}">
        <strong>Q${i + 1} ${correct ? '⭕ 정답' : '❌ 오답'}</strong>
        <span>정답: ${q.answer}</span>
        <p class="result__explain">${q.explain}</p>
      </li>`;
  }).join('');

  const nickname = nicknameInput.value.trim();
  const ratio = score / quizData.length;
  const comment = ratio === 1 ? '완벽해요! 클린룸 마스터 🏆' : ratio >= 0.5 ? '좋아요! 틀린 공정만 다시 둘러볼까요?' : '투어를 한 번 더 돌아보면 금방 올라갈 거예요.';

  resultBox.innerHTML = `
    <h2 class="section-title">${nickname}님의 결과: ${score} / ${quizData.length}</h2>
    <p class="result__comment">${comment}</p>
    <ol class="result__list">${rows}</ol>`;
  resultBox.hidden = false;
  resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------- 이벤트 ---------- */
form.addEventListener('submit', (e) => {
  e.preventDefault();
  form.querySelectorAll('.quiz__question').forEach((el) =>
    el.classList.remove('quiz__question--correct', 'quiz__question--wrong'));
  if (validate()) grade();
});

form.addEventListener('reset', () => {
  resultBox.hidden = true;
  form.querySelectorAll('.quiz__error').forEach((el) => (el.textContent = ''));
  form.querySelectorAll('.quiz__question').forEach((el) =>
    el.classList.remove('quiz__question--invalid', 'quiz__question--correct', 'quiz__question--wrong'));
  nicknameInput.classList.remove('quiz__input--invalid');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// 입력하면 해당 문항의 경고를 바로 지움
form.addEventListener('input', (e) => {
  const box = e.target.closest('.quiz__question');
  if (box) {
    box.classList.remove('quiz__question--invalid');
    box.querySelector('.quiz__error').textContent = '';
  } else if (e.target === nicknameInput && nicknameInput.value.trim()) {
    nicknameError.textContent = '';
    nicknameInput.classList.remove('quiz__input--invalid');
  }
});

/* ---------- 초기화 ---------- */
async function init() {
  try {
    quizData = await fetchJSON('data/quiz.json');
    renderQuestions(quizData);
  } catch (error) {
    console.error(error);
    renderError(questionsBox, '퀴즈 문항(quiz.json)을 가져오는 중 문제가 발생했어요.');
    form.querySelector('[type="submit"]').disabled = true;
  }
}

init();
