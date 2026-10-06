import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ExamEnvironment from './pages/ExamEnvironment';
import Login from './pages/Login';
import Chatbot from './components/Chatbot';
import { useState } from 'react';
import './App.css'; 

function App() {
  const [isExamActive, setIsExamActive] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        {/* The root URL now strictly loads the Login page */}
        <Route path="/" element={<Login />} />
        
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/teacher/*" element={<TeacherDashboard />} />
        <Route path="/student/*" element={<StudentDashboard />} />
        <Route 
          path="/student/exam/:quizId" 
          element={<ExamEnvironment setIsExamActive={setIsExamActive} />} 
        />
      </Routes>

      {!isExamActive && <Chatbot />}
    </BrowserRouter>
  );
}

export default App;