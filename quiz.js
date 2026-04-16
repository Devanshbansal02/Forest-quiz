/* ============================================================
   NPTEL Forest Sciences MCQ Quiz — quiz.js
   ============================================================ */

// ─── State ───────────────────────────────────────────────────
let allData = [];          // Loaded from MCQ_DATA global (data.js) or fetch fallback
let questions = [];        // Active question list for this session
let currentIdx = 0;        // Current question index
let score = 0;
let sessionResults = [];   // { question, week, yourAnswer, correctAnswer, isCorrect }
let retryData = null;      // Saved {questions, mode} for retry

// ─── DOM ─────────────────────────────────────────────────────
const screens = {
  home:    document.getElementById('screen-home'),
  quiz:    document.getElementById('screen-quiz'),
  results: document.getElementById('screen-results'),
  review:  document.getElementById('screen-review'),
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
  window.scrollTo(0, 0);
}

// Home
const btnFullQuiz   = document.getElementById('btn-full-quiz');
const btnWeekSelect = document.getElementById('btn-week-select');
const weekPicker    = document.getElementById('week-picker');
const weekGrid      = document.getElementById('week-grid');

// Quiz
const progressBar   = document.getElementById('progress-bar');
const progressLabel = document.getElementById('progress-label');
const scoreChip     = document.getElementById('score-chip');
const qWeekTag      = document.getElementById('q-week-tag');
const qNumberTag    = document.getElementById('q-number-tag');
const questionText  = document.getElementById('question-text');
const optionsList   = document.getElementById('options-list');
const feedbackBox   = document.getElementById('feedback-box');
const btnNext       = document.getElementById('btn-next');
const btnQuit       = document.getElementById('btn-quit');

// Results
const resultsEmoji    = document.getElementById('results-emoji');
const scoreDisplay    = document.getElementById('score-display');
const scoreTotalLabel = document.getElementById('score-total-label');
const scoreMessage    = document.getElementById('score-message');
const ringFill        = document.getElementById('ring-fill');
const btnReview       = document.getElementById('btn-review');
const btnHome         = document.getElementById('btn-home');
const btnRetry        = document.getElementById('btn-retry');

// Review
const reviewList        = document.getElementById('review-list');
const mistakeCountBadge = document.getElementById('mistake-count-badge');
const btnBackResults    = document.getElementById('btn-back-results');
const btnHomeFromReview = document.getElementById('btn-home-from-review');

// ─── Load Data ───────────────────────────────────────────────
function loadData() {
  // MCQ_DATA is injected by data.js (avoids CORS issues on file:// protocol)
  if (typeof MCQ_DATA !== 'undefined' && Array.isArray(MCQ_DATA)) {
    allData = MCQ_DATA;
    buildWeekGrid();
  } else {
    // Fallback: try fetch (works on http:// servers)
    fetch('forest_mcq.json')
      .then(r => r.json())
      .then(data => { allData = data; buildWeekGrid(); })
      .catch(e => {
        alert('Could not load quiz data. Please open this page via a local server or ensure data.js is present.');
        console.error(e);
      });
  }
}

// ─── Build Week Buttons ─────────────────────────────────────
function buildWeekGrid() {
  weekGrid.innerHTML = '';
  allData.forEach(weekData => {
    const btn = document.createElement('button');
    btn.className = 'week-btn';
    btn.textContent = `W${weekData.week}`;
    btn.title = `Week ${weekData.week} — ${weekData.questions.length} questions`;
    btn.addEventListener('click', () => startWeekQuiz(weekData.week));
    weekGrid.appendChild(btn);
  });
}

// ─── Home Interactions ──────────────────────────────────────
btnFullQuiz.addEventListener('click', () => {
  weekPicker.classList.add('hidden');
  startFullQuiz();
});

btnWeekSelect.addEventListener('click', () => {
  weekPicker.classList.toggle('hidden');
});

function startFullQuiz() {
  const flat = [];
  allData.forEach(weekData => {
    weekData.questions.forEach(q => {
      flat.push({ ...q, week: weekData.week });
    });
  });
  retryData = { questions: flat, mode: 'full' };
  startQuiz(flat);
}

