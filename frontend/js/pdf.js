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
      return value.map(pair => `${pair.left} -> ${pair.right}`);
    }

    if (value && typeof value === 'object') {
      return Object.entries(value).map(([left, right]) => `${left} -> ${right || '(blank)'}`);
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
  const margin = 18;
  const contentW = pageW - margin * 2;
  const bottomLimit = 280;
  const lineH = 4.5;
  let y = 0;

  const NAVY = [8, 13, 26];
  const GOLD = [212, 164, 48];
  const GOLD2 = [240, 192, 96];
  const TEXT = [220, 210, 195];
  const SUBTEXT = [150, 165, 190];
  const SUCCESS_FG = [46, 204, 113];
  const FAIL_FG = [231, 76, 60];
  const DIVIDER = [30, 48, 89];

  function paintPageBackground() {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageW, pageH, 'F');
  }

  paintPageBackground();

  doc.setFillColor(13, 21, 39);
  doc.rect(0, 0, pageW, 52, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, 0, pageW, 3, 'F');

  drawPdfLogo(doc, logoData, margin, 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...GOLD);
  doc.text("Jay's Watch Store", margin + 24, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...SUBTEXT);
  doc.text('STAFF EXAMINATION PORTAL', margin + 24, 29);
  doc.setFontSize(8);
  doc.text('RESULT CERTIFICATE', margin + 24, 35);
  doc.text(
    `Generated: ${formatPdfDate(new Date().toISOString())}`,
    pageW - margin,
    22,
    { align: 'right' }
  );

  y = 62;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...TEXT);
  const titleLines = doc.splitTextToSize(result.examTitle, contentW);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7 + 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...SUBTEXT);
  doc.text(`Staff: ${result.userName}`, margin, y);
  doc.text(`Submitted: ${formatPdfDate(getSubmittedAt(result))}`, pageW - margin, y, { align: 'right' });
  y += 5;
  doc.text(`Time Taken: ${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s`, margin, y);
  y += 10;

  const cards = [
    { label: 'MARKS EARNED', value: `${result.earnedMarks}`, sub: `out of ${result.totalMarks}`, color: GOLD },
    { label: 'PERCENTAGE', value: `${result.percentage}%`, sub: `Pass: ${result.passingMarks}`, color: GOLD2 },
    { label: 'CORRECT', value: `${result.answers.filter(a => a.isCorrect).length}`, sub: `${result.answers.length} total`, color: SUCCESS_FG },
    { label: 'RESULT', value: result.passed ? 'PASS' : 'FAIL', sub: result.passed ? 'Congratulations!' : 'Better luck next time', color: result.passed ? SUCCESS_FG : FAIL_FG }
  ];

  const cardW = (contentW - 12) / 4;
  cards.forEach((card, i) => {
    const cx = margin + i * (cardW + 4);
    doc.setFillColor(13, 21, 39);
    doc.roundedRect(cx, y, cardW, 22, 3, 3, 'F');
    doc.setFillColor(...card.color);
    doc.rect(cx, y, cardW, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...SUBTEXT);
    doc.text(card.label, cx + cardW / 2, y + 7, { align: 'center' });
    doc.setFontSize(13);
    doc.setTextColor(...card.color);
    doc.text(card.value, cx + cardW / 2, y + 15, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...SUBTEXT);
    doc.text(card.sub, cx + cardW / 2, y + 20, { align: 'center' });
  });
  y += 30;

  doc.setDrawColor(...DIVIDER);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...GOLD);
  doc.text('ANSWER REVIEW', margin, y);
  y += 8;

  result.answers.forEach((ans, i) => {
    const qTextLines = doc.splitTextToSize(`Q${i + 1}. ${ans.questionText}`, contentW - 30);
    const userLines = wrapAnswerLines(doc, ans.userAnswer, ans.questionType, contentW - 40);
    const correctLines = ans.isCorrect ? [] : wrapAnswerLines(doc, ans.correctAnswer, ans.questionType, contentW - 40);

    const blockH = 10
      + qTextLines.length * lineH
      + Math.max(userLines.length, 1) * lineH
      + (ans.isCorrect ? 0 : (2 + Math.max(correctLines.length, 1) * lineH))
      + 4;

    if (y + blockH > bottomLimit) {
      doc.addPage();
      paintPageBackground();
      y = 15;
    }

    const bgColor = ans.isCorrect ? [10, 35, 18] : [35, 10, 10];
    doc.setFillColor(...bgColor);
    doc.roundedRect(margin, y, contentW, blockH, 2, 2, 'F');

    doc.setFillColor(...(ans.isCorrect ? SUCCESS_FG : FAIL_FG));
    doc.rect(margin, y, 2.5, blockH, 'F');

    doc.setFillColor(20, 30, 55);
    doc.roundedRect(pageW - margin - 22, y + 2, 20, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...GOLD);
    doc.text(`${ans.earnedMarks}/${ans.maxMarks} mk`, pageW - margin - 12, y + 7.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT);
    doc.text(qTextLines, margin + 5, y + 7);

    let ay = y + 7 + qTextLines.length * lineH;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SUBTEXT);
    doc.text('Your answer:', margin + 5, ay);
    doc.setTextColor(...(ans.isCorrect ? SUCCESS_FG : FAIL_FG));
    doc.text(userLines.length ? userLines : ['(skipped)'], margin + 28, ay);
    ay += Math.max(userLines.length, 1) * lineH;

    if (!ans.isCorrect) {
      ay += 2;
      doc.setTextColor(...SUBTEXT);
      doc.text('Correct:', margin + 5, ay);
      doc.setTextColor(...SUCCESS_FG);
      doc.text(correctLines.length ? correctLines : ['-'], margin + 22, ay);
    }

    y += blockH + 3;
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg);
    doc.setFillColor(13, 21, 39);
    doc.rect(0, 290, pageW, 7, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...SUBTEXT);
    doc.text("Jay's Watch Store Exam Portal", margin, 295);
    doc.text(`Page ${pg} of ${totalPages}`, pageW - margin, 295, { align: 'right' });
  }

  const fileName = `result_${result.userName.replace(/\s+/g, '_')}_${result.examTitle.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
  showToast('PDF downloaded!', 'success');
}
