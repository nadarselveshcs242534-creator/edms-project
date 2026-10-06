import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Chatbot from '../components/Chatbot';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  PieChart, Pie, Cell, Legend, AreaChart, Area, ScatterChart, Scatter, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, ComposedChart, RadialBarChart, RadialBar
} from 'recharts';

export default function StudentDashboard() {
  const [activeSidebarTab, setActiveSidebarTab] = useState('classes');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [classSubTab, setClassSubTab] = useState('materials'); 
  const [submission, setSubmission] = useState({ file: null, link: '' });
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [mySubjects, setMySubjects] = useState([]);
  const [pendingAssignments, setPendingAssignments] = useState([]); 
  const [allMyQuizzes, setAllMyQuizzes] = useState([]);
  const [publishedExamPapers, setPublishedExamPapers] = useState([]);
  const [kpiData, setKpiData] = useState({ overallAttendance: 0 });
  
  const navigate = useNavigate();

  const getUserIdFromToken = () => {
    const token = localStorage.getItem('edms_token');
    if (!token) return null;
    try { return JSON.parse(atob(token.split('.')[1])).id || JSON.parse(atob(token.split('.')[1]))._id; } 
    catch (e) { return null; }
  };

  const handleTabChange = (tab) => {
    setActiveSidebarTab(tab);
    setSelectedClassId('');
    setSelectedSubject('');
    setActiveQuiz(null);
    setClassSubTab('materials');
  };

  useEffect(() => {
    const fetchEnrolledClasses = async () => {
      try {
        const studentId = getUserIdFromToken();
        const res = await axios.get('/api/admin/classrooms');
        if (studentId) {
          const enrolled = res.data.filter(cls => 
            cls.students && cls.students.some(student => (student._id || student).toString() === studentId.toString())
          );
          setMySubjects(enrolled);
        }
      } catch (error) { console.error("Error fetching enrolled classes:", error); }
    };
    fetchEnrolledClasses();
  }, []);

  const fetchQuizzes = async () => {
    if (selectedClassId && selectedSubject) {
      try {
        const res = await axios.get(`/api/admin/quizzes/${selectedClassId}/${selectedSubject}`);
        setAvailableQuizzes(res.data);

        const examRes = await axios.get(`/api/admin/exam-papers/${selectedClassId}`);
        const filteredExams = examRes.data.filter(e => e.subject === selectedSubject && e.isPublished);
        setPublishedExamPapers(filteredExams);
      } catch (err) { console.error("Error fetching quizzes or exams", err); }
    }
  };

  const fetchAllAnalyticsData = async () => {
    if (mySubjects.length === 0) return;
    try {
      let aggregatedQuizzes = [];
      for (const cls of mySubjects) {
        for (const sub of cls.subjects) {
          const res = await axios.get(`/api/admin/quizzes/${cls._id}/${sub}`);
          aggregatedQuizzes = [...aggregatedQuizzes, ...res.data];
        }
      }
      setAllMyQuizzes(aggregatedQuizzes);
    } catch (err) { console.error("Analytics fetch error", err); }
  };

  useEffect(() => {
    if (activeSidebarTab === 'quizzes' || activeSidebarTab === 'reports') fetchQuizzes();
    if (activeSidebarTab === 'analytics') fetchAllAnalyticsData();
  }, [selectedClassId, selectedSubject, activeSidebarTab, mySubjects]);

  const handleSubmission = (e) => {
    e.preventDefault();
    alert(`Assignment Submitted to ${selectedSubject} Successfully!`);
    setSubmission({ file: null, link: '' });
  };

  const handleStartQuiz = (quizObj) => {
    setActiveQuiz(quizObj);
    setQuizAnswers({});
  };

  const handleAnswerSelect = (qIndex, oIndex) => {
    setQuizAnswers(prev => ({ ...prev, [qIndex]: oIndex }));
  };

  const handleSubmitQuiz = async () => {
    try {
      const studentId = getUserIdFromToken();
      await axios.post(`/api/admin/quizzes/${activeQuiz._id}/submit`, { studentId, answers: quizAnswers });
      alert("✅ Exam submitted successfully!");
      setActiveQuiz(null);
      setQuizAnswers({});
      fetchQuizzes(); 
    } catch (error) { alert("❌ Failed to submit the exam."); }
  };

  const handleLogout = () => { localStorage.removeItem('edms_token'); navigate('/'); };

  const selectedClassObj = mySubjects.find(c => c._id === selectedClassId);

  const renderClassSubjectSelectors = (requireSubject = true) => (
    <div className="fade-in" style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '250px' }}>
        <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>1. Select Enrolled Class</label>
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
            {mySubjects.find(c => c._id === selectedClassId)?.subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}
    </div>
  );

  return (
    <div className="app-layout">
      <nav className="top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--student-orange)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(249, 115, 22, 0.3)' }}>E</div>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.4rem' }}>EduNexis <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', marginLeft: '10px', letterSpacing: '1px' }}>STUDENT PORTAL</span></h2>
        </div>
        
        <div className="nav-links">
          <button className={activeSidebarTab === 'classes' ? 'active' : ''} onClick={() => handleTabChange('classes')}>📘 My Classes</button>
          <button className={activeSidebarTab === 'quizzes' ? 'active' : ''} onClick={() => handleTabChange('quizzes')}>⏱️ Take Quizzes</button>
          <button className={activeSidebarTab === 'reports' ? 'active' : ''} onClick={() => handleTabChange('reports')}>📊 Exam Reports</button>
          <button className={activeSidebarTab === 'analytics' ? 'active' : ''} onClick={() => handleTabChange('analytics')}>📈 Analytics Center</button>
        </div>
        
        <button onClick={handleLogout} style={{ color: 'var(--danger)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: '1px solid rgba(225,29,72,0.3)', borderRadius: '12px' }}>⎋ Logout</button>
      </nav>

      <main className="main-content fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '2rem', color: 'var(--text-main)' }}>Student Dashboard</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.05rem' }}>Welcome back, track your progress.</p>
          </div>
        </div>

        {/* Global KPIs */}
        {!selectedClassId && activeSidebarTab === 'classes' && (
          <div className="kpi-grid fade-in">
            <div className="light-card" style={{ display: 'flex', gap: '20px', alignItems: 'center', borderTop: '4px solid var(--student-orange)' }}>
              <div style={{ fontSize: '2.5rem', background: '#fff7ed', padding: '15px', borderRadius: '14px', color: 'var(--student-orange)' }}>🏫</div>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Classes Enrolled</p>
                <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2.2rem' }}>{mySubjects.length}</h2>
              </div>
            </div>
            <div className="light-card" style={{ display: 'flex', gap: '20px', alignItems: 'center', borderTop: '4px solid var(--student-orange)' }}>
              <div style={{ fontSize: '2.5rem', background: '#fff7ed', padding: '15px', borderRadius: '14px' }}>⏱️</div>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Attendance</p>
                <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {kpiData.overallAttendance}% 
                  {kpiData.overallAttendance < 75 && (
                    <span style={{ fontSize: '0.45em', background: '#fff1f2', color: 'var(--danger)', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>⚠️ Warning</span>
                  )}
                </h2>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: MY CLASSES */}
        {activeSidebarTab === 'classes' && (
          <div className="fade-in">
            {!selectedClassId && (
              <>
                <h3 style={{ marginBottom: '20px', color: 'var(--text-main)', fontSize: '1.4rem' }}>Enrolled Classes</h3>
                <div className="kpi-grid">
                  {mySubjects.length === 0 && (
                    <div className="light-card" style={{ gridColumn: 'span 2', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Not enrolled in any subjects yet.
                    </div>
                  )}
                  {mySubjects.map(sub => (
                    <div key={sub._id} className="interactive-card" onClick={() => setSelectedClassId(sub._id)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fff7ed', color: 'var(--student-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 'bold' }}>
                            {sub.name.charAt(0)}
                          </div>
                          <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>{sub.name}</h4>
                        </div>
                        <div style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>
                          <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>📚 <strong>{sub.subjects.length}</strong> Subjects included</span>
                        </div>
                      </div>
                      <div style={{ color: 'var(--student-orange)', fontWeight: '600', fontSize: '0.95rem', display: 'flex', justifyContent: 'flex-end' }}>
                        Go to Classroom →
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selectedClassId && !selectedSubject && (
              <div className="fade-in">
                <button onClick={() => setSelectedClassId('')} className="btn-cancel" style={{ border: 'none', padding: '8px 0', marginBottom: '20px', display: 'inline-flex', gap: '8px' }}>
                  ← Back to All Classes
                </button>
                <div className="light-card" style={{ marginBottom: '20px' }}>
                  <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '2.2rem' }}>{selectedClassObj?.name}</h2>
                  <p style={{ margin: '0 0 30px 0', color: 'var(--text-muted)', fontSize: '1.1rem' }}>Select a subject to view course materials and tasks.</p>
                  
                  <div className="kpi-grid">
                    {selectedClassObj?.subjects.map((subjectName, index) => (
                      <div key={index} onClick={() => setSelectedSubject(subjectName)} className="interactive-card" style={{ textAlign: 'center', padding: '30px', cursor: 'pointer' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '20px', transition: 'transform 0.2s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>📘</div>
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '1.2rem' }}>{subjectName}</h4>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedClassId && selectedSubject && (
              <div className="fade-in">
                <button onClick={() => setSelectedSubject('')} className="btn-cancel" style={{ border: 'none', padding: '8px 0', marginBottom: '20px', display: 'inline-flex', gap: '8px' }}>
                  ← Back to {selectedClassObj?.name}
                </button>
                
                <div className="light-card" style={{ minHeight: '600px', padding: '40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                    <div>
                      <h2 style={{ margin: '0 0 8px 0', color: 'var(--student-orange)', fontSize: '2.5rem' }}>{selectedSubject}</h2>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.1rem' }}>Classroom: {selectedClassObj?.name}</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '40px', borderBottom: '1px solid var(--border)', marginBottom: '40px', overflowX: 'auto' }}>
                    {['materials', 'assignments'].map(tab => (
                      <span key={tab} onClick={() => setClassSubTab(tab)} style={{ cursor: 'pointer', fontWeight: classSubTab === tab ? '700' : '500', color: classSubTab === tab ? 'var(--student-orange)' : 'var(--text-muted)', borderBottom: classSubTab === tab ? '3px solid var(--student-orange)' : '3px solid transparent', paddingBottom: '16px', textTransform: 'capitalize', fontSize: '1.1rem', transition: 'all 0.2s ease' }}>
                        {tab === 'materials' ? 'Course Materials' : tab}
                      </span>
                    ))}
                  </div>
                  
                  <div className="responsive-split fade-in">
                    {classSubTab === 'materials' && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Recent Materials</h3>
                        <div style={{ background: '#f8fafc', padding: '60px 40px', borderRadius: '12px', border: '2px dashed var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>
                          <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>📁</div>
                          <p style={{ margin: 0, fontSize: '1.1rem' }}>No materials uploaded by the teacher yet.</p>
                        </div>
                      </div>
                    )}

                    {classSubTab === 'assignments' && (
                      <>
                        <div style={{ background: '#f8fafc', padding: '30px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                          <form onSubmit={handleSubmission}>
                            <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>📤 Submit Work</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>Upload your completed file for {selectedSubject}.</p>
                            <input type="file" onChange={(e) => setSubmission({ ...submission, file: e.target.files[0] })} className="animated-input" style={{ padding: '10px' }} />
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', margin: '10px 0 20px 0', fontWeight: '600' }}>OR PROVIDE A LINK</div>
                            <input type="url" placeholder="Paste link (Github, Drive, etc.)" value={submission.link} onChange={(e) => setSubmission({ ...submission, link: e.target.value })} className="animated-input" />
                            <button type="submit" className="btn-primary" style={{ background: 'var(--student-orange)', width: '100%', marginTop: '10px' }}>Upload Submission</button>
                          </form>
                        </div>
                        
                        <div>
                          <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Pending Assignments</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {pendingAssignments.length === 0 ? (
                              <div style={{ background: '#f8fafc', padding: '60px 40px', borderRadius: '12px', border: '2px dashed var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No pending assignments! 🎉
                              </div>
                            ) : (
                              pendingAssignments.map(assignment => (
                                <div key={assignment._id} className="interactive-card">
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📚</div>
                                      <div>
                                        <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-main)', fontSize: '1.1rem' }}>{assignment.title}</h4>
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Due: {assignment.dueDate}</p>
                                      </div>
                                    </div>
                                    <span style={{ padding: '6px 12px', background: '#fff7ed', color: 'var(--student-orange)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #fed7aa' }}>Pending</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TAKE QUIZZES */}
        {activeSidebarTab === 'quizzes' && (
          <div className="light-card fade-in">
            <h2 style={{ margin: '0 0 20px 0', color: 'var(--student-orange)', fontSize: '1.8rem' }}>⏱️ Take Quizzes</h2>
            {!activeQuiz && renderClassSubjectSelectors(true)}

            {selectedClassId && selectedSubject && (
              <div className="fade-in" style={{ borderTop: '1px solid var(--border)', paddingTop: '30px' }}>
                {activeQuiz ? (
                  <div className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                      <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.6rem' }}>📝 {activeQuiz.title}</h3>
                    </div>
                    
                    {activeQuiz.questions.map((q, qIndex) => (
                      <div key={qIndex} style={{ marginBottom: '24px', padding: '30px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '12px' }}>
                        <p style={{ margin: '0 0 20px 0', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1.15rem' }}>{qIndex + 1}. {q.questionText}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {q.options.map((opt, oIndex) => (
                            <label key={oIndex} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: 'var(--text-main)', fontSize: '1.05rem', background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', transition: 'all 0.2s ease' }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--student-orange)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                              <input 
                                type="radio" 
                                name={`question-${qIndex}`} 
                                checked={quizAnswers[qIndex] === oIndex} 
                                onChange={() => handleAnswerSelect(qIndex, oIndex)} 
                                style={{ accentColor: 'var(--student-orange)', width: '20px', height: '20px' }} 
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    <div style={{ display: 'flex', gap: '16px', marginTop: '40px', borderTop: '1px solid var(--border)', paddingTop: '30px' }}>
                      <button onClick={handleSubmitQuiz} className="btn-primary" style={{ background: 'var(--student-orange)', padding: '12px 30px' }}>Submit Exam</button>
                      <button onClick={() => { if (window.confirm("Are you sure? Your progress will be lost.")) setActiveQuiz(null); }} className="btn-cancel">Cancel Exam</button>
                    </div>
                  </div>
                ) : (
                  <div className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.4rem' }}>Available Quizzes</h3>
                      <button onClick={fetchQuizzes} className="btn-cancel" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>🔄 Refresh</button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '20px' }}>
                      {availableQuizzes.length === 0 ? (
                        <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '60px', borderRadius: '12px', border: '2px dashed var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                          No active exams for {selectedSubject} at this time.
                        </div>
                      ) : (
                        availableQuizzes.map((quiz, index) => {
                          const studentId = getUserIdFromToken();
                          const hasSubmitted = quiz.submissions && quiz.submissions.find(s => {
                            const sId = s.studentId?._id || s.studentId;
                            return sId && studentId && sId.toString() === studentId.toString();
                          });
                          
                          return (
                            <div key={index} className="interactive-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>⏱️</div>
                                <div>
                                  <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-main)', fontSize: '1.2rem' }}>{quiz.title}</h4>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>❓ {quiz.questions.length} Questions</span>
                                </div>
                              </div>
                              
                              {hasSubmitted ? (
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ display: 'block', color: '#10b981', fontWeight: 'bold', marginBottom: '5px' }}>✅ Completed</span>
                                  {quiz.showMarks ? (
                                    <span style={{ fontSize: '0.95rem', color: 'var(--text-main)', background: '#ecfdf5', padding: '6px 12px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                                      Score: {hasSubmitted.score} / {quiz.questions.length}
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Marks pending</span>
                                  )}
                                </div>
                              ) : (
                                <button onClick={() => handleStartQuiz(quiz)} className="btn-primary" style={{ background: 'var(--student-orange)', padding: '10px 20px' }}>
                                  Start Exam →
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EXAM REPORTS */}
        {activeSidebarTab === 'reports' && (
          <div className="light-card fade-in">
            <h2 style={{ margin: '0 0 20px 0', color: 'var(--student-orange)', fontSize: '1.8rem' }}>📊 Exam Reports</h2>
            {renderClassSubjectSelectors(true)}

            {selectedClassId && selectedSubject && (
              <div className="fade-in" style={{ borderTop: '1px solid var(--border)', paddingTop: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.4rem' }}>Grades & Transcripts</h3>
                  <button className="btn-cancel">📥 Download Transcript</button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(() => {
                    const studentId = getUserIdFromToken();
                    const publishedReports = availableQuizzes.filter(quiz => {
                      if (!quiz.showMarks) return false;
                      return quiz.submissions?.some(s => {
                        const sId = s.studentId?._id || s.studentId;
                        return sId && studentId && sId.toString() === studentId.toString();
                      });
                    });

                    if (publishedReports.length === 0) {
                      return (
                        <div style={{ background: '#f8fafc', padding: '60px', borderRadius: '12px', border: '2px dashed var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>
                          <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>📈</div>
                          <p style={{ margin: 0, fontSize: '1.1rem' }}>No exam reports generated for {selectedSubject} yet.</p>
                        </div>
                      );
                    }

                    return publishedReports.map(quiz => {
                      const studentIdStr = getUserIdFromToken()?.toString();
                      const submission = quiz.submissions.find(s => {
                        const sId = s.studentId?._id || s.studentId;
                        return sId && studentIdStr && sId.toString() === studentIdStr;
                      });
                      
                      if (!submission) return null;
                      
                      const percentage = Math.round((submission.score / quiz.questions.length) * 100);
                      const isPassing = percentage >= 35;

                      return (
                        <div key={quiz._id} className="interactive-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: isPassing ? '#ecfdf5' : '#fff1f2', color: isPassing ? '#10b981' : '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
                              📊
                            </div>
                            <div>
                              <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-main)', fontSize: '1.2rem' }}>{quiz.title}</h4>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>MCQ Examination</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: 'bold' }}>
                              {submission.score} / {quiz.questions.length}
                            </span>
                            <span style={{ display: 'block', color: isPassing ? '#10b981' : 'var(--danger)', fontSize: '0.9rem', marginTop: '4px', fontWeight: 'bold' }}>
                              {percentage}% - {isPassing ? 'PASS' : 'FAIL'}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {/* EXAM PAPERS (OFFLINE EXAMS EVALUATED BY TEACHER) */}
                  {publishedExamPapers.map(exam => {
                    const studentIdStr = getUserIdFromToken()?.toString();
                    const myScore = exam.scores.find(s => s.studentId?._id?.toString() === studentIdStr);
                    if (!myScore || myScore.marks === null) return null;

                    const percentage = Math.round((myScore.marks / exam.maxMarks) * 100);
                    const isPassing = percentage >= 35;

                    return (
                      <div key={exam._id} className="interactive-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: isPassing ? '#ecfdf5' : '#fff1f2', color: isPassing ? '#10b981' : '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
                            📄
                          </div>
                          <div>
                            <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-main)', fontSize: '1.2rem' }}>{exam.title}</h4>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Written Exam Paper</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: 'bold' }}>
                            {myScore.marks} / {exam.maxMarks}
                          </span>
                          <span style={{ display: 'block', color: isPassing ? '#10b981' : 'var(--danger)', fontSize: '0.9rem', marginTop: '4px', fontWeight: 'bold' }}>
                            {percentage}% - {isPassing ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- DYNAMIC MULTI-CHART VISUALIZATION --- */}
        {activeSidebarTab === 'analytics' && (
          <div className="fade-in">
            <h2 style={{ margin: '0 0 20px 0', color: 'var(--student-orange)', fontSize: '1.8rem' }}>📈 Performance Analytics</h2>
            
            {(() => {
              const studentId = getUserIdFromToken();
              const mySubmissions = [];
              let totalScore = 0;
              let totalMax = 0;
              const subjectAverages = {};
              const gradeDistribution = { Excellent: 0, Average: 0, Fail: 0 };

              allMyQuizzes.forEach(quiz => {
                if(quiz.showMarks) {
                  const sub = quiz.submissions?.find(s => (s.studentId?._id || s.studentId)?.toString() === studentId);
                  if(sub) {
                    mySubmissions.push({ title: quiz.title, subject: quiz.subject, score: sub.score, max: quiz.questions.length });
                    totalScore += sub.score;
                    totalMax += quiz.questions.length;

                    if (!subjectAverages[quiz.subject]) subjectAverages[quiz.subject] = { score: 0, max: 0 };
                    subjectAverages[quiz.subject].score += sub.score;
                    subjectAverages[quiz.subject].max += quiz.questions.length;

                    const pct = (sub.score / quiz.questions.length) * 100;
                    if (pct >= 75) gradeDistribution.Excellent++;
                    else if (pct >= 40) gradeDistribution.Average++;
                    else gradeDistribution.Fail++;
                  }
                }
              });

              const overallPercentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
              
              // Data Configurations for Charts
              const barData = Object.keys(subjectAverages).map(sub => ({
                name: sub,
                Percentage: Math.round((subjectAverages[sub].score / subjectAverages[sub].max) * 100)
              }));

              const pieData = [
                { name: 'Excellent (≥75%)', value: gradeDistribution.Excellent },
                { name: 'Average (40-74%)', value: gradeDistribution.Average },
                { name: 'Needs Improvement (<40%)', value: gradeDistribution.Fail }
              ];
              const COLORS = ['#10b981', '#f59e0b', '#e11d48'];

              const scatterData = mySubmissions.map((sub, index) => ({
                name: sub.title || `Quiz ${index + 1}`,
                questions: sub.max,
                percentage: Math.round((sub.score / sub.max) * 100)
              }));

              const areaData = mySubmissions.map((sub, index) => ({
                name: `Exam ${index + 1}`,
                percentage: Math.round((sub.score / sub.max) * 100),
                score: sub.score,
                max: sub.max
              }));

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

              return (
                <>
                  <div className="kpi-grid">
                    <div className="light-card">
                      <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Overall Score</p>
                      <h2 style={{ margin: 0, color: overallPercentage >= 50 ? '#10b981' : '#e11d48', fontSize: '2.5rem' }}>{overallPercentage}%</h2>
                    </div>
                    <div className="light-card">
                      <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Exams Completed</p>
                      <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2.5rem' }}>{mySubmissions.length}</h2>
                    </div>
                    <div className="light-card">
                      <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Classes Active</p>
                      <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2.5rem' }}>{mySubjects.length}</h2>
                    </div>
                  </div>

                  {mySubmissions.length === 0 ? (
                    <div className="light-card fade-in" style={{ marginTop: '20px', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                      Not enough data to generate analytics yet.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '30px', marginTop: '30px' }}>
                      
                      {/* CHART 1: Subject Averages (Bar) */}
                      <div className="glass-card fade-in" style={{ padding: '30px' }}>
                        <h3 style={{ margin: '0 0 30px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Subject Health</h3>
                        <div style={{ width: '100%', height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                              <XAxis  dataKey="name"     tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 11 }} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                              <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.8)' }} axisLine={false} tickLine={false} />
                              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={tooltipGlassStyle} />
                              <Bar dataKey="Percentage" fill="var(--student-orange)" radius={[6, 6, 0, 0]} animationDuration={1500} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* CHART 2: Performance Distribution (Pie) */}
                      <div className="glass-card fade-in" style={{ padding: '30px' }}>
                        <h3 style={{ margin: '0 0 30px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Personal Grade Distribution</h3>
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

                      {/* CHART 3: Personal Trend (Area) */}
                      <div className="glass-card fade-in" style={{ padding: '30px' }}>
                        <h3 style={{ margin: '0 0 30px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Performance Timeline</h3>
                        <div style={{ width: '100%', height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={areaData} margin={{ top: 10, right: 30, left: -20, bottom: 40 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                              <XAxis  dataKey="name"     tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 11 }} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                              <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.8)' }} axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={tooltipGlassStyle} />
                              <Area type="monotone" dataKey="percentage" stroke="var(--student-orange)" fill="rgba(249, 115, 22, 0.3)" strokeWidth={3} animationDuration={1500} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* CHART 4: Scatter Correlation */}
                      <div className="glass-card fade-in" style={{ padding: '30px' }}>
                        <h3 style={{ margin: '0 0 30px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Exam Difficulty vs Score</h3>
                        <div style={{ width: '100%', height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 10, right: 30, left: -20, bottom: 40 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                              <XAxis  type="number" dataKey="questions" name="Questions"     tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 11 }} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                              <YAxis type="number" dataKey="percentage" name="Score %" domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.8)' }} axisLine={false} tickLine={false} />
                              <Tooltip cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.5)' }} contentStyle={tooltipGlassStyle} />
                              <Scatter name="Exams" data={scatterData} fill="var(--student-orange)" animationDuration={1500} />
                            </ScatterChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* CHART 5: Composed Chart (Score vs Max) */}
                      <div className="glass-card fade-in" style={{ padding: '30px' }}>
                        <h3 style={{ margin: '0 0 30px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Score vs Max Points (Composed)</h3>
                        <div style={{ width: '100%', height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={areaData} margin={{ top: 10, right: 30, left: -20, bottom: 40 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                              <XAxis  dataKey="name"     tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 11 }} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fill: 'rgba(255,255,255,0.8)' }} axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={tooltipGlassStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                              <Legend wrapperStyle={{ color: '#fff' }} />
                              <Bar dataKey="max" barSize={20} fill="rgba(255,255,255,0.3)" name="Max Points" radius={[4,4,0,0]} />
                              <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} name="Your Score" />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* CHART 6: Overview (Radar) */}
                      <div className="glass-card fade-in" style={{ padding: '30px' }}>
                        <h3 style={{ margin: '0 0 30px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Strengths & Weaknesses</h3>
                        <div style={{ width: '100%', height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={barData}>
                              <PolarGrid stroke="rgba(255,255,255,0.2)" />
                              <PolarAngleAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                              <Radar name="Percentage" dataKey="Percentage" stroke="var(--student-orange)" fill="var(--student-orange)" fillOpacity={0.4} />
                              <Tooltip contentStyle={tooltipGlassStyle} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* CHART 7: Radial Bar (Grade Focus) */}
                      <div className="glass-card fade-in" style={{ padding: '30px', gridColumn: '1 / -1' }}>
                        <h3 style={{ margin: '0 0 30px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>Grade Composition (Radial)</h3>
                        <div style={{ width: '100%', height: 400 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="100%" barSize={30} data={radialData}>
                              <RadialBar minAngle={15} label={{ position: 'insideStart', fill: '#fff' }} background={{ fill: 'rgba(255,255,255,0.05)' }} clockWise dataKey="count" />
                              <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ color: '#fff' }} />
                              <Tooltip contentStyle={tooltipGlassStyle} />
                            </RadialBarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </main>
      <Chatbot dashboardContext={`Student Dashboard (${activeSidebarTab})`} />
    </div>
  );
}