function startWeekQuiz(weekNum) {
  const weekData = allData.find(w => w.week === weekNum);
  if (!weekData) return;
  const qs = weekData.questions.map(q => ({ ...q, week: weekData.week }));
  retryData = { questions: qs, mode: 'week', weekNum };
  startQuiz(qs);
}

// ─── Start Quiz ─────────────────────────────────────────────
function startQuiz(qs) {
  questions = qs;
  currentIdx = 0;
  score = 0;
  sessionResults = [];
  updateScoreChip();
  showScreen('quiz');
  renderQuestion();
}

// ─── Render Question ────────────────────────────────────────
function renderQuestion() {
  const q = questions[currentIdx];
  const total = questions.length;

  // Progress
  const pct = (currentIdx / total) * 100;
  progressBar.style.width = pct + '%';
  progressLabel.textContent = `Q ${currentIdx + 1} / ${total}`;

  // Meta tags
  qWeekTag.textContent = `Week ${q.week}`;
  qNumberTag.textContent = `Q${q.question_number}`;

  // Question text
  questionText.textContent = q.question;

  // Options
  optionsList.innerHTML = '';
  const optionKeys = ['a', 'b', 'c', 'd'];
  optionKeys.forEach(key => {
    if (!q.options[key]) return;
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.id = `opt-${key}`;
    btn.dataset.key = key;

    const keySpan = document.createElement('span');
    keySpan.className = 'option-key';
    keySpan.textContent = key;

    const textSpan = document.createElement('span');
    textSpan.textContent = q.options[key];

    btn.appendChild(keySpan);
    btn.appendChild(textSpan);
    btn.addEventListener('click', () => handleAnswer(key));
    optionsList.appendChild(btn);
  });

  // Hide feedback & next
  feedbackBox.classList.add('hidden');
  feedbackBox.className = 'feedback-box hidden';
  btnNext.classList.add('hidden');

  // Animate card
  const card = document.getElementById('question-card');
  card.style.animation = 'none';
  card.offsetHeight; // reflow
  card.style.animation = '';
}

// ─── Handle Answer ──────────────────────────────────────────
function handleAnswer(selected) {
  const q = questions[currentIdx];
  const correct = q.correct_answer;
  const isCorrect = selected === correct;

  // Disable all options
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.disabled = true;
    const key = btn.dataset.key;
    if (key === correct) {
      btn.classList.add('correct');
    } else if (key === selected && !isCorrect) {
      btn.classList.add('wrong');
    }
  });

  // Feedback
  feedbackBox.classList.remove('hidden');
  if (isCorrect) {
    feedbackBox.className = 'feedback-box correct-fb';
    feedbackBox.innerHTML = `✅ <strong>Correct!</strong> Well done.`;
    score++;
    updateScoreChip(true);
  } else {
    feedbackBox.className = 'feedback-box wrong-fb';
    feedbackBox.innerHTML = `❌ <strong>Incorrect.</strong> The correct answer is <strong>(${correct}) ${q.options[correct]}</strong>.`;
    updateScoreChip(false);
  }

  // Save result
  sessionResults.push({
    question: q.question,
    week: q.week,
    questionNumber: q.question_number,
    options: q.options,
    yourAnswer: selected,
    correctAnswer: correct,
    isCorrect,
  });

  btnNext.classList.remove('hidden');
  const isLast = (currentIdx === questions.length - 1);
  btnNext.textContent = isLast ? 'See Results 🏆' : 'Next →';
}

function updateScoreChip(pulse = false) {
  scoreChip.textContent = `🏆 ${score}`;
  if (pulse) {
    scoreChip.classList.remove('score-pulse');
    scoreChip.offsetHeight;
    scoreChip.classList.add('score-pulse');
    scoreChip.addEventListener('animationend', () => scoreChip.classList.remove('score-pulse'), { once: true });
  }
}

// ─── Next Button ────────────────────────────────────────────
btnNext.addEventListener('click', () => {
  if (currentIdx < questions.length - 1) {
    currentIdx++;
    renderQuestion();
  } else {
    showResults();
  }
});

// ─── Quit Button ────────────────────────────────────────────
btnQuit.addEventListener('click', () => {
  if (confirm('Are you sure you want to quit? Your progress will be lost.')) {
    weekPicker.classList.add('hidden');
    showScreen('home');
  }
});

