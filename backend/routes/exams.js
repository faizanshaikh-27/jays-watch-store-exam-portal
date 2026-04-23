const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Strip answer keys for staff — keep correctPairs for match_column display
function stripAnswers(questions) {
  return questions.map(q => {
    const obj = q.toObject ? q.toObject() : { ...q };
    delete obj.correctAnswer;
    // correctPairs kept — needed to render column A and B; grading is server-side
    return obj;
  });
}

// GET all exams
router.get('/', authMiddleware, async (req, res) => {
  try {
    let exams = await Exam.find(
      req.user.role === 'staff' ? { status: 'published' } : {}
    ).sort({ createdAt: -1 });

    if (req.user.role === 'staff') {
      exams = exams.map(e => ({
        ...e.toObject(),
        questions: stripAnswers(e.questions)
      }));
    } else {
      exams = exams.map(e => e.toObject());
    }

    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single exam
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    if (req.user.role === 'staff') {
      if (exam.status !== 'published')
        return res.status(404).json({ error: 'Exam not found' });
      return res.json({ ...exam.toObject(), questions: stripAnswers(exam.questions) });
    }

    res.json(exam.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create exam (admin)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, description, duration, totalMarks, passingMarks, questions, status } = req.body;
    if (!title || !questions || questions.length === 0)
      return res.status(400).json({ error: 'Title and questions are required' });

    const processedQuestions = questions.map((q, idx) => ({ ...q, order: idx + 1, marks: q.marks || 1 }));
    const calcTotal = processedQuestions.reduce((s, q) => s + q.marks, 0);

    const exam = await Exam.create({
      title,
      description: description || '',
      duration: duration || 30,
      totalMarks: totalMarks || calcTotal,
      passingMarks: passingMarks || Math.ceil((totalMarks || calcTotal) * 0.6),
      questions: processedQuestions,
      status: status || 'draft',
      createdBy: req.user.id
    });

    res.json(exam.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update exam (admin)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const { title, description, duration, totalMarks, passingMarks, questions, status } = req.body;

    if (title !== undefined) exam.title = title;
    if (description !== undefined) exam.description = description;
    if (duration !== undefined) exam.duration = duration;
    if (totalMarks !== undefined) exam.totalMarks = totalMarks;
    if (passingMarks !== undefined) exam.passingMarks = passingMarks;
    if (status !== undefined) exam.status = status;
    if (questions) {
      exam.questions = questions.map((q, idx) => ({ ...q, order: idx + 1, marks: q.marks || 1 }));
    }

    await exam.save();
    res.json(exam.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE exam (admin)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
