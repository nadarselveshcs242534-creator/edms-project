const mongoose = require('mongoose');

const examPaperSchema = new mongoose.Schema({
  title: { type: String, required: true },
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  subject: { type: String, required: true },
  maxMarks: { type: Number, required: true, default: 100 },
  date: { type: Date, default: Date.now },
  isPublished: { type: Boolean, default: false }, // Teacher decides if student sees the result
  scores: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    marks: { type: Number, default: null } // null means not yet evaluated
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ExamPaper', examPaperSchema);