// ─── Show Results ────────────────────────────────────────────
function showResults() {
  showScreen('results');
  const total = questions.length;
  const pct   = total > 0 ? score / total : 0;
  const circumference = 2 * Math.PI * 50; // r=50

  scoreDisplay.textContent = score;
  scoreTotalLabel.textContent = `/ ${total}`;

  // Animate ring
  setTimeout(() => {
    const offset = circumference * (1 - pct);
    ringFill.style.strokeDasharray = circumference;
    ringFill.style.strokeDashoffset = offset;

    // Ring colour based on score
    if (pct >= 0.8) { ringFill.style.stroke = '#4ade80'; }
    else if (pct >= 0.5) { ringFill.style.stroke = '#fbbf24'; }
    else { ringFill.style.stroke = '#f87171'; }
  }, 100);

  // Emoji & message
  if (pct === 1)       { resultsEmoji.textContent = '🏆'; scoreMessage.textContent = 'Perfect score! You aced it!'; }
  else if (pct >= 0.8) { resultsEmoji.textContent = '🎉'; scoreMessage.textContent = 'Excellent! You have a solid grasp of the material.'; }
  else if (pct >= 0.6) { resultsEmoji.textContent = '👍'; scoreMessage.textContent = 'Good effort! Review your mistakes to solidify concepts.'; }
  else if (pct >= 0.4) { resultsEmoji.textContent = '📚'; scoreMessage.textContent = 'Keep practising! Revisit the weak areas.'; }
  else                  { resultsEmoji.textContent = '💪'; scoreMessage.textContent = 'Don\'t give up! Every attempt makes you stronger.'; }

  // Percentage text
  const pctRound = Math.round(pct * 100);
  scoreMessage.textContent += ` (${pctRound}%)`;
}

// ─── Results Actions ─────────────────────────────────────────
btnReview.addEventListener('click', showReview);

btnHome.addEventListener('click', () => {
  weekPicker.classList.add('hidden');
  showScreen('home');
});

btnRetry.addEventListener('click', () => {
  if (retryData) {
    startQuiz(retryData.questions);
  }
});

// ─── Show Review ─────────────────────────────────────────────
function showReview() {
  showScreen('review');

  const mistakes = sessionResults.filter(r => !r.isCorrect);
  const count    = mistakes.length;
  mistakeCountBadge.textContent = count === 0 ? 'No mistakes!' : `${count} mistake${count > 1 ? 's' : ''}`;

  reviewList.innerHTML = '';

  if (count === 0) {
    reviewList.innerHTML = `
      <div class="no-mistakes">
        <div class="no-mistakes-icon">🌟</div>
        <h3>Zero Mistakes!</h3>
        <p>You answered every question correctly. Outstanding performance!</p>
      </div>`;
    return;
  }

  mistakes.forEach((r, i) => {
    const card = document.createElement('div');
    card.className = 'review-card';

    const yourText    = r.options[r.yourAnswer]    || '(no answer)';
    const correctText = r.options[r.correctAnswer];

    card.innerHTML = `
      <div class="review-meta">
        <span class="week-tag">Week ${r.week}</span>
        <span class="q-num-tag">Q${r.questionNumber}</span>
        <span class="q-num-tag" style="color:var(--wrong);border-color:rgba(248,113,113,0.3);background:var(--wrong-dim);">✗ Wrong</span>
      </div>
      <p class="review-question">${i + 1}. ${r.question}</p>
      <div class="review-answers">
        <div class="review-answer-row">
          <span class="ra-label your">YOUR ANSWER (${r.yourAnswer.toUpperCase()}):</span>
          <span class="ra-text your">${yourText}</span>
        </div>
        <div class="review-answer-row">
          <span class="ra-label correct">CORRECT (${r.correctAnswer.toUpperCase()}):</span>
          <span class="ra-text correct">${correctText}</span>
        </div>
      </div>
    `;
    reviewList.appendChild(card);
  });
}

btnBackResults.addEventListener('click', () => showScreen('results'));
btnHomeFromReview.addEventListener('click', () => {
  weekPicker.classList.add('hidden');
  showScreen('home');
});

// ─── Boot ────────────────────────────────────────────────────
loadData();
