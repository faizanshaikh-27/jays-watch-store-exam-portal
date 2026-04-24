// PDF download for results
function getSubmittedAt(result) {
  return result.submittedAt || result.createdAt || null;
}

function formatPdfDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatAnswerLines(value, questionType) {
  if (questionType === 'match_column') {
    if (Array.isArray(value)) {
      return [value.map(pair => `${pair.left} -> ${pair.right}`).join(', ')];
    }

    if (value && typeof value === 'object') {
      return [Object.entries(value).map(([left, right]) => `${left} -> ${right || '(blank)'}`).join(', ')];
    }
  }

  return [value !== null && value !== undefined ? String(value) : '(no answer)'];
}

function wrapAnswerLines(doc, value, questionType, width) {
  return formatAnswerLines(value, questionType).flatMap(line => doc.splitTextToSize(line, width));
}

async function loadPdfLogo() {
  try {
    const response = await fetch('assets/logo.png');
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawPdfLogo(doc, logoData, x, y) {
  doc.setFillColor(250, 246, 237);
  doc.roundedRect(x - 1, y - 1, 22, 22, 3, 3, 'F');
  doc.setDrawColor(212, 164, 48);
  doc.setLineWidth(0.3);
  doc.roundedRect(x - 1, y - 1, 22, 22, 3, 3, 'S');

  if (logoData) {
    doc.addImage(logoData, 'PNG', x + 1, y + 1, 18, 18);
    return;
  }

  doc.setFillColor(25, 40, 75);
  doc.circle(x + 10, y + 10, 8, 'F');
  doc.setFontSize(14);
  doc.text('J', x + 8.2, y + 13);
}

async function downloadResultPDF() {
  if (!currentViewingResult) return;
  await generateResultPDF(currentViewingResult);
}

async function downloadSingleResultPDF(resultId) {
  try {
    const result = await API.getResult(resultId);
    await generateResultPDF(result);
  } catch {
    showToast('Failed to download PDF', 'error');
  }
}

async function generateResultPDF(result) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const logoData = await loadPdfLogo();

  const pageW = 210;
  const pageH = 297;
  const margin = 16;
  const contentW = pageW - margin * 2;
  const footerTop = 289;
  const safeBottom = 282;
  const lineH = 4.2;
  let y = 0;

  const NAVY = [8, 13, 26];
  const PANEL = [18, 27, 50];
  const PANEL_SOFT = [13, 21, 39];
  const GOLD = [212, 164, 48];
  const GOLD2 = [240, 192, 96];
  const TEXT = [236, 229, 216];
  const SUBTEXT = [145, 162, 194];
  const SUCCESS_FG = [46, 204, 113];
  const FAIL_FG = [231, 76, 60];
  const DIVIDER = [35, 50, 88];

  function paintPageBackground() {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageW, pageH, 'F');
  }

  function ensureSpace(heightNeeded) {
    if (y + heightNeeded <= safeBottom) return;
    doc.addPage();
    paintPageBackground();
    y = 16;
  }

  function drawStatCard(x, top, width, stat) {
    doc.setFillColor(...PANEL);
    doc.roundedRect(x, top, width, 18, 2.5, 2.5, 'F');
    doc.setFillColor(...stat.color);
    doc.rect(x, top, width, 1.2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...SUBTEXT);
    doc.text(stat.label, x + 4, top + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...stat.color);
    doc.text(stat.value, x + 4, top + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...SUBTEXT);
    doc.text(stat.sub, x + 4, top + 16);
  }

  paintPageBackground();

  doc.setFillColor(...PANEL_SOFT);
  doc.rect(0, 0, pageW, 42, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, 0, pageW, 2.5, 'F');

  drawPdfLogo(doc, logoData, margin, 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...GOLD);
  doc.text("Jay's Watch Store", margin + 26, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...SUBTEXT);
  doc.text('Staff Examination Portal', margin + 26, 23);
  doc.text('Result Certificate', margin + 26, 29);
  doc.text(`Generated: ${formatPdfDate(new Date().toISOString())}`, pageW - margin, 18, { align: 'right' });

  y = 52;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...TEXT);
  const titleLines = doc.splitTextToSize(result.examTitle, contentW);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 6.5 + 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...SUBTEXT);
  doc.text(`Staff: ${result.userName}`, margin, y);
  doc.text(`Submitted: ${formatPdfDate(getSubmittedAt(result))}`, pageW - margin, y, { align: 'right' });
  y += 5;
  doc.text(`Time Taken: ${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s`, margin, y);
  y += 8;

  const stats = [
    { label: 'Marks Earned', value: `${result.earnedMarks}`, sub: `out of ${result.totalMarks}`, color: GOLD },
    { label: 'Percentage', value: `${result.percentage}%`, sub: `Pass mark ${result.passingMarks}`, color: GOLD2 },
    { label: 'Correct', value: `${result.answers.filter(a => a.isCorrect).length}`, sub: `${result.answers.length} total`, color: SUCCESS_FG },
    { label: 'Result', value: result.passed ? 'PASS' : 'FAIL', sub: result.passed ? 'Passed' : 'Needs improvement', color: result.passed ? SUCCESS_FG : FAIL_FG }
  ];

  const gap = 4;
  const cardW = (contentW - gap * 3) / 4;
  stats.forEach((stat, index) => {
    drawStatCard(margin + index * (cardW + gap), y, cardW, stat);
  });
  y += 24;

  doc.setDrawColor(...DIVIDER);
  doc.setLineWidth(0.25);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...GOLD);
  doc.text('Answer Review', margin, y);
  y += 6;

  result.answers.forEach((ans, index) => {
    const qLines = doc.splitTextToSize(ans.questionText, contentW - 26);
    const userLines = wrapAnswerLines(doc, ans.userAnswer, ans.questionType, contentW - 42);
    const correctLines = ans.isCorrect ? [] : wrapAnswerLines(doc, ans.correctAnswer, ans.questionType, contentW - 42);
    const answerHeight = Math.max(userLines.length, 1) * lineH;
    const correctHeight = ans.isCorrect ? 0 : Math.max(correctLines.length, 1) * lineH + 1.5;
    const blockH = 11 + qLines.length * lineH + answerHeight + correctHeight + 5;

    ensureSpace(blockH + 3);

    doc.setFillColor(...PANEL);
    doc.roundedRect(margin, y, contentW, blockH, 2.5, 2.5, 'F');
    doc.setFillColor(...(ans.isCorrect ? SUCCESS_FG : FAIL_FG));
    doc.rect(margin, y, 1.5, blockH, 'F');

    doc.setFillColor(34, 48, 84);
    doc.circle(margin + 5, y + 7.5, 2.3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...GOLD);
    doc.text(String(index + 1), margin + 5, y + 8.1, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...SUBTEXT);
    doc.text(`${ans.earnedMarks}/${ans.maxMarks} marks`, pageW - margin - 4, y + 7.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.7);
    doc.setTextColor(...TEXT);
    doc.text(qLines, margin + 9, y + 7.5);

    let ay = y + 9 + qLines.length * lineH;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SUBTEXT);
    doc.text('Your answer:', margin + 3, ay);
    doc.setTextColor(...(ans.isCorrect ? SUCCESS_FG : FAIL_FG));
    doc.text(userLines.length ? userLines : ['(skipped)'], margin + 24, ay);
    ay += answerHeight;

    if (!ans.isCorrect) {
      ay += 1.5;
      doc.setTextColor(...SUBTEXT);
      doc.text('Correct:', margin + 3, ay);
      doc.setTextColor(...SUCCESS_FG);
      doc.text(correctLines.length ? correctLines : ['-'], margin + 18, ay);
    }

    y += blockH + 3;
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setFillColor(...PANEL_SOFT);
    doc.rect(0, footerTop, pageW, pageH - footerTop, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...SUBTEXT);
    doc.text("Jay's Watch Store Exam Portal", margin, 294);
    doc.text(`Page ${page} of ${totalPages}`, pageW - margin, 294, { align: 'right' });
  }

  const fileName = `result_${result.userName.replace(/\s+/g, '_')}_${result.examTitle.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
  showToast('PDF downloaded!', 'success');
}
