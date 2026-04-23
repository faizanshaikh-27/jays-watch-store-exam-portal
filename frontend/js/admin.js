// admin.js
let allResults = [];
let allExams = [];

function showAdminPage(pageId) {
  document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#layout-admin .nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === pageId);
  });
  el(pageId).classList.add('active');

  if (pageId === 'admin-dashboard') loadAdminDashboard();
  else if (pageId === 'admin-exams') loadAdminExams();
  else if (pageId === 'admin-results') loadAdminResults();
  else if (pageId === 'admin-leaderboard') loadLeaderboard();
  else if (pageId === 'admin-staff') loadStaff();
}

async function initAdminLayout() {
  const ui = el('admin-user-info');
  ui.innerHTML = `<div class="user-avatar">${getInitials(currentUser.name)}</div><div class="user-details"><div class="user-name">${escapeHtml(currentUser.name)}</div><div class="user-role">Administrator</div></div>`;
  el('layout-admin').classList.remove('hidden');
  showAdminPage('admin-dashboard');
}

// ── DASHBOARD ──
async function loadAdminDashboard() {
  try {
    [allExams, allResults] = await Promise.all([API.getExams(), API.getAllResults()]);
    const staff = await API.getStaff();

    const published = allExams.filter(e => e.status === 'published').length;
    const passCount = allResults.filter(r => r.passed).length;
    const avgScore = allResults.length ? Math.round(allResults.reduce((s, r) => s + r.percentage, 0) / allResults.length) : 0;

    el('admin-stats').innerHTML = `
      <div class="stat-card"><div class="stat-icon">📋</div><div class="stat-value">${allExams.length}</div><div class="stat-label">Total Exams</div></div>
      <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-value">${published}</div><div class="stat-label">Published</div></div>
      <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-value">${staff.length}</div><div class="stat-label">Staff Members</div></div>
      <div class="stat-card"><div class="stat-icon">📝</div><div class="stat-value">${allResults.length}</div><div class="stat-label">Submissions</div></div>
      <div class="stat-card"><div class="stat-icon">🏆</div><div class="stat-value">${passCount}</div><div class="stat-label">Passed</div></div>
      <div class="stat-card"><div class="stat-icon">📊</div><div class="stat-value">${avgScore}%</div><div class="stat-label">Avg Score</div></div>
    `;

    // Recent submissions
    const recent = [...allResults].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)).slice(0, 5);
    el('recent-submissions').innerHTML = recent.length ? `
      <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
        <thead><tr>
          <th style="text-align:left;color:var(--text-muted);padding:6px 0;font-size:0.72rem;text-transform:uppercase">Staff</th>
          <th style="text-align:left;color:var(--text-muted);padding:6px 0;font-size:0.72rem;text-transform:uppercase">Exam</th>
          <th style="text-align:right;color:var(--text-muted);padding:6px 0;font-size:0.72rem;text-transform:uppercase">Score</th>
        </tr></thead>
        <tbody>${recent.map(r => `
          <tr style="border-top:1px solid var(--border);cursor:pointer" onclick="viewResult('${r.id}')">
            <td style="padding:8px 0">${escapeHtml(r.userName)}</td>
            <td style="padding:8px 0;color:var(--text-secondary)">${escapeHtml(r.examTitle)}</td>
            <td style="padding:8px 0;text-align:right"><span class="${r.passed ? 'pill-pass' : 'pill-fail'}">${r.percentage}%</span></td>
          </tr>`).join('')}
        </tbody>
      </table>` : '<div class="empty-state"><p>No submissions yet</p></div>';

    // Exam performance
    el('exam-performance').innerHTML = allExams.length ? allExams.map(exam => {
      const examResults = allResults.filter(r => r.examId === exam.id);
      const avg = examResults.length ? Math.round(examResults.reduce((s, r) => s + r.percentage, 0) / examResults.length) : 0;
      const passRate = examResults.length ? Math.round((examResults.filter(r => r.passed).length / examResults.length) * 100) : 0;
      return `
        <div style="margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:0.88rem;font-weight:500">${escapeHtml(exam.title)}</span>
            <span style="font-size:0.78rem;color:var(--text-muted)">${examResults.length} attempts</span>
          </div>
          <div style="display:flex;gap:12px;margin-bottom:6px">
            <span style="font-size:0.78rem;color:var(--text-secondary)">Avg: <b style="color:var(--gold-400)">${avg}%</b></span>
            <span style="font-size:0.78rem;color:var(--text-secondary)">Pass rate: <b style="color:var(--success)">${passRate}%</b></span>
          </div>
          <div class="progress-bar-wrap"><div class="progress-bar" style="width:${avg}%"></div></div>
        </div>`;
    }).join('') : '<div class="empty-state"><p>No exams yet</p></div>';

  } catch (e) {
    showToast('Failed to load dashboard', 'error');
  }
}

