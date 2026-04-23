const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: {
    type: String,
    enum: ['mcq', 'fill_blank', 'true_false', 'guess', 'match_column'],
    required: true
  },
  marks: { type: Number, default: 1, min: 1 },
  options: [String],             // for MCQ
  correctAnswer: String,         // for mcq, fill_blank, true_false, guess
  correctPairs: [{               // for match_column
    left: String,
    right: String
  }],
  order: { type: Number, default: 0 }
}, { _id: true });

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    required: true,
    default: 30,
    min: 1
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 1
  },
  passingMarks: {
    type: Number,
    required: true,
    min: 1
  },
  questions: [questionSchema],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
