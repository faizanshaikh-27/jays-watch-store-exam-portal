// exam-take.js
let activeExam = null;
let examAnswers = {};
let examTimer = null;
let examTimeLeft = 0;
let examStartTime = null;
let shuffledQuestions = [];

async function startExam(examId) {
  try {
    const exam = await API.getExam(examId);
    activeExam = exam;
    examAnswers = {};

    // Shuffle questions and options for anti-cheat
    shuffledQuestions = shuffle(exam.questions).map(q => {
      const sq = { ...q };
      if (sq.type === 'mcq' && sq.options) sq.options = shuffle(sq.options);
      if (sq.type === 'match_column' && sq.correctPairs) {
        // Shuffle right-side options for display
        sq._rightOptions = shuffle(sq.correctPairs.map(p => p.right));
      }
      return sq;
    });

    el('take-exam-title').textContent = exam.title;
    el('take-exam-info').textContent = `${shuffledQuestions.length} questions · ${exam.totalMarks} marks · ${exam.duration} min`;

    renderExamQuestions();
    renderQuestionNav();

    examTimeLeft = exam.duration * 60;
    examStartTime = Date.now();
    startTimer();

    openModal('modal-exam-take');
  } catch (err) { showToast(err.message || 'Failed to load exam', 'error'); }
}

function startTimer() {
  clearInterval(examTimer);
  updateTimerDisplay();
  examTimer = setInterval(() => {
    examTimeLeft--;
    updateTimerDisplay();
    if (examTimeLeft <= 0) { clearInterval(examTimer); submitExam(true); }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(examTimeLeft / 60).toString().padStart(2, '0');
  const s = (examTimeLeft % 60).toString().padStart(2, '0');
  const timerEl = el('exam-timer');
  timerEl.textContent = `${m}:${s}`;
  timerEl.className = 'exam-timer';
  if (examTimeLeft <= 60) timerEl.classList.add('danger');
  else if (examTimeLeft <= 300) timerEl.classList.add('warning');
}

function renderExamQuestions() {
  const panel = el('exam-questions-panel');
  panel.innerHTML = shuffledQuestions.map((q, i) => `
    <div class="exam-question-item" id="eq_${i}">
      <div class="q-header">
        <div class="q-number">${i + 1}</div>
        <div class="q-text">${escapeHtml(q.question)}</div>
        <div class="q-marks-badge">${q.marks} mark${q.marks > 1 ? 's' : ''}</div>
      </div>
      <div id="qbody_${i}">${renderAnswerInput(q, i)}</div>
    </div>`).join('');
}

function renderAnswerInput(q, i) {
  if (q.type === 'mcq') {
    return `<div class="mcq-options">${(q.options || []).map((opt, oi) => `
      <div class="mcq-option ${examAnswers[q.id] === opt ? 'selected' : ''}" onclick="selectMCQ('${q.id}',${i},'${oi}')">
        <div class="option-indicator"></div>
        <span>${escapeHtml(opt)}</span>
      </div>`).join('')}</div>`;
  }
  if (q.type === 'true_false') {
    return `<div class="tf-options">
      <button class="tf-btn ${examAnswers[q.id] === 'true' ? 'selected' : ''}" onclick="selectTF('${q.id}',${i},'true')">✓ True</button>
      <button class="tf-btn ${examAnswers[q.id] === 'false' ? 'selected' : ''}" onclick="selectTF('${q.id}',${i},'false')">✗ False</button>
    </div>`;
  }
  if (q.type === 'fill_blank' || q.type === 'guess') {
    const placeholder = q.type === 'guess' ? '🤔 Your guess...' : 'Type your answer...';
    return `<input type="text" value="${escapeHtml(examAnswers[q.id] || '')}" placeholder="${placeholder}" style="max-width:400px" oninput="setTextAnswer('${q.id}',${i},this.value)">`;
  }
  if (q.type === 'match_column') {
    const rightOptions = q._rightOptions || (q.correctPairs || []).map(p => p.right);
    const currentAns = examAnswers[q.id] || {};
    return `<div class="match-table">${(q.correctPairs || []).map(pair => `
      <div class="match-row">
        <div class="match-left">${escapeHtml(pair.left)}</div>
        <div class="match-arrow">→</div>
        <select class="select-input match-select" onchange="setMatchAnswer('${q.id}',${i},'${pair.left.replace(/'/g, "\\'")}',this.value)">
          <option value="">Select...</option>
          ${rightOptions.map(opt => `<option value="${escapeHtml(opt)}" ${currentAns[pair.left] === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join('')}
        </select>
      </div>`).join('')}</div>`;
  }
  return '';
}

function selectMCQ(qId, idx, optIdx) {
  const q = shuffledQuestions[idx];
  examAnswers[qId] = q.options[optIdx];
  el(`qbody_${idx}`).innerHTML = renderAnswerInput(q, idx);
  updateNav(idx);
}

function selectTF(qId, idx, val) {
  examAnswers[qId] = val;
  el(`qbody_${idx}`).innerHTML = renderAnswerInput(shuffledQuestions[idx], idx);
  updateNav(idx);
}

function setTextAnswer(qId, idx, val) {
  examAnswers[qId] = val;
  updateNav(idx);
}

function setMatchAnswer(qId, idx, leftKey, val) {
  if (!examAnswers[qId]) examAnswers[qId] = {};
  examAnswers[qId][leftKey] = val;
  updateNav(idx);
}

function updateNav(idx) {
  const qId = shuffledQuestions[idx].id;
  const answered = isAnswered(qId, shuffledQuestions[idx]);
  const navBtn = document.querySelector(`.nav-q-btn[data-idx="${idx}"]`);
  if (navBtn) navBtn.classList.toggle('answered', answered);
}

function isAnswered(qId, q) {
  const ans = examAnswers[qId];
  if (!ans) return false;
  if (q.type === 'match_column') return typeof ans === 'object' && Object.keys(ans).length > 0;
  return ans !== '';
}

function renderQuestionNav() {
  const grid = el('question-nav-grid');
  grid.innerHTML = shuffledQuestions.map((q, i) => `
    <button class="nav-q-btn ${isAnswered(q.id, q) ? 'answered' : ''}" data-idx="${i}" onclick="scrollToQ(${i})">${i + 1}</button>`).join('');
}

function scrollToQ(idx) {
  const el2 = document.getElementById(`eq_${idx}`);
  if (el2) el2.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function confirmSubmitExam() {
  const answered = shuffledQuestions.filter(q => isAnswered(q.id, q)).length;
  const total = shuffledQuestions.length;
  showConfirm(
    'Submit Exam',
    `You answered ${answered}/${total} questions. Submit now?`,
    'Submit',
    'btn-primary',
    () => submitExam(false)
  );
}

async function submitExam(autoSubmit) {
  clearInterval(examTimer);
  const timeTaken = Math.round((Date.now() - examStartTime) / 1000);

  try {
    const result = await API.submitExam({ examId: activeExam.id, answers: examAnswers, timeTaken });
    closeModal('modal-exam-take');
    showToast(autoSubmit ? 'Time up! Exam submitted.' : 'Exam submitted!', 'info');

    // Show result immediately
    await viewResult(result.resultId);

    // Refresh current page
    if (currentUser.role === 'staff') {
      loadStaffExams();
    }
  } catch (err) {
    if (err.message.includes('already submitted')) {
      closeModal('modal-exam-take');
      showToast('This exam was already submitted.', 'info');
    } else {
      showToast(err.message || 'Failed to submit', 'error');
    }
  }
}