// ── EXAMS ──
async function loadAdminExams() {
  try {
    allExams = await API.getExams();
    renderExamCards();
  } catch { showToast('Failed to load exams', 'error'); }
}

function renderExamCards() {
  const container = el('exams-list');
  if (!allExams.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>No exams yet. Create your first exam!</p></div>';
    return;
  }
  container.innerHTML = allExams.map(exam => `
    <div class="exam-card">
      <span class="status-badge status-${exam.status}">${exam.status === 'published' ? '● Published' : '○ Draft'}</span>
      <div class="exam-card-title">${escapeHtml(exam.title)}</div>
      <div class="exam-card-desc">${escapeHtml(exam.description || 'No description')}</div>
      <div class="exam-card-meta">
        <span class="meta-tag">⏱ ${exam.duration} min</span>
        <span class="meta-tag">📝 ${exam.questions.length} questions</span>
        <span class="meta-tag">⭐ ${exam.totalMarks} marks</span>
        <span class="meta-tag">✅ Pass: ${exam.passingMarks}</span>
      </div>
      <div class="exam-card-actions">
        <button class="btn btn-sm btn-secondary" onclick="showExamBuilder('${exam.id}')">✏️ Edit</button>
        <button class="btn btn-sm btn-secondary" onclick="viewExamResults('${exam.id}')">📊 Results</button>
        <button class="btn btn-sm btn-danger" onclick="deleteExamConfirm('${exam.id}', '${escapeHtml(exam.title).replace(/'/g, "\\'")}')">🗑</button>
      </div>
    </div>`).join('');
}

function deleteExamConfirm(id, title) {
  showConfirm('Delete Exam', `Delete "${title}"? This cannot be undone.`, 'Delete', 'btn-danger', async () => {
    try {
      await API.deleteExam(id);
      showToast('Exam deleted', 'success');
      loadAdminExams();
    } catch { showToast('Failed to delete exam', 'error'); }
  });
}

function viewExamResults(examId) {
  showAdminPage('admin-results');
  el('result-exam-filter').value = examId;
  loadAdminResults();
}

// ── RESULTS ──
async function loadAdminResults() {
  try {
    const examId = el('result-exam-filter').value;
    if (examId) {
      allResults = await API.getResultsByExam(examId);
    } else {
      allResults = await API.getAllResults();
    }

    // Populate filter
    if (!allExams.length) allExams = await API.getExams();
    const filterSel = el('result-exam-filter');
    const currentVal = filterSel.value;
    filterSel.innerHTML = '<option value="">All Exams</option>' + allExams.map(e => `<option value="${e.id}" ${e.id === currentVal ? 'selected' : ''}>${escapeHtml(e.title)}</option>`).join('');

    renderResultsTable(allResults);
  } catch { showToast('Failed to load results', 'error'); }
}

function filterResults() {
  const q = el('result-search').value.toLowerCase();
  const filtered = allResults.filter(r => r.userName.toLowerCase().includes(q) || r.examTitle.toLowerCase().includes(q));
  renderResultsTable(filtered);
}

