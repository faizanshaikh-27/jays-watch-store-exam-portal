// pdf.js — PDF download for results
function downloadResultPDF() {
  if (!currentViewingResult) return;
  generateResultPDF(currentViewingResult);
}

async function downloadSingleResultPDF(resultId) {
  try {
    const result = await API.getResult(resultId);
    generateResultPDF(result);
  } catch { showToast('Failed to download PDF', 'error'); }
}

function generateResultPDF(result) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = 210;
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = 0;

  // ── Color palette ──
  const NAVY = [8, 13, 26];
  const GOLD = [212, 164, 48];
  const GOLD2 = [240, 192, 96];
  const TEXT = [220, 210, 195];
  const SUBTEXT = [150, 165, 190];
  const SUCCESS_BG = [20, 60, 30];
  const FAIL_BG = [60, 15, 15];
  const SUCCESS_FG = [46, 204, 113];
  const FAIL_FG = [231, 76, 60];
  const WHITE = [255, 255, 255];
  const DIVIDER = [30, 48, 89];

  // ── Background ──
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 297, 'F');

  // ── Header block ──
  doc.setFillColor(13, 21, 39);
  doc.rect(0, 0, 210, 52, 'F');

  // Gold top stripe
  doc.setFillColor(...GOLD);
  doc.rect(0, 0, 210, 3, 'F');

  // Watch icon area
  doc.setFillColor(25, 40, 75);
  doc.circle(margin + 10, 26, 10, 'F');
  doc.setFontSize(14);
  doc.text('⌚', margin + 7, 29);

  // Store name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...GOLD);
  doc.text("Jay's Watch Store", margin + 24, 22);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...SUBTEXT);
  doc.text('STAFF EXAMINATION PORTAL', margin + 24, 29);

  doc.setFontSize(8);
  doc.text('RESULT CERTIFICATE', margin + 24, 35);

  // Date on right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...SUBTEXT);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 210 - margin, 22, { align: 'right' });

  y = 62;

  // ── Exam title ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...TEXT);
  const titleLines = doc.splitTextToSize(result.examTitle, contentW);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7 + 4;

  // Staff info row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...SUBTEXT);
  doc.text(`Staff: ${result.userName}`, margin, y);
  doc.text(`Submitted: ${new Date(result.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 210 - margin, y, { align: 'right' });
  y += 5;
  doc.text(`Time Taken: ${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s`, margin, y);
  y += 10;

  // ── Score cards ──
  const cards = [
    { label: 'MARKS EARNED', value: `${result.earnedMarks}`, sub: `out of ${result.totalMarks}`, color: GOLD },
    { label: 'PERCENTAGE', value: `${result.percentage}%`, sub: `Pass: ${result.passingMarks}`, color: GOLD2 },
    { label: 'CORRECT', value: `${result.answers.filter(a => a.isCorrect).length}`, sub: `${result.answers.length} total`, color: SUCCESS_FG },
    { label: 'RESULT', value: result.passed ? 'PASS' : 'FAIL', sub: result.passed ? 'Congratulations!' : 'Better luck next time', color: result.passed ? SUCCESS_FG : FAIL_FG },
  ];

  const cardW = (contentW - 12) / 4;
  cards.forEach((card, i) => {
    const cx = margin + i * (cardW + 4);
    doc.setFillColor(13, 21, 39);
    doc.roundedRect(cx, y, cardW, 22, 3, 3, 'F');
    doc.setFillColor(...card.color);
    doc.rect(cx, y, cardW, 1.5, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...SUBTEXT);
    doc.setFont('helvetica', 'bold');
    doc.text(card.label, cx + cardW / 2, y + 7, { align: 'center' });
    doc.setFontSize(13);
    doc.setTextColor(...card.color);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, cx + cardW / 2, y + 15, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(...SUBTEXT);
    doc.setFont('helvetica', 'normal');
    doc.text(card.sub, cx + cardW / 2, y + 20, { align: 'center' });
  });
  y += 30;

  // Divider
  doc.setDrawColor(...DIVIDER);
  doc.setLineWidth(0.3);
  doc.line(margin, y, 210 - margin, y);
  y += 8;

  // ── Answer Review header ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...GOLD);
  doc.text('ANSWER REVIEW', margin, y);
  y += 8;

  // ── Answers ──
  result.answers.forEach((ans, i) => {
    // Estimate height needed
    const qLines = doc.splitTextToSize(`Q${i + 1}. ${ans.questionText}`, contentW - 8);
    const blockH = qLines.length * 4.5 + 16;
    if (y + blockH > 280) {
      doc.addPage();
      doc.setFillColor(...NAVY);
      doc.rect(0, 0, 210, 297, 'F');
      y = 15;
    }

    // Answer background
    const bgColor = ans.isCorrect ? [10, 35, 18] : [35, 10, 10];
    doc.setFillColor(...bgColor);
    doc.roundedRect(margin, y, contentW, blockH, 2, 2, 'F');

    // Status stripe
    doc.setFillColor(...(ans.isCorrect ? SUCCESS_FG : FAIL_FG));
    doc.rect(margin, y, 2.5, blockH, 'F');

    // Marks badge
    doc.setFillColor(20, 30, 55);
    doc.roundedRect(210 - margin - 22, y + 2, 20, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...GOLD);
    doc.text(`${ans.earnedMarks}/${ans.maxMarks} mk`, 210 - margin - 12, y + 7.5, { align: 'center' });

    // Question text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT);
    const qTextLines = doc.splitTextToSize(`Q${i + 1}. ${ans.questionText}`, contentW - 30);
    doc.text(qTextLines, margin + 5, y + 7);
    let ay = y + qTextLines.length * 4.5 + 7;

    // Answer line
    let userAns = '';
    if (ans.questionType === 'match_column' && typeof ans.userAnswer === 'object' && ans.userAnswer) {
      userAns = Object.entries(ans.userAnswer).map(([k, v]) => `${k}→${v}`).join(', ');
    } else { userAns = ans.userAnswer !== null && ans.userAnswer !== undefined ? String(ans.userAnswer) : '(no answer)'; }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SUBTEXT);
    doc.text('Your answer: ', margin + 5, ay);
    doc.setTextColor(...(ans.isCorrect ? SUCCESS_FG : FAIL_FG));
    const ansText = doc.splitTextToSize(userAns || '(skipped)', contentW - 40);
    doc.text(ansText, margin + 28, ay);

    if (!ans.isCorrect) {
      ay += 5;
      let correctStr = '';
      if (ans.questionType === 'match_column' && Array.isArray(ans.correctAnswer)) {
        correctStr = ans.correctAnswer.map(p => `${p.left}→${p.right}`).join(', ');
      } else { correctStr = ans.correctAnswer !== null && ans.correctAnswer !== undefined ? String(ans.correctAnswer) : ''; }
      doc.setTextColor(...SUBTEXT);
      doc.text('Correct: ', margin + 5, ay);
      doc.setTextColor(...SUCCESS_FG);
      const corrText = doc.splitTextToSize(correctStr, contentW - 40);
      doc.text(corrText, margin + 22, ay);
    }

    y += blockH + 3;
  });

  // ── Footer ──
  const totalPages = doc.internal.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg);
    doc.setFillColor(13, 21, 39);
    doc.rect(0, 290, 210, 7, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...SUBTEXT);
    doc.text("Jay's Watch Store Exam Portal", margin, 295);
    doc.text(`Page ${pg} of ${totalPages}`, 210 - margin, 295, { align: 'right' });
  }

  // Save
  const fileName = `result_${result.userName.replace(/\s+/g, '_')}_${result.examTitle.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
  showToast('PDF downloaded!', 'success');
}
