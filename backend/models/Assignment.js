const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: String,
  description: String,
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  subject: String,
  dueDate: Date,
  allowLate: { type: String, default: 'no' },
  submissionsCount: { type: Number, default: 0 },
  submissions: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: Number,
    submittedAt: Date
  }]
});

module.exports = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);