const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Quiz = require('../models/Quiz'); 
const ExamPaper = require('../models/ExamPaper');
const bcrypt = require('bcryptjs');

const Assignment = require('../models/Assignment');

// --- ASSIGNMENT ROUTES ---
router.post('/assignments', async (req, res) => {
  try {
    const newAssignment = await Assignment.create(req.body);
    res.status(201).json(newAssignment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

router.get('/assignments/:classroomId/:subject', async (req, res) => {
  try {
    const assignments = await Assignment.find({
      classroomId: req.params.classroomId,
      subject: req.params.subject
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// --- USER CRUD ---
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword, role });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      { name, email, role }, 
      { new: true }
    ).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// --- CLASSROOM CRUD ---
router.post('/classrooms', async (req, res) => {
  try {
    const { name, subjects } = req.body;
    const newClassroom = await Classroom.create({ name, subjects });
    res.status(201).json(newClassroom);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create classroom' });
  }
});

router.get('/classrooms', async (req, res) => {
  try {
    const classrooms = await Classroom.find().populate('teachers students', '-password');
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch classrooms' });
  }
});

router.put('/classrooms/:id', async (req, res) => {
  try {
    const { name, subjects, teachers, students } = req.body;
    const updatedClass = await Classroom.findByIdAndUpdate(
      req.params.id, 
      { name, subjects, teachers, students },
      { new: true }
    );
    res.json(updatedClass);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update classroom' });
  }
});

router.delete('/classrooms/:id', async (req, res) => {
  try {
    await Classroom.findByIdAndDelete(req.params.id);
    res.json({ message: 'Classroom deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete classroom' });
  }
});

// --- QUIZ CRUD ---
router.post('/quizzes', async (req, res) => {
  try {
    const newQuiz = await Quiz.create(req.body);
    res.status(201).json(newQuiz);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

router.get('/quizzes/:classroomId/:subject', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ 
      classroomId: req.params.classroomId, 
      subject: req.params.subject 
    });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// NEW: Student submits a quiz
router.post('/quizzes/:id/submit', async (req, res) => {
  try {
    const { studentId, answers } = req.body;
    const quiz = await Quiz.findById(req.params.id);

    // Check if student already submitted to prevent duplicates
    if (quiz.submissions.some(sub => sub.studentId.toString() === studentId)) {
      return res.status(400).json({ error: 'Exam already submitted.' });
    }

    // Auto-grade the MCQ
    let score = 0;
    quiz.questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        score += 1;
      }
    });

    // Save submission
    quiz.submissions.push({ studentId, answers, score });
    await quiz.save();

    res.json({ message: 'Exam submitted successfully', score });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// NEW: Teacher toggles publishing of marks
router.put('/quizzes/:id/publish', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    quiz.showMarks = !quiz.showMarks; // Toggles the boolean
    await quiz.save();
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update quiz visibility' });
  }
});
// --- EXAM PAPER CRUD (Admin/Teacher) ---
router.post('/exam-papers', async (req, res) => {
  try {
    const { title, classroomId, subject, maxMarks } = req.body;
    
    // Initialize scores for all students in the class
    const classroom = await Classroom.findById(classroomId);
    const scores = classroom.students.map(studentId => ({ studentId, marks: null }));

    const newExam = await ExamPaper.create({ title, classroomId, subject, maxMarks, scores });
    res.status(201).json(newExam);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create exam paper' });
  }
});

router.get('/exam-papers/:classroomId', async (req, res) => {
  try {
    const exams = await ExamPaper.find({ classroomId: req.params.classroomId }).populate('scores.studentId', 'name email');
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exam papers' });
  }
});

// Teacher: Update student scores
router.put('/exam-papers/:id/scores', async (req, res) => {
  try {
    const { scores } = req.body; // Array of { studentId, marks }
    const exam = await ExamPaper.findById(req.params.id);
    
    scores.forEach(updatedScore => {
      const studentScore = exam.scores.find(s => s.studentId.toString() === updatedScore.studentId.toString());
      if (studentScore) {
        studentScore.marks = updatedScore.marks;
      }
    });

    await exam.save();
    res.json(exam);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update scores' });
  }
});

// Teacher: Publish results
router.put('/exam-papers/:id/publish', async (req, res) => {
  try {
    const exam = await ExamPaper.findById(req.params.id);
    exam.isPublished = !exam.isPublished;
    await exam.save();
    res.json(exam);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle publish status' });
  }
});

module.exports = router;