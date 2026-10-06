const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subjects: [{ type: String }],
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

// Check if the model exists before compiling to prevent OverwriteModelError
module.exports = mongoose.models.Classroom || mongoose.model('Classroom', classroomSchema);