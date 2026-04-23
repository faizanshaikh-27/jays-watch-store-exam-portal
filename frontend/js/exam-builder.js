// exam-builder.js
let builderQuestions = [];
let editingExamId = null;

function switchBuilderTab(tab) {
  document.querySelectorAll('.builder-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  el(`builder-${tab}`).classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(b => { if (b.textContent.includes(tab === 'details' ? 'Exam Details' : 'Question')) b.classList.add('active'); });
  updateQCount();
}

function updateQCount() {
  el('q-count').textContent = builderQuestions.length;
}

async function showExamBuilder(examId) {
  editingExamId = examId;
  builderQuestions = [];

  el('builder-title').textContent = examId ? 'Edit Exam' : 'Create New Exam';
  el('exam-title').value = '';
  el('exam-description').value = '';
  el('exam-duration').value = '30';
  el('exam-total-marks').value = '';
  el('exam-passing-marks').value = '';
  el('exam-status').value = 'draft';
  el('questions-builder-list').innerHTML = '';

  if (examId) {
    try {
      const exam = await API.getExam(examId);
      el('exam-title').value = exam.title;
      el('exam-description').value = exam.description || '';
      el('exam-duration').value = exam.duration;
      el('exam-total-marks').value = exam.totalMarks;
      el('exam-passing-marks').value = exam.passingMarks;
      el('exam-status').value = exam.status;
      builderQuestions = exam.questions.map(q => ({ ...q }));
      renderBuilderQuestions();
    } catch { showToast('Failed to load exam', 'error'); return; }
  }

  switchBuilderTab('details');
  openModal('modal-exam-builder');
  updateQCount();
}

function addQuestion(type) {
  const q = { id: `q_${Date.now()}`, type, question: '', marks: 1 };
  if (type === 'mcq') { q.options = ['', '', '', '']; q.correctAnswer = ''; }
  else if (type === 'fill_blank') { q.correctAnswer = ''; }
  else if (type === 'true_false') { q.correctAnswer = 'true'; }
  else if (type === 'guess') { q.correctAnswer = ''; }
  else if (type === 'match_column') { q.correctPairs = [{ left: '', right: '' }, { left: '', right: '' }]; }
  builderQuestions.push(q);
  renderBuilderQuestions();
  updateQCount();
  switchBuilderTab('questions');
  // Scroll to bottom
  setTimeout(() => {
    const list = el('questions-builder-list');
    list.scrollTop = list.scrollHeight;
  }, 100);
}

function removeQuestion(idx) {
  builderQuestions.splice(idx, 1);
  renderBuilderQuestions();
  updateQCount();
}

function renderBuilderQuestions() {
  const container = el('questions-builder-list');
  const hint = el('no-questions-hint');
  if (!builderQuestions.length) { container.innerHTML = ''; hint.style.display = 'block'; return; }
  hint.style.display = 'none';

  container.innerHTML = builderQuestions.map((q, i) => `
    <div class="question-block" id="qblock_${i}">
      <div class="question-block-header">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="color:var(--text-muted);font-size:0.82rem;font-family:'DM Mono',monospace">#${i + 1}</span>
          <span class="question-type-label">${getTypeLabel(q.type)}</span>
        </div>
        <button class="btn btn-sm btn-danger" onclick="removeQuestion(${i})">✕ Remove</button>
      </div>
      <div class="form-group">
        <label>Question Text *</label>
        <textarea rows="2" placeholder="Enter question..." oninput="updateQ(${i},'question',this.value)">${escapeHtml(q.question)}</textarea>
      </div>
      ${renderQuestionEditor(q, i)}
      <div class="q-marks-row">
        <label>Marks:</label>
        <input type="number" value="${q.marks}" min="1" style="width:70px" oninput="updateQ(${i},'marks',parseInt(this.value)||1)">
      </div>
    </div>`).join('');
}

function getTypeLabel(type) {
  const labels = { mcq: 'Multiple Choice', fill_blank: 'Fill in the Blank', true_false: 'True / False', guess: 'Guess the Answer', match_column: 'Match the Column' };
  return labels[type] || type;
}

function renderQuestionEditor(q, i) {
  if (q.type === 'mcq') {
    return `
      <div class="form-group">
        <label>Options (click circle to mark correct)</label>
        ${(q.options || ['', '', '', '']).map((opt, oi) => `
          <div class="option-row">
            <button type="button" class="option-correct ${q.correctAnswer === opt && opt ? 'selected' : ''}" onclick="setCorrectMCQ(${i}, ${oi})" title="Mark as correct"></button>
            <input type="text" value="${escapeHtml(opt)}" placeholder="Option ${oi + 1}" style="flex:1" oninput="updateMCQOption(${i}, ${oi}, this.value)">
            ${(q.options.length > 2) ? `<button class="btn btn-sm btn-ghost" onclick="removeMCQOption(${i}, ${oi})">✕</button>` : ''}
          </div>`).join('')}
        <button class="btn btn-sm btn-ghost" style="margin-top:6px" onclick="addMCQOption(${i})">+ Add Option</button>
      </div>`;
  }
  if (q.type === 'fill_blank') {
    return `<div class="form-group"><label>Correct Answer *</label><input type="text" value="${escapeHtml(q.correctAnswer || '')}" placeholder="Exact answer" oninput="updateQ(${i},'correctAnswer',this.value)"></div>`;
  }
  if (q.type === 'true_false') {
    return `<div class="form-group"><label>Correct Answer</label>
      <div style="display:flex;gap:10px">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;text-transform:none;letter-spacing:0;font-weight:400">
          <input type="radio" name="tf_${i}" value="true" ${q.correctAnswer === 'true' ? 'checked' : ''} onchange="updateQ(${i},'correctAnswer','true')"> True
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;text-transform:none;letter-spacing:0;font-weight:400">
          <input type="radio" name="tf_${i}" value="false" ${q.correctAnswer === 'false' ? 'checked' : ''} onchange="updateQ(${i},'correctAnswer','false')"> False
        </label>
      </div></div>`;
  }
  if (q.type === 'guess') {
    return `<div class="form-group"><label>Correct Answer (Hint: word/phrase to guess) *</label><input type="text" value="${escapeHtml(q.correctAnswer || '')}" placeholder="The answer to guess" oninput="updateQ(${i},'correctAnswer',this.value)"></div>`;
  }
  if (q.type === 'match_column') {
    return `
      <div class="form-group">
        <label>Match Pairs (Left → Right)</label>
        ${(q.correctPairs || []).map((pair, pi) => `
          <div class="pair-row">
            <input type="text" value="${escapeHtml(pair.left)}" placeholder="Left item" oninput="updatePair(${i},${pi},'left',this.value)">
            <span class="pair-sep">→</span>
            <input type="text" value="${escapeHtml(pair.right)}" placeholder="Right item" oninput="updatePair(${i},${pi},'right',this.value)">
            ${(q.correctPairs.length > 2) ? `<button class="btn btn-sm btn-ghost" onclick="removePair(${i},${pi})">✕</button>` : ''}
          </div>`).join('')}
        <button class="btn btn-sm btn-ghost" style="margin-top:6px" onclick="addPair(${i})">+ Add Pair</button>
      </div>`;
  }
  return '';
}

function updateQ(idx, field, value) {
  builderQuestions[idx][field] = value;
}

function updateMCQOption(qi, oi, value) {
  const prevVal = builderQuestions[qi].options[oi];
  if (builderQuestions[qi].correctAnswer === prevVal) builderQuestions[qi].correctAnswer = value;
  builderQuestions[qi].options[oi] = value;
}

function setCorrectMCQ(qi, oi) {
  builderQuestions[qi].correctAnswer = builderQuestions[qi].options[oi];
  renderBuilderQuestions();
}

function addMCQOption(qi) {
  builderQuestions[qi].options.push('');
  renderBuilderQuestions();
}

function removeMCQOption(qi, oi) {
  builderQuestions[qi].options.splice(oi, 1);
  renderBuilderQuestions();
}

function updatePair(qi, pi, side, value) {
  builderQuestions[qi].correctPairs[pi][side] = value;
}

function addPair(qi) {
  builderQuestions[qi].correctPairs.push({ left: '', right: '' });
  renderBuilderQuestions();
}

function removePair(qi, pi) {
  builderQuestions[qi].correctPairs.splice(pi, 1);
  renderBuilderQuestions();
}

async function saveExam(forceStatus) {
  const title = el('exam-title').value.trim();
  if (!title) { showToast('Exam title is required', 'error'); switchBuilderTab('details'); return; }
  if (builderQuestions.length === 0) { showToast('Add at least one question', 'error'); switchBuilderTab('questions'); return; }

  // Validate questions
  for (let i = 0; i < builderQuestions.length; i++) {
    const q = builderQuestions[i];
    if (!q.question.trim()) { showToast(`Question ${i + 1} text is empty`, 'error'); return; }
    if (q.type === 'mcq' && !q.correctAnswer) { showToast(`Question ${i + 1}: Mark the correct MCQ option`, 'error'); return; }
    if ((q.type === 'fill_blank' || q.type === 'guess') && !q.correctAnswer) { showToast(`Question ${i + 1}: Correct answer is required`, 'error'); return; }
  }

  const totalMarks = parseInt(el('exam-total-marks').value) || builderQuestions.reduce((s, q) => s + (q.marks || 1), 0);
  const passingMarks = parseInt(el('exam-passing-marks').value) || Math.ceil(totalMarks * 0.6);

  const payload = {
    title,
    description: el('exam-description').value,
    duration: parseInt(el('exam-duration').value) || 30,
    totalMarks,
    passingMarks,
    questions: builderQuestions,
    status: forceStatus || el('exam-status').value
  };

  try {
    if (editingExamId) {
      await API.updateExam(editingExamId, payload);
      showToast('Exam updated!', 'success');
    } else {
      await API.createExam(payload);
      showToast('Exam created!', 'success');
    }
    closeModal('modal-exam-builder');
    loadAdminExams();
  } catch (err) { showToast(err.message || 'Failed to save exam', 'error'); }
}
