const mongoose = require('mongoose');

const gradedAnswerSchema = new mongoose.Schema({
  questionId: String,
  questionText: String,
  questionType: String,
  userAnswer: mongoose.Schema.Types.Mixed,
  correctAnswer: mongoose.Schema.Types.Mixed,
  isCorrect: Boolean,
  earnedMarks: Number,
  maxMarks: Number
}, { _id: false });

const resultSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  examTitle: { type: String, required: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: { type: String, required: true },
  answers: [gradedAnswerSchema],
  totalMarks: { type: Number, required: true },
  earnedMarks: { type: Number, required: true },
  percentage: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  passingMarks: { type: Number, required: true },
  timeTaken: { type: Number, default: 0 }
}, { timestamps: true });

// One result per user per exam
resultSchema.index({ examId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
