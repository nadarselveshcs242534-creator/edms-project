require('dotenv').config(); 
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 1. Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edms'; 

// 2. Import existing models 
const User = require('./models/User');
const Classroom = require('./models/Classroom');
const Quiz = require('./models/Quiz');
const Assignment = require('./models/Assignment');

// 3. Define missing schemas directly for the seed
const attendanceSchema = new mongoose.Schema({
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  subject: String,
  date: String,
  records: { type: Map, of: Boolean } 
});
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);

// 4. Dummy Data Arrays
const firstNames = ["Aarav", "Priya", "Rahul", "Neha", "Aditya", "Sneha", "Rohan", "Anjali", "Vikram", "Pooja", "Karan", "Shruti", "Amit", "Riya", "Sanjay", "Kavya", "Arjun", "Meera", "Varun", "Isha", "Ravi", "Nisha", "Raj", "Swati", "Vivek", "Divya", "Suresh", "Kiran", "Ashish", "Roshni"];
const lastNames = ["Patil", "Desai", "Joshi", "Kadam", "Jadhav", "Pawar", "Sawant", "Kulkarni", "Shinde", "Tambe", "Gaikwad", "Kale", "Bhosale", "More", "Mane", "Wagh"];

const generateStudents = async (count, startIndex) => {
  const students = [];
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  for (let i = 0; i < count; i++) {
    const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
    students.push({
      name: `${fName} ${lName}`,
      email: `student${startIndex + i}@edunexis.com`,
      password: hashedPassword,
      role: 'Student'
    });
  }
  return students;
};

// --- GRADING CURVE LOGIC ---
const generateQuizScore = () => {
  const rand = Math.random();
  if (rand < 0.15) return Math.floor(Math.random() * 2); // 15% Fail (0 or 1 out of 5)
  if (rand < 0.55) return Math.floor(Math.random() * 2) + 2; // 40% Average (2 or 3 out of 5)
  return Math.floor(Math.random() * 2) + 4; // 45% Great (4 or 5 out of 5)
};

const generateAssignmentScore = () => {
  const rand = Math.random();
  if (rand < 0.15) return Math.floor(Math.random() * 25) + 10; // 15% Fail (10 - 34)
  if (rand < 0.55) return Math.floor(Math.random() * 35) + 35; // 40% Average (35 - 69)
  return Math.floor(Math.random() * 31) + 70; // 45% Great (70 - 100)
};

const seedDatabase = async () => {
  try {
    console.log(`🔗 Connecting to database: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log('📦 Connected to MongoDB...');

    // Clear old student data to prevent duplicates
    await User.deleteMany({ role: 'Student' });
    await Quiz.deleteMany({});
    await Assignment.deleteMany({});
    await Attendance.deleteMany({});
    console.log('🧹 Cleared old student and evaluation data.');

    const classrooms = await Classroom.find();
    if (classrooms.length === 0) {
      console.log('⚠️ Could not find any classrooms.');
      process.exit();
    }

    console.log(`🏫 Found ${classrooms.length} classrooms. Generating students & subjects...`);

    let studentIndex = 1;
    for (let i = 0; i < classrooms.length; i++) {
      const cls = classrooms[i];
      
      // Generate 30 unique students for this specific class
      const studentData = await generateStudents(30, studentIndex);
      const insertedStudents = await User.insertMany(studentData);
      studentIndex += 30;

      const studentIds = insertedStudents.map(s => s._id);

      // Update Classroom Document
      cls.students = studentIds;
      await cls.save();

      // Ensure class has subjects to loop through, otherwise fallback to defaults
      const subjectsToSeed = cls.subjects && cls.subjects.length > 0 ? cls.subjects : ['General Syllabus', 'Practical Labs'];

      // Loop through EVERY subject in the class
      for (const subject of subjectsToSeed) {
        
        // Seed Quiz (5 Questions)
        await Quiz.create({
          title: `Unit Test 1: ${subject}`,
          classroomId: cls._id,
          subject: subject,
          showMarks: true,
          questions: [
            { questionText: "Question 1 related to this subject?", options: ["A", "B", "C", "D"], correctAnswer: 0 },
            { questionText: "Question 2 related to this subject?", options: ["A", "B", "C", "D"], correctAnswer: 1 },
            { questionText: "Question 3 related to this subject?", options: ["A", "B", "C", "D"], correctAnswer: 2 },
            { questionText: "Question 4 related to this subject?", options: ["A", "B", "C", "D"], correctAnswer: 3 },
            { questionText: "Question 5 related to this subject?", options: ["A", "B", "C", "D"], correctAnswer: 0 }
          ],
          submissions: studentIds.map(id => ({
            studentId: id,
            score: generateQuizScore(), 
            answers: { 0: 0, 1: 1, 2: 2, 3: 3, 4: 0 }
          }))
        });

        // Seed Assignment
        await Assignment.create({
          title: `Term Assignment: ${subject}`,
          description: "Please upload your research documents as requested in the latest lecture.",
          classroomId: cls._id,
          subject: subject,
          dueDate: new Date(Date.now() - 86400000), // Due Yesterday
          allowLate: 'yes',
          submissionsCount: 30,
          submissions: studentIds.map(id => ({
            studentId: id,
            score: generateAssignmentScore(),
            submittedAt: new Date(Date.now() - Math.random() * 100000000)
          }))
        });

        // Seed Attendance
        const attendanceRecords = {};
        studentIds.forEach(id => {
          attendanceRecords[id] = Math.random() > 0.15; // 85% chance of being present
        });
        await Attendance.create({
          classroomId: cls._id,
          subject: subject,
          date: new Date().toISOString().split('T')[0],
          records: attendanceRecords
        });

        console.log(`   📚 Generated data for subject: ${subject}`);
      }

      console.log(`✅ Flooded Class: ${cls.name} (30 Students)`);
    }

    console.log('\n🚀 MIXED DATA SEEDING COMPLETE!');
    console.log('You can now log in to the Student/Teacher dashboard to view realistic mixed-grade distributions across all subjects.');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedDatabase();