// staff.js
async function initStaffLayout() {
  const ui = el('staff-user-info');
  ui.innerHTML = `<div class="user-avatar">${getInitials(currentUser.name)}</div><div class="user-details"><div class="user-name">${escapeHtml(currentUser.name)}</div><div class="user-role">Staff</div></div>`;
  el('layout-staff').classList.remove('hidden');
  showStaffPage('staff-dashboard');
}

function showStaffPage(pageId) {
  document.querySelectorAll('.staff-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#layout-staff .nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === pageId);
  });
  el(pageId).classList.add('active');

  if (pageId === 'staff-dashboard') loadStaffDashboard();
  else if (pageId === 'staff-exams') loadStaffExams();
  else if (pageId === 'staff-results') loadStaffResults();
  else if (pageId === 'staff-leaderboard') loadStaffLeaderboard();
}

async function loadStaffDashboard() {
  el('staff-welcome').textContent = `Welcome, ${currentUser.name}!`;
  try {
    const [exams, myResults] = await Promise.all([API.getExams(), API.getMyResults()]);
    const submittedExamIds = new Set(myResults.map(r => r.examId));
    const remaining = exams.filter(e => !submittedExamIds.has(e.id));
    const avgScore = myResults.length ? Math.round(myResults.reduce((s, r) => s + r.percentage, 0) / myResults.length) : 0;
    const passed = myResults.filter(r => r.passed).length;

    el('staff-stats').innerHTML = `
      <div class="stat-card"><div class="stat-icon">📝</div><div class="stat-value">${myResults.length}</div><div class="stat-label">Tests Taken</div></div>
      <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-value">${passed}</div><div class="stat-label">Passed</div></div>
      <div class="stat-card"><div class="stat-icon">📊</div><div class="stat-value">${avgScore}%</div><div class="stat-label">Avg Score</div></div>
      <div class="stat-card"><div class="stat-icon">🔔</div><div class="stat-value">${remaining.length}</div><div class="stat-label">Pending Exams</div></div>
    `;

    // Recent results
    const recent = [...myResults].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)).slice(0, 4);
    el('staff-recent-results').innerHTML = recent.length ? recent.map(r => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="viewResult('${r.id}')">
        <div>
          <div style="font-size:0.88rem;font-weight:500">${escapeHtml(r.examTitle)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">${formatDate(r.submittedAt)}</div>
        </div>
        <span class="${r.passed ? 'pill-pass' : 'pill-fail'}">${r.percentage}%</span>
      </div>`).join('') : '<div class="empty-state" style="padding:20px"><p>No results yet</p></div>';

    // Available exams
    el('staff-available-exams').innerHTML = remaining.length ? remaining.slice(0, 3).map(e => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:0.88rem;font-weight:500">${escapeHtml(e.title)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">⏱ ${e.duration} min · 📝 ${e.questions.length} questions</div>
        </div>
        <button class="btn btn-sm btn-primary" onclick="startExam('${e.id}')">Start</button>
      </div>`).join('') : '<div class="empty-state" style="padding:20px"><p>All exams completed! 🎉</p></div>';

  } catch { showToast('Failed to load dashboard', 'error'); }
}

async function loadStaffExams() {
  try {
    const [exams, myResults] = await Promise.all([API.getExams(), API.getMyResults()]);
    const submittedMap = {};
    myResults.forEach(r => { submittedMap[r.examId] = r; });
    const container = el('staff-exam-cards');

    if (!exams.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>No exams available</p></div>';
      return;
    }

    container.innerHTML = exams.map(exam => {
      const result = submittedMap[exam.id];
      return `
        <div class="exam-card">
          ${result ? `<span class="status-badge" style="background:rgba(155,168,196,0.1);color:var(--text-muted);border-color:var(--border)">Completed</span>` : `<span class="status-badge status-published">Available</span>`}
          <div class="exam-card-title">${escapeHtml(exam.title)}</div>
          <div class="exam-card-desc">${escapeHtml(exam.description || '')}</div>
          <div class="exam-card-meta">
            <span class="meta-tag">⏱ ${exam.duration} min</span>
            <span class="meta-tag">📝 ${exam.questions.length} questions</span>
            <span class="meta-tag">⭐ ${exam.totalMarks} marks</span>
          </div>
          ${result
          ? `<div style="margin-top:8px">
                 <div style="font-size:0.85rem;color:var(--text-secondary)">Your score: <b style="color:${result.passed ? 'var(--success)' : 'var(--danger)'}">${result.earnedMarks}/${result.totalMarks} (${result.percentage}%)</b> — <span class="${result.passed ? 'pill-pass' : 'pill-fail'}">${result.passed ? 'Pass' : 'Fail'}</span></div>
                 <button class="btn btn-sm btn-secondary" style="margin-top:8px" onclick="viewResult('${result.id}')">View My Result</button>
               </div>`
          : `<button class="btn btn-primary" onclick="startExam('${exam.id}')">Start Exam →</button>`}
        </div>`;
    }).join('');
  } catch { showToast('Failed to load exams', 'error'); }
}

async function loadStaffResults() {
  try {
    const results = await API.getMyResults();
    const container = el('staff-results-list');
    if (!results.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><p>No results yet. Take an exam to see your results here.</p></div>';
      return;
    }

    const sorted = [...results].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    container.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Exam</th><th>Score</th><th>Marks</th><th>Status</th><th>Time</th><th>Date</th><th></th></tr></thead>
          <tbody>${sorted.map(r => `
            <tr class="result-row-link" onclick="viewResult('${r.id}')">
              <td><strong>${escapeHtml(r.examTitle)}</strong></td>
              <td><span style="font-family:'DM Mono',monospace;color:var(--gold-400)">${r.percentage}%</span></td>
              <td style="font-family:'DM Mono',monospace">${r.earnedMarks}/${r.totalMarks}</td>
              <td><span class="${r.passed ? 'pill-pass' : 'pill-fail'}">${r.passed ? 'Pass' : 'Fail'}</span></td>
              <td style="color:var(--text-secondary)">${formatDuration(r.timeTaken)}</td>
              <td style="color:var(--text-secondary);font-size:0.82rem">${formatDate(r.submittedAt)}</td>
              <td>
                <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();viewResult('${r.id}')">View</button>
                <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();downloadSingleResultPDF('${r.id}')">⬇ PDF</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch { showToast('Failed to load results', 'error'); }
}

async function loadStaffLeaderboard() {
  try {
    const exams = await API.getExams();
    const examSel = el('staff-lb-filter');
    const currentVal = examSel.value;
    examSel.innerHTML = '<option value="">Overall Rankings</option>' + exams.map(e => `<option value="${e.id}" ${e.id === currentVal ? 'selected' : ''}>${escapeHtml(e.title)}</option>`).join('');

    const data = await API.getLeaderboard(currentVal || null);
    // Highlight current user
    const enhanced = data.map(item => ({ ...item, isMe: item.userId === currentUser.id }));
    const container = el('staff-leaderboard-content');
    if (!enhanced.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">🏆</div><p>No data yet</p></div>';
      return;
    }
    container.innerHTML = `<div class="leaderboard-list">${enhanced.map(item => `
      <div class="lb-item rank-${item.rank}" style="${item.isMe ? 'border-color:var(--gold-400);background:rgba(212,164,48,0.06)' : ''}">
        <div class="lb-rank">${item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : '#' + item.rank}</div>
        <div>
          <div class="lb-name">${escapeHtml(item.userName)}${item.isMe ? ' <span style="font-size:0.72rem;color:var(--gold-400);font-weight:600">(You)</span>' : ''}</div>
          <div class="lb-sub">${item.totalTests !== undefined ? `${item.totalTests} test(s) · ${item.passed || 0} passed` : `${formatDuration(item.timeTaken || 0)}`}</div>
        </div>
        <div class="lb-score">
          <div class="lb-pct">${item.avgPercentage !== undefined ? item.avgPercentage : item.percentage}%</div>
          <div class="lb-detail">${item.earnedMarks !== undefined ? `${item.earnedMarks}/${item.totalMarks}` : ''}</div>
        </div>
      </div>`).join('')}</div>`;
  } catch { showToast('Failed to load leaderboard', 'error'); }
}
