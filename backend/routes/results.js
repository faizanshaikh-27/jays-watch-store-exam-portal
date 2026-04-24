const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const { authMiddleware, adminOnly } = require('../middleware/auth');

function serializeResult(result) {
  const obj = result.toObject ? result.toObject() : { ...result };
  return {
    ...obj,
    submittedAt: obj.submittedAt || obj.createdAt
  };
}

// Grade a submission
function gradeSubmission(exam, answers) {
  let totalEarned = 0;
  const gradedAnswers = [];

  exam.questions.forEach(q => {
    const qId = q._id.toString();
    const userAnswer = answers[qId];
    let isCorrect = false;
    let earnedMarks = 0;

    const normalize = str => (str || '').toString().toLowerCase().trim();

    switch (q.type) {
      case 'mcq':
      case 'fill_blank':
      case 'guess':
      case 'true_false':
        isCorrect = userAnswer !== undefined && userAnswer !== null &&
          normalize(userAnswer) === normalize(q.correctAnswer);
        earnedMarks = isCorrect ? q.marks : 0;
        break;

      case 'match_column':
        if (userAnswer && q.correctPairs && q.correctPairs.length > 0) {
          let matched = 0;
          q.correctPairs.forEach(pair => {
            const userVal = userAnswer[pair.left];
            if (userVal && normalize(userVal) === normalize(pair.right)) matched++;
          });
          isCorrect = matched === q.correctPairs.length;
          earnedMarks = Math.round((matched / q.correctPairs.length) * q.marks * 100) / 100;
        }
        break;
    }

    totalEarned += earnedMarks;

    gradedAnswers.push({
      questionId: qId,
      questionText: q.question,
      questionType: q.type,
      userAnswer: userAnswer !== undefined ? userAnswer : null,
      correctAnswer: q.correctAnswer || q.correctPairs,
      isCorrect,
      earnedMarks,
      maxMarks: q.marks
    });
  });

  return { totalEarned: Math.round(totalEarned * 100) / 100, gradedAnswers };
}

// POST submit exam (staff)
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { examId, answers, timeTaken } = req.body;
    if (!examId || !answers)
      return res.status(400).json({ error: 'examId and answers required' });

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    // Check duplicate submission
    const existing = await Result.findOne({ examId, userId: req.user.id });
    if (existing)
      return res.status(409).json({ error: 'You have already submitted this exam', resultId: existing._id });

    const { totalEarned, gradedAnswers } = gradeSubmission(exam, answers);
    const percentage = Math.round((totalEarned / exam.totalMarks) * 100);
    const passed = totalEarned >= exam.passingMarks;

    const result = await Result.create({
      examId,
      examTitle: exam.title,
      userId: req.user.id,
      userName: req.user.name,
      answers: gradedAnswers,
      totalMarks: exam.totalMarks,
      earnedMarks: totalEarned,
      percentage,
      passed,
      passingMarks: exam.passingMarks,
      timeTaken: timeTaken || 0
    });

    res.json({
      resultId: result._id,
      earnedMarks: totalEarned,
      totalMarks: exam.totalMarks,
      percentage,
      passed
    });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ error: 'You have already submitted this exam' });
    res.status(500).json({ error: err.message });
  }
});

// GET all results (admin)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const results = await Result.find().sort({ createdAt: -1 });
    res.json(results.map(serializeResult));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET results by exam (admin)
router.get('/exam/:examId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const results = await Result.find({ examId: req.params.examId }).sort({ createdAt: -1 });
    res.json(results.map(serializeResult));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET leaderboard for specific exam
router.get('/leaderboard/:examId', authMiddleware, async (req, res) => {
  try {
    const results = await Result.find({ examId: req.params.examId }).sort({ earnedMarks: -1, timeTaken: 1 });
    const leaderboard = results.map((r, idx) => ({
      rank: idx + 1,
      userName: r.userName,
      userId: r.userId,
      earnedMarks: r.earnedMarks,
      totalMarks: r.totalMarks,
      percentage: r.percentage,
      passed: r.passed,
      timeTaken: r.timeTaken,
      submittedAt: r.createdAt
    }));
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET overall leaderboard
router.get('/leaderboard', authMiddleware, async (req, res) => {
  try {
    const results = await Result.find();
    const userStats = {};

    results.forEach(r => {
      const uid = r.userId.toString();
      if (!userStats[uid]) {
        userStats[uid] = {
          userId: r.userId,
          userName: r.userName,
          totalTests: 0,
          totalEarned: 0,
          totalPossible: 0,
          passed: 0
        };
      }
      userStats[uid].totalTests++;
      userStats[uid].totalEarned += r.earnedMarks;
      userStats[uid].totalPossible += r.totalMarks;
      if (r.passed) userStats[uid].passed++;
    });

    const leaderboard = Object.values(userStats)
      .map(s => ({
        ...s,
        avgPercentage: s.totalPossible > 0
          ? Math.round((s.totalEarned / s.totalPossible) * 100) : 0
      }))
      .sort((a, b) => b.avgPercentage - a.avgPercentage || b.passed - a.passed)
      .map((s, idx) => ({ ...s, rank: idx + 1 }));

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET my results (staff)
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const results = await Result.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(results.map(serializeResult));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single result
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Result not found' });
    if (req.user.role === 'staff' && result.userId.toString() !== req.user.id)
      return res.status(403).json({ error: 'Access denied' });
    res.json(serializeResult(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
