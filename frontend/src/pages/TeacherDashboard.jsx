import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Chatbot from '../components/Chatbot';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area, 
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, RadialBarChart, RadialBar
} from 'recharts';

export default function TeacherDashboard() {
  const [activeSidebarTab, setActiveSidebarTab] = useState('classes');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [classSubTab, setClassSubTab] = useState('materials'); 
  const [mySubjects, setMySubjects] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [activeQuizzes, setActiveQuizzes] = useState([]);
  const [examPapers, setExamPapers] = useState([]);
  const [classAnalytics, setClassAnalytics] = useState([]);
  const [kpiData, setKpiData] = useState({ totalStudents: 0, pendingEvaluations: 0 });
  
  const [materialData, setMaterialData] = useState({ title: '', description: '', link: '', file: null });
  const [assignmentData, setAssignmentData] = useState({ title: '', description: '', dueDate: '', allowLate: 'no', file: null });
  const [quizData, setQuizData] = useState({ title: '', showMarks: false, questions: [] });
  
  const [attendanceDateTime, setAttendanceDateTime] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState({}); 
  const [downloadDate, setDownloadDate] = useState('');
  const [downloadMonth, setDownloadMonth] = useState('');
  const [downloadSubject, setDownloadSubject] = useState('');
  const [gradingAssignment, setGradingAssignment] = useState(null);
  const [studentGrades, setStudentGrades] = useState({});
  const [analyticsStudentId, setAnalyticsStudentId] = useState('all');

  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    setActiveSidebarTab(tab);
    setSelectedClassId('');
    setSelectedSubject('');
    setGradingAssignment(null);
    setClassSubTab('materials');
  };

  useEffect(() => {
    const fetchAllClasses = async () => {
      try {
        const res = await axios.get('/api/admin/classrooms');
        setMySubjects(res.data);
        const total = res.data.reduce((sum, cls) => sum + (cls.students ? cls.students.length : 0), 0);
        setKpiData(prev => ({ ...prev, totalStudents: total }));
      } catch (error) {
        console.error("Error fetching classrooms:", error);
      }
    };
    fetchAllClasses();
  }, []);

  useEffect(() => {
    const cls = mySubjects.find(c => c._id === selectedClassId);
    if (cls && cls.students && activeSidebarTab === 'mark_attendance') {
      const initialAttendance = {};
      cls.students.forEach(student => { initialAttendance[student._id] = true; });
      setAttendanceRecords(initialAttendance);
    }
  }, [selectedClassId, activeSidebarTab, mySubjects]);

  const fetchQuizzes = async () => {
    if (selectedClassId && selectedSubject) {
      try {
        const res = await axios.get(`/api/admin/quizzes/${selectedClassId}/${selectedSubject}`);
        setActiveQuizzes(res.data);
      } catch (error) { console.error("Error fetching quizzes:", error); }
    }
  };

  const fetchAssignments = async () => {
    if (selectedClassId && selectedSubject) {
      try {
        const res = await axios.get(`/api/admin/assignments/${selectedClassId}/${selectedSubject}`);
        setMyAssignments(res.data);
      } catch (error) { console.error("Error fetching assignments:", error); }
    }
  };

  const fetchClassAnalytics = async () => {
    if (!selectedClassId) return;
    try {
      const cls = mySubjects.find(c => c._id === selectedClassId);
      let aggregatedQuizzes = [];
      for (const sub of cls.subjects) {
        const res = await axios.get(`/api/admin/quizzes/${cls._id}/${sub}`);
        aggregatedQuizzes = [...aggregatedQuizzes, ...res.data];
      }
      setClassAnalytics(aggregatedQuizzes);
    } catch (err) { console.error("Error fetching analytics", err); }
  };

  const fetchExamPapers = async () => {
    if (!selectedClassId) return;
    try {
      const res = await axios.get(`/api/admin/exam-papers/${selectedClassId}`);
      setExamPapers(res.data);
    } catch (err) { console.error("Error fetching exam papers", err); }
  };

  useEffect(() => {
    if (selectedClassId && selectedSubject) {
      fetchQuizzes();
      fetchAssignments();
    }
    if (activeSidebarTab === 'analytics' && selectedClassId) {
      fetchClassAnalytics();
    }
    if (activeSidebarTab === 'evaluate_exams' && selectedClassId) {
      fetchExamPapers();
    }
  }, [selectedClassId, selectedSubject, activeSidebarTab]);

  const handleMaterialSubmit = (e) => {
    e.preventDefault();
    alert(`Material "${materialData.title}" posted!`);
    setMaterialData({ title: '', description: '', link: '', file: null });
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/assignments', {
        title: assignmentData.title,
        description: assignmentData.description,
        dueDate: assignmentData.dueDate,
        allowLate: assignmentData.allowLate,
        classroomId: selectedClassId,
        subject: selectedSubject
      });
      alert(`Assignment deployed to ${selectedSubject}!`);
      setAssignmentData({ title: '', description: '', dueDate: '', allowLate: 'no', file: null });
      fetchAssignments(); 
    } catch (error) {
      alert("❌ Failed to launch assignment.");
    }
  };

  const handleSaveAttendance = (e) => {
    e.preventDefault();
    if (!attendanceDateTime) return alert("Please select a date and time!");
    alert(`✅ Attendance saved for ${selectedSubject} on ${attendanceDateTime.replace('T', ' ')}`);
  };

  const handleSaveGrades = (e) => {
    e.preventDefault();
    alert(`✅ Grades saved for ${gradingAssignment.title}!`);
    setGradingAssignment(null);
    setStudentGrades({});
  };

  const handleAddQuestion = (e) => {
    e.preventDefault(); 
    setQuizData(prev => ({ ...prev, questions: [...prev.questions, { questionText: '', options: ['', '', '', ''], correctAnswer: 0 }] }));
  };

  const handleLaunchQuiz = async (e) => {
    e.preventDefault();
    if (quizData.questions.length === 0) return alert("⚠️ Please add at least one question!");
    try {
      await axios.post('/api/admin/quizzes', {
        title: quizData.title, classroomId: selectedClassId, subject: selectedSubject, showMarks: quizData.showMarks, questions: quizData.questions
      });
      alert(`✅ Quiz "${quizData.title}" launched successfully!`);
      setQuizData({ title: '', showMarks: false, questions: [] });
      fetchQuizzes(); 
    } catch (error) { alert("❌ Failed to launch quiz to the server."); }
  };

  const downloadCSV = (headers, rows, filename) => {
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
  };

  const exportAttendance = (type) => {
    const cls = mySubjects.find(c => c._id === selectedClassId);
    if (!cls) return;
    const headers = ["Student ID", "Student Name", "Class", "Type", "Status"];
    const rows = cls.students.map(s => [s._id, s.name, cls.name, type, "Present"]);
    downloadCSV(headers, rows, `${cls.name}_${type}_Attendance.csv`);
  };

  const handleLogout = () => {
    localStorage.removeItem('edms_token');
    navigate('/');
  };

  const selectedClassObj = mySubjects.find(c => c._id === selectedClassId);
  
  const renderClassSubjectSelectors = (requireSubject = true) => (
    <div className="fade-in" style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '250px' }}>
        <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>1. Select Class</label>
        <select className="animated-input" value={selectedClassId} onChange={(e) => { setSelectedClassId(e.target.value); setSelectedSubject(''); }} style={{ marginBottom: 0 }}>
          <option value="">-- Choose a Class --</option>
          {mySubjects.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {requireSubject && selectedClassId && (
        <div className="fade-in" style={{ flex: 1, minWidth: '250px' }}>
          <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>2. Select Subject</label>
          <select className="animated-input" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} style={{ marginBottom: 0 }}>
            <option value="">-- Choose a Subject --</option>
            {selectedClassObj?.subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}
    </div>
  );

  return (
    <div className="app-layout">
      <nav className="top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--teacher-purple)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(139, 92, 246, 0.3)' }}>E</div>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.4rem' }}>EduNexis <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', marginLeft: '10px', letterSpacing: '1px' }}>TEACHER PANEL</span></h2>
        </div>
        
        <div className="nav-links">
          <button className={activeSidebarTab === 'classes' ? 'active' : ''} onClick={() => handleTabChange('classes')}>📘 My Classes</button>
          <button className={activeSidebarTab === 'mark_attendance' ? 'active' : ''} onClick={() => handleTabChange('mark_attendance')}>📋 Mark Attendance</button>
          <button className={activeSidebarTab === 'download_attendance' ? 'active' : ''} onClick={() => handleTabChange('download_attendance')}>📥 Download Attendance</button>
          <button className={activeSidebarTab === 'grade_assignments' ? 'active' : ''} onClick={() => handleTabChange('grade_assignments')}>📝 Grade Assignments</button>
          <button className={activeSidebarTab === 'evaluate_exams' ? 'active' : ''} onClick={() => handleTabChange('evaluate_exams')}>📄 Evaluate Exams</button>
          <button className={activeSidebarTab === 'make_exams' ? 'active' : ''} onClick={() => handleTabChange('make_exams')}>✍️ Make Quizzes</button>
          <button className={activeSidebarTab === 'analytics' ? 'active' : ''} onClick={() => handleTabChange('analytics')}>📈 Class Analytics</button>
        </div>
        
        <button onClick={handleLogout} style={{ color: 'var(--danger)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: '1px solid rgba(225,29,72,0.3)', borderRadius: '12px' }}>⎋ Logout</button>
      </nav>

      <main className="main-content fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '2rem', color: 'var(--text-main)' }}>Teacher Dashboard</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.05rem' }}>Manage your classes and evaluations.</p>
          </div>
        </div>

        {activeSidebarTab === 'classes' && (
          <div className="fade-in">
            {!selectedClassId ? (
              <>
                 <h3 style={{ marginBottom: '20px', color: 'var(--text-main)', fontSize: '1.4rem' }}>Class Overview</h3>
                 <div className="kpi-grid">
                    {mySubjects.map(sub => (
                      <div key={sub._id} className="interactive-card" onClick={() => setSelectedClassId(sub._id)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f3e8ff', color: 'var(--teacher-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 'bold' }}>{sub.name.charAt(0)}</div>
                            <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>{sub.name}</h4>
                          </div>
                          <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>📚 <strong>{sub.subjects.length}</strong> Subjects</span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>👥 <strong>{sub.students ? sub.students.length : 0}</strong> Enrolled</span>
                          </div>
                        </div>
                        <div style={{ color: 'var(--teacher-purple)', fontWeight: '600', fontSize: '0.95rem', display: 'flex', justifyContent: 'flex-end' }}>Manage Content →</div>
                      </div>
                    ))}
                 </div>
              </>
            ) : !selectedSubject ? (
              <div className="fade-in">
                <button onClick={() => setSelectedClassId('')} className="btn-cancel" style={{ border: 'none', padding: '8px 0', marginBottom: '20px' }}>← Back to Classes</button>
                <div className="light-card">
                  <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '2.2rem' }}>{selectedClassObj?.name}</h2>
                  <p style={{ margin: '0 0 30px 0', color: 'var(--text-muted)' }}>Select a subject to upload materials and assignments.</p>
                  <div className="kpi-grid">
                    {selectedClassObj?.subjects.map(sub => (
                      <div key={sub} onClick={() => setSelectedSubject(sub)} className="interactive-card" style={{ textAlign: 'center', padding: '30px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📘</div>
                        <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>{sub}</h4>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="fade-in">
                <button onClick={() => setSelectedSubject('')} className="btn-cancel" style={{ border: 'none', padding: '8px 0', marginBottom: '20px' }}>← Back to Subjects</button>
                
                <div className="light-card">
                  <h2 style={{ margin: '0 0 24px 0', color: 'var(--teacher-purple)', fontSize: '2.2rem' }}>{selectedSubject}</h2>
                  
                  <div style={{ display: 'flex', gap: '30px', borderBottom: '1px solid var(--border)', marginBottom: '30px' }}>
                    <span onClick={() => setClassSubTab('materials')} style={{ cursor: 'pointer', paddingBottom: '12px', fontSize: '1.05rem', borderBottom: classSubTab === 'materials' ? '3px solid var(--teacher-purple)' : '3px solid transparent', color: classSubTab === 'materials' ? 'var(--teacher-purple)' : 'var(--text-muted)', fontWeight: classSubTab === 'materials' ? 'bold' : '500', transition: 'all 0.2s' }}>
                      Course Materials
                    </span>
                    <span onClick={() => setClassSubTab('assignments')} style={{ cursor: 'pointer', paddingBottom: '12px', fontSize: '1.05rem', borderBottom: classSubTab === 'assignments' ? '3px solid var(--teacher-purple)' : '3px solid transparent', color: classSubTab === 'assignments' ? 'var(--teacher-purple)' : 'var(--text-muted)', fontWeight: classSubTab === 'assignments' ? 'bold' : '500', transition: 'all 0.2s' }}>
                      Assign Assignments
                    </span>
                  </div>

                  {classSubTab === 'materials' && (
                    <div className="responsive-split fade-in">
                      <div style={{ background: '#f8fafc', padding: '30px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <form onSubmit={handleMaterialSubmit}>
                          <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>📢 Upload Material</h3>
                          <input type="text" placeholder="Material Title" required value={materialData.title} onChange={e => setMaterialData({...materialData, title: e.target.value})} className="animated-input" />
                          <textarea placeholder="Description / Text Content..." rows="4" value={materialData.description} onChange={e => setMaterialData({...materialData, description: e.target.value})} className="animated-input" style={{ resize: 'vertical' }}></textarea>
                          <input type="url" placeholder="Resource Link (Optional)" value={materialData.link} onChange={e => setMaterialData({...materialData, link: e.target.value})} className="animated-input" />
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '600' }}>Attach File (PDF, Word)</p>
                          <input type="file" accept=".pdf,.doc,.docx" onChange={e => setMaterialData({...materialData, file: e.target.files[0]})} className="animated-input" style={{ padding: '10px' }} />
                          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>Post to Stream</button>
                        </form>
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Recent Materials</h3>
                        <div style={{ background: '#f8fafc', padding: '60px 40px', borderRadius: '12px', border: '2px dashed var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>
                          <p style={{ margin: 0, fontSize: '1.1rem' }}>No materials uploaded for {selectedSubject} yet.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {classSubTab === 'assignments' && (
                    <div className="responsive-split fade-in">
                      <div style={{ background: '#f8fafc', padding: '30px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <form onSubmit={handleAssignmentSubmit}>
                          <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>✨ Create New Assignment</h3>
                          <input type="text" placeholder="Assignment Title" required value={assignmentData.title} onChange={e => setAssignmentData({...assignmentData, title: e.target.value})} className="animated-input" />
                          <textarea placeholder="Instructions..." rows="4" value={assignmentData.description} onChange={e => setAssignmentData({...assignmentData, description: e.target.value})} className="animated-input" style={{ resize: 'vertical' }}></textarea>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '16px', marginBottom: '16px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold' }}>Due Date & Time</label>
                              <input type="datetime-local" required value={assignmentData.dueDate} onChange={e => setAssignmentData({...assignmentData, dueDate: e.target.value})} className="animated-input" style={{ marginBottom: 0 }} />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold' }}>Receive Late Submissions?</label>
                              <select value={assignmentData.allowLate} onChange={e => setAssignmentData({...assignmentData, allowLate: e.target.value})} className="animated-input" style={{ marginBottom: 0 }}>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                              </select>
                            </div>
                          </div>

                          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '600' }}>Attach Question File (PDF, Word)</p>
                          <input type="file" accept=".pdf,.doc,.docx" onChange={e => setAssignmentData({...assignmentData, file: e.target.files[0]})} className="animated-input" style={{ padding: '10px' }} />
                          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>Publish Assignment to {selectedSubject}</button>
                        </form>
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Active Assignments</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {myAssignments.length === 0 ? (
                            <div style={{ background: '#f8fafc', padding: '60px 40px', borderRadius: '12px', border: '2px dashed var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>
                              <p style={{ margin: 0, fontSize: '1.1rem' }}>No assignments deployed.</p>
                            </div>
                          ) : (
                            myAssignments.map(assignment => (
                              <div key={assignment._id} className="interactive-card">
                                <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '1.1rem' }}>{assignment.title}</h4>
                                <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Due: {new Date(assignment.dueDate).toLocaleString()}</span>
                                  <span style={{ color: assignment.allowLate === 'yes' ? '#10b981' : 'var(--danger)', fontSize: '0.85rem', fontWeight: 'bold' }}>Late Submissions: {assignment.allowLate === 'yes' ? 'Allowed' : 'Strict'}</span>
                                </div>
                                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
                                  <span style={{ color: 'var(--teacher-purple)', fontSize: '0.85rem', fontWeight: 'bold', background: '#f3e8ff', padding: '6px 12px', borderRadius: '20px' }}>{assignment.submissionsCount || 0} Submitted</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSidebarTab === 'mark_attendance' && (
          <div className="light-card fade-in">
            <h2 style={{ margin: '0 0 20px 0', color: 'var(--teacher-purple)', fontSize: '1.8rem' }}>📋 Mark Attendance</h2>
            {renderClassSubjectSelectors(true)}

            {selectedClassId && selectedSubject && (
              <div className="fade-in" style={{ borderTop: '1px solid var(--border)', paddingTop: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '20px' }}>
                   <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Roster: {selectedClassObj.name}</h3>
                   <input type="datetime-local" required value={attendanceDateTime} onChange={(e) => setAttendanceDateTime(e.target.value)} className="animated-input" style={{ width: 'auto', marginBottom: 0, padding: '10px 16px' }} />
                </div>

                <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                  {selectedClassObj.students && selectedClassObj.students.length > 0 ? (
                     <form onSubmit={handleSaveAttendance}>
                        {selectedClassObj.students.map((student, index) => (
                          <div key={student._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: index !== selectedClassObj.students.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f3e8ff', color: 'var(--teacher-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{student.name.charAt(0)}</div>
                              <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{student.name}</span>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                              <input type="checkbox" checked={attendanceRecords[student._id] || false} onChange={(e) => setAttendanceRecords({...attendanceRecords, [student._id]: e.target.checked})} style={{ width: '20px', height: '20px', accentColor: 'var(--teacher-purple)' }} />
                              <span style={{ fontSize: '1rem', color: attendanceRecords[student._id] ? '#10b981' : 'var(--danger)', fontWeight: 'bold', width: '65px' }}>{attendanceRecords[student._id] ? 'Present' : 'Absent'}</span>
                            </label>
                          </div>
                        ))}
                        <div style={{ padding: '20px', background: '#f8fafc', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                           <button type="submit" className="btn-primary" style={{ minWidth: '200px' }}>Save Attendance Record</button>
                        </div>
                     </form>
                  ) : (
                    <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', margin: 0 }}>No students enrolled.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSidebarTab === 'download_attendance' && (
          <div className="light-card fade-in">
            <h2 style={{ margin: '0 0 20px 0', color: 'var(--teacher-purple)', fontSize: '1.8rem' }}>📥 Download Attendance Reports</h2>
            {renderClassSubjectSelectors(false)}

            {selectedClassId && (
              <div className="kpi-grid fade-in" style={{ borderTop: '1px solid var(--border)', paddingTop: '30px' }}>
                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: 'var(--text-main)' }}>Daily Report</h3>
                  <input type="date" value={downloadDate} onChange={e => setDownloadDate(e.target.value)} className="animated-input" />
                  <button onClick={() => exportAttendance(`Daily_${downloadDate}`)} className="btn-primary" style={{ width: '100%' }} disabled={!downloadDate}>Download CSV</button>
                </div>

                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: 'var(--text-main)' }}>Monthly Report</h3>
                  <input type="month" value={downloadMonth} onChange={e => setDownloadMonth(e.target.value)} className="animated-input" />
                  <button onClick={() => exportAttendance(`Monthly_${downloadMonth}`)} className="btn-primary" style={{ width: '100%' }} disabled={!downloadMonth}>Download CSV</button>
                </div>

                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: 'var(--text-main)' }}>Subject-wise Report</h3>
                  <select value={downloadSubject} onChange={e => setDownloadSubject(e.target.value)} className="animated-input">
                    <option value="">-- Select Subject --</option>
                    {selectedClassObj?.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => exportAttendance(`Subject_${downloadSubject}`)} className="btn-primary" style={{ width: '100%' }} disabled={!downloadSubject}>Download CSV</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSidebarTab === 'grade_assignments' && (
          <div className="light-card fade-in">
            <h2 style={{ margin: '0 0 20px 0', color: 'var(--teacher-purple)', fontSize: '1.8rem' }}>📝 Grade Assignments</h2>
            {!gradingAssignment && renderClassSubjectSelectors(true)}

            {selectedClassId && selectedSubject && !gradingAssignment && (
              <div className="fade-in" style={{ borderTop: '1px solid var(--border)', paddingTop: '30px' }}>
                <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Select an Assignment to Grade</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
                  {myAssignments.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No assignments found for {selectedSubject}.</p>
                  ) : (
                    myAssignments.map(assignment => (
                      <div key={assignment._id} className="interactive-card">
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '1.1rem' }}>{assignment.title}</h4>
                        <p style={{ margin: '0 0 16px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Due: {new Date(assignment.dueDate).toLocaleString()}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                          <span style={{ color: 'var(--teacher-purple)', fontSize: '0.85rem', fontWeight: 'bold', background: '#f3e8ff', padding: '6px 12px', borderRadius: '20px' }}>{assignment.submissionsCount || 0} Submitted</span>
                          <button onClick={() => setGradingAssignment(assignment)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Review & Grade →</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {gradingAssignment && (
              <div className="fade-in">
                <button onClick={() => setGradingAssignment(null)} className="btn-cancel" style={{ border: 'none', padding: '8px 0', marginBottom: '24px' }}>← Back to Assignment List</button>
                <div style={{ background: '#f8fafc', padding: '40px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.5rem' }}>Grade: {gradingAssignment.title}</h3>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    {selectedClassObj?.students && selectedClassObj.students.length > 0 ? (
                      <form onSubmit={handleSaveGrades}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '16px 24px', background: '#f1f5f9', borderBottom: '1px solid var(--border)', fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                          <span>Student Name</span>
                          <span>Submission Link</span>
                          <span>Mark (/100)</span>
                        </div>
                        {selectedClassObj.students.map((student, index) => (
                          <div key={student._id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', alignItems: 'center', padding: '20px 24px', borderBottom: index !== selectedClassObj.students.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{student.name}</span>
                            <a href="#" style={{ color: 'var(--teacher-purple)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '600' }}>📄 View File</a>
                            <input type="number" max="100" min="0" placeholder="--" value={studentGrades[student._id] || ''} onChange={(e) => setStudentGrades({...studentGrades, [student._id]: e.target.value})} className="animated-input" style={{ marginBottom: 0, width: '90px' }} />
                          </div>
                        ))}
                        <div style={{ padding: '24px', background: '#f8fafc', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                           <button type="submit" className="btn-primary" style={{ minWidth: '200px' }}>Save All Grades</button>
                        </div>
                      </form>
                    ) : <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No students enrolled.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSidebarTab === 'evaluate_exams' && (
          <div className="fade-in">
            {renderClassSubjectSelectors(false)}
            
            {selectedClassId && (
              <div className="light-card fade-in">
                <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-main)' }}>Evaluate Exam Papers</h3>
                
                {examPapers.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No exam papers found for this class.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {examPapers.map(exam => (
                      <div key={exam._id} style={{ border: '1px solid var(--border)', padding: '20px', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <div>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>{exam.title}</h4>
                            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Subject: {exam.subject} | Max Marks: {exam.maxMarks}</p>
                          </div>
                          <div>
                            <button 
                              onClick={async () => {
                                try {
                                  await axios.put(`/api/admin/exam-papers/${exam._id}/publish`);
                                  fetchExamPapers();
                                  alert(exam.isPublished ? "Results Unpublished" : "Results Published for Students");
                                } catch (error) { alert("Error"); }
                              }}
                              style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', background: exam.isPublished ? '#fff1f2' : '#f0fdfa', color: exam.isPublished ? 'var(--danger)' : '#0d9488' }}
                            >
                              {exam.isPublished ? "Unpublish Results" : "Publish Results"}
                            </button>
                          </div>
                        </div>

                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          try {
                            const updatedScores = exam.scores.map(s => {
                              const input = e.target.elements[`score_${s.studentId._id}`];
                              return { studentId: s.studentId._id, marks: input && input.value !== '' ? Number(input.value) : null };
                            });
                            await axios.put(`/api/admin/exam-papers/${exam._id}/scores`, { scores: updatedScores });
                            alert("Scores Saved!");
                            fetchExamPapers();
                          } catch (err) { alert("Error saving scores"); }
                        }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '12px' }}>Student Name</th>
                                <th style={{ padding: '12px' }}>Marks Scored</th>
                              </tr>
                            </thead>
                            <tbody>
                              {exam.scores.map(score => (
                                <tr key={score.studentId._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                  <td style={{ padding: '12px', fontWeight: '500' }}>{score.studentId.name}</td>
                                  <td style={{ padding: '12px' }}>
                                    <input 
                                      type="number" 
                                      name={`score_${score.studentId._id}`}
                                      defaultValue={score.marks !== null ? score.marks : ''} 
                                      max={exam.maxMarks} 
                                      min={0}
                                      style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', width: '100px' }}
                                    />
                                    <span style={{ marginLeft: '10px', color: 'var(--text-muted)' }}>/ {exam.maxMarks}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          
                          <div style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button type="submit" className="btn-primary" style={{ background: 'var(--teacher-purple)' }}>Save Scores</button>
                          </div>
                        </form>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeSidebarTab === 'make_exams' && (
          <div className="light-card fade-in">
            <h2 style={{ margin: '0 0 20px 0', color: 'var(--teacher-purple)', fontSize: '1.8rem' }}>✍️ Build & Publish Exams</h2>
            {renderClassSubjectSelectors(true)}

            {selectedClassId && selectedSubject && (
              <div className="responsive-split fade-in" style={{ borderTop: '1px solid var(--border)', paddingTop: '30px' }}>
                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <form onSubmit={handleLaunchQuiz}>
                    <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Construct New Quiz</h3>
                    <input type="text" placeholder="Quiz Title" required value={quizData.title} onChange={e => setQuizData({...quizData, title: e.target.value})} className="animated-input" />
                    
                    <label style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', fontSize: '1rem', color: 'var(--text-main)', background: '#fff', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={quizData.showMarks} onChange={e => setQuizData({...quizData, showMarks: e.target.checked})} style={{ width: '20px', height: '20px', accentColor: 'var(--teacher-purple)' }} />
                      Show marks immediately?
                    </label>

                    {quizData.questions.map((q, qIndex) => (
                      <div key={qIndex} className="fade-in" style={{ marginBottom: '24px', padding: '24px', background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <strong style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>Question {qIndex + 1}</strong>
                          <button type="button" onClick={() => handleRemoveQuestion(qIndex)} className="btn-cancel" style={{ border: 'none', color: 'var(--danger)', padding: '6px 12px' }}>Remove</button>
                        </div>
                        <input type="text" placeholder="Enter question text..." required value={q.questionText} onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)} className="animated-input" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '16px', marginBottom: '16px' }}>
                          {q.options.map((opt, optIndex) => (
                            <input key={optIndex} type="text" placeholder={`Option ${optIndex + 1}`} required value={opt} onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)} className="animated-input" style={{ marginBottom: 0 }} />
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <span style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: '600' }}>Correct Answer:</span>
                          <select value={q.correctAnswer} onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', parseInt(e.target.value))} className="animated-input" style={{ width: 'auto', flex: 1, marginBottom: 0, padding: '8px 12px' }}>
                            <option value={0}>Option 1</option><option value={1}>Option 2</option><option value={2}>Option 3</option><option value={3}>Option 4</option>
                          </select>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={handleAddQuestion} className="btn-cancel" style={{ width: '100%', marginBottom: '24px', color: 'var(--teacher-purple)', borderColor: 'var(--teacher-purple)', background: '#fff', borderStyle: 'dashed', borderWidth: '2px' }}>+ Add MCQ Question</button>
                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>Launch Quiz to {selectedSubject}</button>
                  </form>
                </div>
                
                <div>
                  <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Active Quizzes</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {activeQuizzes.length === 0 ? (
                       <div style={{ background: '#f8fafc', padding: '60px 40px', borderRadius: '12px', border: '2px dashed var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>
                         <p style={{ margin: 0, fontSize: '1.1rem' }}>No quizzes launched yet.</p>
                       </div>
                    ) : (
                        activeQuizzes.map(quiz => (
                          <div key={quiz._id} className="interactive-card">
                            <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '1.2rem' }}>{quiz.title}</h4>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem', display: 'block', marginBottom: '20px' }}>{quiz.questions.length} Questions</span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                              <span style={{ color: 'var(--teacher-purple)', fontSize: '0.9rem', fontWeight: 'bold', background: '#f3e8ff', padding: '8px 16px', borderRadius: '20px' }}>{quiz.submissions?.length || 0} Submitted</span>
                              <button onClick={async () => {
                                try { await axios.put(`/api/admin/quizzes/${quiz._id}/publish`); fetchQuizzes(); } catch(e){}
                              }} className={quiz.showMarks ? "btn-cancel" : "btn-primary"} style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
                                {quiz.showMarks ? 'Hide Marks' : 'Publish Marks'}
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- DYNAMIC MULTI-CHART VISUALIZATION --- */}
        {activeSidebarTab === 'analytics' && (
          <div className="fade-in">
            <h2 style={{ margin: '0 0 20px 0', color: 'var(--teacher-purple)', fontSize: '1.8rem' }}>📈 Class Analytics</h2>
            {renderClassSubjectSelectors(false)}

            {selectedClassId && (
              <div className="fade-in" style={{ borderTop: '1px solid var(--border)', paddingTop: '30px' }}>
                {(() => {
                  if (classAnalytics.length === 0) return <p style={{ color: 'var(--text-muted)' }}>No data available for this class yet.</p>;

                  let totalClassScore = 0;
                  let totalClassMax = 0;
                  let totalSubmissions = 0;
                  const subjectAverages = {};
                  const gradeDistribution = { Excellent: 0, Average: 0, Fail: 0 };

                  classAnalytics.forEach(quiz => {
                    if (!subjectAverages[quiz.subject]) subjectAverages[quiz.subject] = { totalScore: 0, totalMax: 0, submissions: 0 };
                    
                    quiz.submissions.forEach(sub => {
                      totalClassScore += sub.score;
                      totalClassMax += quiz.questions.length;
                      
                      subjectAverages[quiz.subject].totalScore += sub.score;
                      subjectAverages[quiz.subject].totalMax += quiz.questions.length;
                      subjectAverages[quiz.subject].submissions++;
                      
                      totalSubmissions++;

                      const pct = (sub.score / quiz.questions.length) * 100;
                      if (pct >= 75) gradeDistribution.Excellent++;
                      else if (pct >= 40) gradeDistribution.Average++;
                      else gradeDistribution.Fail++;
                    });
                  });

                  const classAvg = totalClassMax > 0 ? Math.round((totalClassScore / totalClassMax) * 100) : 0;
                  const totalStudents = mySubjects.find(c => c._id === selectedClassId)?.students?.length || 0;

                  // Data Processing
                  const chartData = Object.keys(subjectAverages).map(sub => ({
                    name: sub,
                    Average: Math.round((subjectAverages[sub].totalScore / subjectAverages[sub].totalMax) * 100) || 0,
                    Submissions: subjectAverages[sub].submissions
                  }));

                  const pieData = [
                    { name: 'Excellent (≥75%)', value: gradeDistribution.Excellent },
                    { name: 'Average (40-74%)', value: gradeDistribution.Average },
                    { name: 'Needs Improvement (<40%)', value: gradeDistribution.Fail }
                  ];
                  const COLORS = ['#10b981', '#f59e0b', '#e11d48'];

                  const scatterData = classAnalytics.map(quiz => {
                    const tScore = quiz.submissions.reduce((acc, sub) => acc + sub.score, 0);
                    const tMax = quiz.submissions.length * quiz.questions.length;
                    return {
                      quizName: quiz.title,
                      questions: quiz.questions.length,
                      average: tMax > 0 ? Math.round((tScore / tMax) * 100) : 0
                    };
                  });

                  const areaData = classAnalytics.map((quiz, index) => {
                    const tScore = quiz.submissions.reduce((acc, sub) => acc + sub.score, 0);
                    const tMax = quiz.submissions.length * quiz.questions.length;
                    return {
                      name: `Exam ${index + 1}`,
                      Average: tMax > 0 ? Math.round((tScore / tMax) * 100) : 0,
                      TotalScore: tScore,
                      MaxPoints: tMax,
                      Submissions: quiz.submissions.length
                    };
                  });

                  const radialData = [
                    { name: 'Excellent', count: gradeDistribution.Excellent, fill: '#10b981' },
                    { name: 'Average', count: gradeDistribution.Average, fill: '#f59e0b' },
                    { name: 'Needs Improvement', count: gradeDistribution.Fail, fill: '#e11d48' }
                  ];

                  const tooltipGlassStyle = { 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255,255,255,0.3)', 
                    backgroundColor: 'rgba(255,255,255,0.1)', 
                    backdropFilter: 'blur(10px)',
                    color: '#fff' 
                  };

                  const studentPerformance = selectedClassObj?.students?.map(student => {
                    let totalScore = 0;
                    let totalMax = 0;
                    classAnalytics.forEach(quiz => {
                      const studentIdStr = student._id;
                      const sub = quiz.submissions.find(s => 
                        s.studentId === studentIdStr || 
                        (s.studentId && s.studentId._id === studentIdStr)
                      );
                      if (sub) {
                        totalScore += sub.score;
                        totalMax += quiz.questions.length;
                      }
                    });
                    return {
                      name: student.name,
                      Average: totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0,
                      Submissions: classAnalytics.filter(quiz => quiz.submissions.some(s => s.studentId === student._id || (s.studentId && s.studentId._id === student._id))).length
                    };
                  }).sort((a, b) => b.Average - a.Average) || [];

                  const selectedStudentTimeline = analyticsStudentId !== 'all' ? classAnalytics.map((quiz, index) => {
                    const classScore = quiz.submissions.reduce((acc, sub) => acc + sub.score, 0);
                    const classMax = quiz.submissions.length * quiz.questions.length;
                    const classAvg = classMax > 0 ? (classScore / classMax) * 100 : 0;
                    
                    const mySub = quiz.submissions.find(s => s.studentId === analyticsStudentId || (s.studentId && s.studentId._id === analyticsStudentId));
                    const myPct = mySub ? Math.round((mySub.score / quiz.questions.length) * 100) : 0;
                    
                    return {
                      name: quiz.title || `Exam ${index + 1}`,
                      StudentScore: myPct,
                      ClassAverage: Math.round(classAvg),
                      MaxScore: 100,
                      QuestionCount: quiz.questions.length
                    };
                  }) : [];

                  const individualGradeDistribution = [
                    { name: 'Excellent (>=80%)', count: 0, fill: '#10b981' },
                    { name: 'Good (60-79%)', count: 0, fill: '#3b82f6' },
                    { name: 'Average (40-59%)', count: 0, fill: '#f59e0b' },
                    { name: 'Needs Work (<40%)', count: 0, fill: '#ef4444' }
                  ];

                  if (analyticsStudentId !== 'all') {
                    selectedStudentTimeline.forEach(item => {
                      if (item.StudentScore >= 80) individualGradeDistribution[0].count++;
                      else if (item.StudentScore >= 60) individualGradeDistribution[1].count++;
                      else if (item.StudentScore >= 40) individualGradeDistribution[2].count++;
                      else individualGradeDistribution[3].count++;
                    });
                  }
                  const hasGradeData = individualGradeDistribution.some(g => g.count > 0);

                  return (
                    <>
                      <div className="kpi-grid">
                        <div className="light-card">
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Class Average</p>
                          <h2 style={{ margin: 0, color: classAvg >= 50 ? '#10b981' : '#e11d48', fontSize: '2.5rem' }}>{classAvg}%</h2>
                        </div>
                        <div className="light-card">
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Submissions</p>
                          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2.5rem' }}>{totalSubmissions}</h2>
                        </div>
                        <div className="light-card">
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Students Monitored</p>
                          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2.5rem' }}>{totalStudents}</h2>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '30px', marginTop: '30px' }}>
                        
                        {/* CHART 1: Subject Averages (Bar) */}
                        <div className="glass-card fade-in" style={{ padding: '30px' }}>
                          <h3 style={{ margin: '0 0 30px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Subject Averages Breakdown</h3>
                          <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                <XAxis  dataKey="name"     tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 11 }} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.8)' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={tooltipGlassStyle} />
                                <Bar dataKey="Average" fill="var(--teacher-purple)" radius={[6, 6, 0, 0]} animationDuration={1500} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* CHART 2: Grade Distribution (Pie) */}
                        <div className="glass-card fade-in" style={{ padding: '30px' }}>
                          <h3 style={{ margin: '0 0 30px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Overall Grade Distribution</h3>
                          <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value" animationDuration={1500}>
                                  {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={tooltipGlassStyle} />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#fff' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* CHART 3: Performance Trend (Area) */}
                        <div className="glass-card fade-in" style={{ padding: '30px' }}>
                          <h3 style={{ margin: '0 0 30px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Performance Trend Over Time</h3>
                          <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={areaData} margin={{ top: 10, right: 30, left: -20, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                <XAxis  dataKey="name"     tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 11 }} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.8)' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipGlassStyle} />
                                <Area type="monotone" dataKey="Average" stroke="var(--teacher-purple)" fill="rgba(139, 92, 246, 0.3)" strokeWidth={3} animationDuration={1500} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* CHART 4: Correlation Graph (Scatter) */}
                        <div className="glass-card fade-in" style={{ padding: '30px' }}>
                          <h3 style={{ margin: '0 0 30px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Exam Length vs Average</h3>
                          <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <ScatterChart margin={{ top: 10, right: 30, left: -20, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis  type="number" dataKey="questions" name="Questions"     tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 11 }} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                                <YAxis type="number" dataKey="average" name="Average %" domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.8)' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.5)' }} contentStyle={tooltipGlassStyle} />
                                <Scatter name="Exams" data={scatterData} fill="var(--teacher-purple)" animationDuration={1500} />
                              </ScatterChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* CHART 5: Composed Chart (Scores & Submissions) */}
                        <div className="glass-card fade-in" style={{ padding: '30px' }}>
                          <h3 style={{ margin: '0 0 30px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Scores vs Submissions Count</h3>
                          <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={areaData} margin={{ top: 10, right: 30, left: -20, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                <XAxis  dataKey="name"     tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 11 }} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.8)' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipGlassStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Legend wrapperStyle={{ color: '#fff' }} />
                                <Bar dataKey="Submissions" barSize={30} fill="rgba(255,255,255,0.3)" name="Submission Count" radius={[4,4,0,0]} />
                                <Line type="monotone" dataKey="Average" stroke="#10b981" strokeWidth={3} name="Average Score (%)" />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* CHART 6: Radial Distribution */}
                        <div className="glass-card fade-in" style={{ padding: '30px' }}>
                          <h3 style={{ margin: '0 0 30px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Grade Composition (Radial)</h3>
                          <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="100%" barSize={20} data={radialData}>
                                <RadialBar minAngle={15} label={{ position: 'insideStart', fill: '#fff' }} background={{ fill: 'rgba(255,255,255,0.05)' }} clockWise dataKey="count" />
                                <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ color: '#fff' }} />
                                <Tooltip contentStyle={tooltipGlassStyle} />
                              </RadialBarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* CHART 7: Overview (Radar) */}
                        <div className="glass-card fade-in" style={{ padding: '30px' }}>
                          <h3 style={{ margin: '0 0 30px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Departmental Overview Metrics</h3>
                          <div style={{ width: '100%', height: 400 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                <PolarGrid stroke="rgba(255,255,255,0.2)" />
                                <PolarAngleAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                                <Radar name="Average Score" dataKey="Average" stroke="var(--teacher-purple)" fill="var(--teacher-purple)" fillOpacity={0.4} />
                                <Tooltip contentStyle={tooltipGlassStyle} />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* CHART 8: Individual Student Performance (Interactive) */}
                        <div className="glass-card fade-in" style={{ padding: '30px', gridColumn: '1 / -1' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.3rem' }}>Specific Student Analysis</h3>
                            <select 
                              className="animated-input" 
                              value={analyticsStudentId} 
                              onChange={(e) => setAnalyticsStudentId(e.target.value)} 
                              style={{ width: '250px', marginBottom: 0, cursor: 'pointer' }}
                            >
                              <option value="all">Compare All Students</option>
                              {selectedClassObj?.students?.map(s => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                              ))}
                            </select>
                          </div>

                          {analyticsStudentId === 'all' ? (
                            <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '30px' }}>
                              <div style={{ width: '100%', height: 400 }}>
                                <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-muted)' }}>Average Scores by Student</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={studentPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                    <XAxis  dataKey="name"     tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 11 }} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.8)' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={tooltipGlassStyle} />
                                    <Bar dataKey="Average" fill="#3b82f6" radius={[6, 6, 0, 0]} animationDuration={1500} name="Average Score (%)" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                              <div style={{ width: '100%', height: 400 }}>
                                <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-muted)' }}>Exam Participation (Count)</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={studentPerformance} margin={{ top: 10, right: 30, left: -20, bottom: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                    <XAxis  dataKey="name"     tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 11 }} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.8)' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={tooltipGlassStyle} />
                                    <Area type="monotone" dataKey="Submissions" stroke="#f43f5e" fill="rgba(244, 63, 94, 0.3)" strokeWidth={3} animationDuration={1500} name="Total Submissions" />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          ) : (
                            <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '30px' }}>
                              
                              {/* 1: Composed Chart (Scores vs Class Avg) - Span full width */}
                              <div style={{ gridColumn: '1 / -1', height: 400 }}>
                                <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-muted)' }}>Student Score vs Class Average</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                  <ComposedChart data={selectedStudentTimeline} margin={{ top: 10, right: 30, left: -20, bottom: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                    <XAxis  dataKey="name"     tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 11 }} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.8)' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={tooltipGlassStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                    <Legend wrapperStyle={{ color: '#fff' }} />
                                    <Bar dataKey="StudentScore" barSize={40} fill="#f59e0b" name="Student's Score (%)" radius={[6,6,0,0]} animationDuration={1500} />
                                    <Line type="monotone" dataKey="ClassAverage" stroke="#3b82f6" strokeWidth={3} name="Class Average (%)" animationDuration={1500} />
                                  </ComposedChart>
                                </ResponsiveContainer>
                              </div>

                              {/* 2: Radar Chart (Strengths across exams) */}
                              <div style={{ height: 350 }}>
                                <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-muted)' }}>Exam Strengths Profile</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={selectedStudentTimeline}>
                                    <PolarGrid stroke="rgba(255,255,255,0.2)" />
                                    <PolarAngleAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                                    <Radar name="Student Score" dataKey="StudentScore" stroke="#10b981" fill="#10b981" fillOpacity={0.5} animationDuration={1500} />
                                    <Tooltip contentStyle={tooltipGlassStyle} />
                                  </RadarChart>
                                </ResponsiveContainer>
                              </div>

                              {/* 3: Radial / Pie Chart (Grade Distribution) */}
                              <div style={{ height: 350 }}>
                                <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-muted)' }}>Performance Consistency</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                  {hasGradeData ? (
                                    <PieChart>
                                      <Pie data={individualGradeDistribution.filter(g => g.count > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="count" animationDuration={1500}>
                                        {individualGradeDistribution.filter(g => g.count > 0).map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                      </Pie>
                                      <Tooltip contentStyle={tooltipGlassStyle} />
                                      <Legend wrapperStyle={{ color: '#fff' }} />
                                    </PieChart>
                                  ) : (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>No data available</div>
                                  )}
                                </ResponsiveContainer>
                              </div>

                              {/* 4: Scatter (Length vs Score) */}
                              <div style={{ height: 350 }}>
                                <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-muted)' }}>Score vs Exam Length</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                    <XAxis  type="number" dataKey="QuestionCount" name="Questions"     tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 11 }} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                                    <YAxis type="number" dataKey="StudentScore" name="Score (%)" domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.8)' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={tooltipGlassStyle} />
                                    <Scatter name="Exam" data={selectedStudentTimeline} fill="#a855f7" animationDuration={1500} />
                                  </ScatterChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </main>
      <Chatbot dashboardContext={`Teacher Dashboard (${activeSidebarTab})`} />
    </div>
  );
}