function renderResultsTable(results) {
  if (!results.length) {
    el('results-table-container').innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><p>No results found</p></div>';
    return;
  }

  const sorted = [...results].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  el('results-table-container').innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Staff Name</th>
          <th>Exam</th>
          <th>Score</th>
          <th>Marks</th>
          <th>Status</th>
          <th>Time Taken</th>
          <th>Submitted</th>
          <th>Action</th>
        </tr></thead>
        <tbody>${sorted.map(r => `
          <tr class="result-row-link" onclick="viewResult('${r.id}')">
            <td><strong>${escapeHtml(r.userName)}</strong></td>
            <td>${escapeHtml(r.examTitle)}</td>
            <td><span style="font-family:'DM Mono',monospace;color:var(--gold-400)">${r.percentage}%</span></td>
            <td style="font-family:'DM Mono',monospace">${r.earnedMarks} / ${r.totalMarks}</td>
            <td><span class="${r.passed ? 'pill-pass' : 'pill-fail'}">${r.passed ? 'Pass' : 'Fail'}</span></td>
            <td>${formatDuration(r.timeTaken)}</td>
            <td style="color:var(--text-secondary);font-size:0.82rem">${formatDate(r.submittedAt)}</td>
            <td><button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();viewResult('${r.id}')">View</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── LEADERBOARD ──
async function loadLeaderboard() {
  try {
    if (!allExams.length) allExams = await API.getExams();
    const examSel = el('lb-exam-filter');
    const currentVal = examSel.value;
    examSel.innerHTML = '<option value="">Overall Rankings</option>' + allExams.map(e => `<option value="${e.id}" ${e.id === currentVal ? 'selected' : ''}>${escapeHtml(e.title)}</option>`).join('');

    const data = await API.getLeaderboard(currentVal || null);
    renderLeaderboard(data, el('leaderboard-content'));
  } catch { showToast('Failed to load leaderboard', 'error'); }
}

function renderLeaderboard(data, container) {
  if (!data.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🏆</div><p>No data yet</p></div>';
    return;
  }
  container.innerHTML = `<div class="leaderboard-list">${data.map(item => `
    <div class="lb-item rank-${item.rank}">
      <div class="lb-rank">${item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : '#' + item.rank}</div>
      <div>
        <div class="lb-name">${escapeHtml(item.userName)}</div>
        <div class="lb-sub">${item.totalTests ? `${item.totalTests} test(s) · ${item.passed || 0} passed` : `${formatDuration(item.timeTaken || 0)} · ${item.passed ? 'Passed' : 'Failed'}`}</div>
      </div>
      <div class="lb-score">
        <div class="lb-pct">${item.avgPercentage !== undefined ? item.avgPercentage : item.percentage}%</div>
        <div class="lb-detail">${item.earnedMarks !== undefined ? `${item.earnedMarks}/${item.totalMarks} marks` : ''}</div>
      </div>
    </div>`).join('')}</div>`;
}

// ── STAFF ──
async function loadStaff() {
  try {
    const staff = await API.getStaff();
    const results = await API.getAllResults();
    if (!staff.length) {
      el('staff-list').innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><p>No staff members yet</p></div>';
      return;
    }
    el('staff-list').innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Username</th><th>Tests Taken</th><th>Avg Score</th><th>Action</th></tr></thead>
          <tbody>${staff.map(s => {
      const sResults = results.filter(r => r.userId === s.id);
      const avg = sResults.length ? Math.round(sResults.reduce((sum, r) => sum + r.percentage, 0) / sResults.length) : '-';
      return `<tr>
              <td><div style="display:flex;align-items:center;gap:10px">
                <div class="user-avatar" style="width:32px;height:32px;font-size:0.75rem">${getInitials(s.name)}</div>
                <strong>${escapeHtml(s.name)}</strong>
              </div></td>
              <td><code style="font-family:'DM Mono',monospace;font-size:0.82rem;color:var(--gold-400)">${escapeHtml(s.username)}</code></td>
              <td>${sResults.length}</td>
              <td>${avg !== '-' ? `<span style="color:var(--gold-400);font-family:'DM Mono',monospace">${avg}%</span>` : '-'}</td>
              <td><button class="btn btn-sm btn-danger" onclick="deleteStaffConfirm('${s.id}','${escapeHtml(s.name).replace(/'/g, "\\'")}')">Remove</button></td>
            </tr>`;
    }).join('')}
          </tbody>
        </table>
      </div>`;
  } catch { showToast('Failed to load staff', 'error'); }
}

function showAddStaffModal() {
  el('new-staff-name').value = '';
  el('new-staff-username').value = '';
  el('new-staff-password').value = '';
  el('add-staff-error').classList.add('hidden');
  openModal('modal-add-staff');
}

async function createStaff() {
  const name = el('new-staff-name').value.trim();
  const username = el('new-staff-username').value.trim();
  const password = el('new-staff-password').value;
  const errEl = el('add-staff-error');
  errEl.classList.add('hidden');

  if (!name || !username || !password) { errEl.textContent = 'All fields are required.'; errEl.classList.remove('hidden'); return; }
  if (password.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; errEl.classList.remove('hidden'); return; }

  try {
    await API.createStaff({ name, username, password });
    showToast('Staff account created!', 'success');
    closeModal('modal-add-staff');
    loadStaff();
  } catch (err) {
    errEl.textContent = err.message || 'Failed to create account.';
    errEl.classList.remove('hidden');
  }
}

function deleteStaffConfirm(id, name) {
  showConfirm('Remove Staff', `Remove "${name}" from the system?`, 'Remove', 'btn-danger', async () => {
    try {
      await API.deleteStaff(id);
      showToast('Staff removed', 'success');
      loadStaff();
    } catch { showToast('Failed to remove staff', 'error'); }
  });
}

// ── VIEW RESULT (shared) ──
let currentViewingResult = null;

async function viewResult(resultId) {
  try {
    const result = await API.getResult(resultId);
    currentViewingResult = result;
    renderResultDetail(result);
    openModal('modal-result-detail');
  } catch { showToast('Failed to load result', 'error'); }
}

function renderResultDetail(result) {
  const passed = result.passed;
  const content = el('result-detail-content');
  content.innerHTML = `
    <div style="margin-bottom:20px">
      <h3 style="font-family:'Playfair Display',serif;font-size:1.3rem;margin-bottom:4px">${escapeHtml(result.examTitle)}</h3>
      <p style="color:var(--text-secondary);font-size:0.85rem">
        ${escapeHtml(result.userName)} &nbsp;·&nbsp; ${formatDate(result.submittedAt)} &nbsp;·&nbsp; Time taken: ${formatDuration(result.timeTaken)}
      </p>
    </div>
    <div class="result-scorecard">
      <div class="score-item">
        <div class="score-value score-gold">${result.earnedMarks}</div>
        <div class="score-label">Marks Earned</div>
      </div>
      <div class="score-item">
        <div class="score-value" style="color:var(--text-secondary)">${result.totalMarks}</div>
        <div class="score-label">Total Marks</div>
      </div>
      <div class="score-item">
        <div class="score-value ${passed ? 'score-pass' : 'score-fail'}">${result.percentage}%</div>
        <div class="score-label">Percentage</div>
      </div>
      <div class="score-item">
        <div class="score-value ${passed ? 'score-pass' : 'score-fail'}">${passed ? '✓ PASS' : '✗ FAIL'}</div>
        <div class="score-label">Result</div>
      </div>
      <div class="score-item">
        <div class="score-value" style="color:var(--success)">${result.answers.filter(a => a.isCorrect).length}</div>
        <div class="score-label">Correct</div>
      </div>
      <div class="score-item">
        <div class="score-value" style="color:var(--danger)">${result.answers.filter(a => !a.isCorrect).length}</div>
        <div class="score-label">Incorrect</div>
      </div>
    </div>
    <div class="divider"></div>
    <h4 style="margin-bottom:14px;font-size:0.95rem;font-weight:600">Answer Review</h4>
    ${result.answers.map((a, i) => {
    let userAnsDisplay = '';
    let correctAnsDisplay = '';

    if (a.questionType === 'match_column' && typeof a.userAnswer === 'object' && a.userAnswer) {
      userAnsDisplay = Object.entries(a.userAnswer).map(([k, v]) => `${k} → ${v}`).join(', ');
    } else {
      userAnsDisplay = a.userAnswer !== null && a.userAnswer !== undefined ? String(a.userAnswer) : '(no answer)';
    }

    if (a.questionType === 'match_column' && Array.isArray(a.correctAnswer)) {
      correctAnsDisplay = a.correctAnswer.map(p => `${p.left} → ${p.right}`).join(', ');
    } else {
      correctAnsDisplay = a.correctAnswer !== null && a.correctAnswer !== undefined ? String(a.correctAnswer) : '';
    }

    return `
        <div class="answer-item ${a.isCorrect ? 'correct' : 'wrong'}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
            <div class="q-number" style="width:22px;height:22px;font-size:0.75rem">${i + 1}</div>
            <span style="font-size:0.75rem;color:var(--text-muted)">${a.earnedMarks}/${a.maxMarks} marks</span>
          </div>
          <div class="answer-q-text">${escapeHtml(a.questionText)}</div>
          <div class="answer-detail">
            <span class="answer-user">Your answer: <span class="${a.isCorrect ? 'answer-correct-val' : 'answer-wrong-val'}">${escapeHtml(userAnsDisplay)}</span></span>
            ${!a.isCorrect ? `<span class="answer-correct-val">Correct: ${escapeHtml(correctAnsDisplay)}</span>` : ''}
          </div>
        </div>`;
  }).join('')}`;
}
