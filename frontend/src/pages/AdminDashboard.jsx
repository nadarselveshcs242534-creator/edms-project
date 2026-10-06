import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminDashboard() {
  // Data States
  const [users, setUsers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  
  const [exams, setExams] = useState([]);
  
  // Form States
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Student' });
  const [newClassroom, setNewClassroom] = useState({ name: '', subjects: '' });
  const [newExam, setNewExam] = useState({ title: '', classroomId: '', subject: '', maxMarks: 100 });
  
  // Edit States
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingClassId, setEditingClassId] = useState(null);
  
  // Enrollment States
  const [enrollingClass, setEnrollingClass] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);

  // UI States
  const [activeTab, setActiveTab] = useState('users');
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => { 
    fetchData(); 
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await axios.get('https://edms-project.onrender.com/api/admin/users');
      const classRes = await axios.get('https://edms-project.onrender.com/api/admin/classrooms');
      setUsers(userRes.data);
      setClassrooms(classRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        await axios.put(`https://edms-project.onrender.com/api/admin/users/${editingUserId}`, newUser);
        setMessage('✅ User updated successfully!');
        setEditingUserId(null);
      } else {
        await axios.post('https://edms-project.onrender.com/api/admin/users', newUser);
        setMessage(`✅ User ${newUser.name} created successfully!`);
      }
      setNewUser({ name: '', email: '', password: '', role: 'Student' });
      fetchData();
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      setMessage('❌ Error processing user.');
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await axios.delete(`https://edms-project.onrender.com/api/admin/users/${id}`);
      fetchData();
    } catch (error) {
      setMessage('❌ Error deleting user.');
    }
  };

  const handleSaveClassroom = async (e) => {
    e.preventDefault();
    try {
      const subjectsArray = typeof newClassroom.subjects === 'string' 
        ? newClassroom.subjects.split(',').map(s => s.trim()) 
        : newClassroom.subjects;

      if (editingClassId) {
        await axios.put(`https://edms-project.onrender.com/api/admin/classrooms/${editingClassId}`, {
          name: newClassroom.name,
          subjects: subjectsArray
        });
        setMessage('✅ Classroom updated successfully!');
        setEditingClassId(null);
      } else {
        await axios.post('https://edms-project.onrender.com/api/admin/classrooms', { 
          name: newClassroom.name, 
          subjects: subjectsArray 
        });
        setMessage(`✅ Classroom ${newClassroom.name} created!`);
      }
      setNewClassroom({ name: '', subjects: '' });
      fetchData();
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      setMessage('❌ Error processing classroom.');
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleDeleteClassroom = async (id) => {
    if (!window.confirm('Delete this classroom?')) return;
    try {
      await axios.delete(`https://edms-project.onrender.com/api/admin/classrooms/${id}`);
      fetchData();
    } catch (error) {
      setMessage('❌ Error deleting classroom.');
    }
  };

  const handleToggleStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  const handleSaveEnrollment = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`https://edms-project.onrender.com/api/admin/classrooms/${enrollingClass._id}`, {
        name: enrollingClass.name,
        subjects: enrollingClass.subjects,
        students: selectedStudents
      });
      setMessage(`✅ Students successfully enrolled in ${enrollingClass.name}!`);
      setEnrollingClass(null);
      fetchData();
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      setMessage('❌ Error enrolling students.');
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://edms-project.onrender.com/api/admin/exam-papers', newExam);
      setMessage(`✅ Exam ${newExam.title} created!`);
      setNewExam({ title: '', classroomId: '', subject: '', maxMarks: 100 });
      // To see all exams, we'd need to fetch them. For simplicity, we just show success.
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      setMessage('❌ Error creating exam.');
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('edms_token');
    navigate('/');
  };

  const studentsOnly = users.filter(u => u.role === 'Student');

  return (
    <div className="app-layout">
      <nav className="top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--admin-teal, #0d9488)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(13, 148, 136, 0.3)' }}>E</div>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.4rem' }}>EduNexis <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', marginLeft: '10px', letterSpacing: '1px' }}>ADMIN PANEL</span></h2>
        </div>
        
        <div className="nav-links">
          <button 
            className={activeTab === 'users' ? 'active' : ''} 
            onClick={() => { setActiveTab('users'); setEnrollingClass(null); }} 
            style={activeTab === 'users' ? { color: 'var(--admin-teal, #0d9488)', background: '#f0fdfa' } : {}}
          >
            👤 User Management
          </button>
          <button 
            className={activeTab === 'classrooms' ? 'active' : ''} 
            onClick={() => setActiveTab('classrooms')} 
            style={activeTab === 'classrooms' ? { color: 'var(--admin-teal, #0d9488)', background: '#f0fdfa' } : {}}
          >
            🏫 Classes & Subjects
          </button>
          <button 
            className={activeTab === 'exams' ? 'active' : ''} 
            onClick={() => setActiveTab('exams')} 
            style={activeTab === 'exams' ? { color: 'var(--admin-teal, #0d9488)', background: '#f0fdfa' } : {}}
          >
            📄 Exam Papers
          </button>
        </div>
        
        <button onClick={handleLogout} style={{ color: 'var(--danger)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: '1px solid rgba(225,29,72,0.3)', borderRadius: '12px' }}>
          ⎋ Logout
        </button>
      </nav>

      <main className="main-content fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '2rem', color: 'var(--text-main)' }}>Admin Dashboard</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.05rem' }}>Manage your institution's data.</p>
          </div>
        </div>
        
        {message && (
          <div className="fade-in" style={{ padding: '16px 20px', background: '#f0fdfa', color: '#0f766e', border: '1px solid #ccfbf1', borderRadius: '12px', marginBottom: '30px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {message}
          </div>
        )}

        <div className="kpi-grid fade-in">
          <div className="light-card" style={{ display: 'flex', gap: '20px', alignItems: 'center', borderTop: '4px solid var(--admin-teal, #0d9488)' }}>
            <div style={{ fontSize: '2.5rem', background: '#f0fdfa', padding: '15px', borderRadius: '14px', color: '#0d9488' }}>👨‍🎓</div>
            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Users</p>
              <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2.2rem' }}>{users.length}</h2>
            </div>
          </div>
          <div className="light-card" style={{ display: 'flex', gap: '20px', alignItems: 'center', borderTop: '4px solid var(--admin-teal, #0d9488)' }}>
            <div style={{ fontSize: '2.5rem', background: '#f0fdfa', padding: '15px', borderRadius: '14px' }}>🏛️</div>
            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Classes</p>
              <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2.2rem' }}>{classrooms.length}</h2>
            </div>
          </div>
        </div>
        
        <div className="responsive-split fade-in">
          
          {/* LEFT PANEL: Forms */}
          <div className="light-card" style={{ alignSelf: 'start' }}>
            
            {activeTab === 'users' && (
              <form onSubmit={handleSaveUser}>
                <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>
                  {editingUserId ? '✎ Edit User Details' : '✨ Register New User'}
                </h3>
                
                <input type="text" placeholder="Full Name" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="animated-input" />
                <input type="email" placeholder="Email Address" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="animated-input" />
                
                {!editingUserId && (
                  <input type="password" placeholder="Password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="animated-input" />
                )}
                
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="animated-input">
                  <option value="Student">Student</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Admin">Admin</option>
                </select>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="submit" className="btn-primary" style={{ background: 'var(--admin-teal, #0d9488)', flex: 1 }}>
                    {editingUserId ? 'Save Changes' : 'Create User'}
                  </button>
                  {editingUserId && (
                    <button type="button" onClick={() => { setEditingUserId(null); setNewUser({ name: '', email: '', password: '', role: 'Student' }); }} className="btn-cancel" style={{ flex: 1 }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}

            {activeTab === 'classrooms' && (
              <>
                {enrollingClass ? (
                  <form onSubmit={handleSaveEnrollment} className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.3rem' }}>Manage Roster</h3>
                      <span style={{ background: '#f0fdfa', color: 'var(--admin-teal, #0d9488)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        {enrollingClass.name}
                      </span>
                    </div>
                    
                    <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '24px', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', background: '#f8fafc' }}>
                      {studentsOnly.length === 0 ? <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No students in system.</p> : null}
                      
                      {studentsOnly.map(student => (
                        <label key={student._id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: 'white', borderRadius: '8px', marginBottom: '8px', transition: 'all 0.2s ease' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedStudents.includes(student._id)}
                            onChange={() => handleToggleStudent(student._id)}
                            style={{ width: '20px', height: '20px', accentColor: 'var(--admin-teal, #0d9488)' }}
                          />
                          <span style={{ fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: '500' }}>{student.name}</span>
                        </label>
                      ))}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button type="submit" className="btn-primary" style={{ background: 'var(--admin-teal, #0d9488)', flex: 1 }}>Confirm Roster</button>
                      <button type="button" onClick={() => setEnrollingClass(null)} className="btn-cancel" style={{ flex: 1 }}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSaveClassroom} className="fade-in">
                    <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>
                      {editingClassId ? '✎ Edit Class Details' : '🏫 Deploy New Class'}
                    </h3>
                    
                    <input type="text" placeholder="Class Name (e.g., TY-CSE)" required value={newClassroom.name} onChange={e => setNewClassroom({...newClassroom, name: e.target.value})} className="animated-input" />
                    <input type="text" placeholder="Subjects (comma separated)" required value={newClassroom.subjects} onChange={e => setNewClassroom({...newClassroom, subjects: e.target.value})} className="animated-input" />
                    
                    <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                      <button type="submit" className="btn-primary" style={{ background: 'var(--admin-teal, #0d9488)', flex: 1 }}>
                        {editingClassId ? 'Save Changes' : 'Deploy Class'}
                      </button>
                      {editingClassId && (
                        <button type="button" onClick={() => { setEditingClassId(null); setNewClassroom({ name: '', subjects: '' }); }} className="btn-cancel" style={{ flex: 1 }}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </>
            )}

            {activeTab === 'exams' && (
              <form onSubmit={handleSaveExam} className="fade-in">
                <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>
                  📄 Upload Exam Paper
                </h3>
                
                <input type="text" placeholder="Exam Title (e.g. Midterm Physics)" required value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} className="animated-input" />
                <select 
                  required 
                  value={newExam.classroomId} 
                  onChange={e => setNewExam({...newExam, classroomId: e.target.value, subject: ''})} 
                  className="animated-input"
                >
                  <option value="">Select Class...</option>
                  {classrooms.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                
                <select 
                  required 
                  value={newExam.subject} 
                  onChange={e => setNewExam({...newExam, subject: e.target.value})} 
                  className="animated-input"
                  disabled={!newExam.classroomId}
                >
                  <option value="">Select Subject...</option>
                  {newExam.classroomId && classrooms.find(c => c._id === newExam.classroomId)?.subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <input type="number" placeholder="Max Marks" required value={newExam.maxMarks} onChange={e => setNewExam({...newExam, maxMarks: e.target.value})} className="animated-input" min="1" />
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="submit" className="btn-primary" style={{ background: 'var(--admin-teal, #0d9488)', flex: 1 }}>
                    Deploy Exam Paper
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* RIGHT PANEL: Directories */}
          <div style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
            <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-main)', paddingLeft: '5px', fontSize: '1.4rem' }}>
              {activeTab === 'users' ? 'Directory' : (activeTab === 'exams' ? 'Exam Guidelines' : 'Active Classrooms')}
            </h3>
            
            {activeTab === 'users' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="fade-in">
                {users.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No users found.</p>}
                {users.map(u => (
                  <div key={u._id} className="interactive-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: '#0d9488', fontWeight: 'bold' }}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <strong style={{ display: 'block', color: 'var(--text-main)', marginBottom: '6px', fontSize: '1.1rem' }}>{u.name}</strong>
                        <span style={{ color: '#0d9488', fontSize: '0.8rem', fontWeight: 'bold', background: '#f0fdfa', padding: '4px 10px', borderRadius: '20px', border: '1px solid #ccfbf1' }}>
                          {u.role}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => { setEditingUserId(u._id); setNewUser({ name: u.name, email: u.email, password: '', role: u.role }); }} className="btn-cancel" style={{ padding: '8px 16px', border: 'none', background: '#f1f5f9' }}>
                        ✎ Edit
                      </button>
                      <button onClick={() => handleDeleteUser(u._id)} className="btn-cancel" style={{ padding: '8px 16px', border: 'none', color: 'var(--danger)', background: '#fff1f2' }}>
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'classrooms' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '20px' }} className="fade-in">
                {classrooms.length === 0 ? (
                  <div className="light-card" style={{ gridColumn: 'span 2', textAlign: 'center', color: 'var(--text-muted)', padding: '60px' }}>
                    No classrooms deployed yet.
                  </div>
                ) : (
                  classrooms.map(cls => (
                    <div key={cls._id} className="interactive-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setEditingClassId(cls._id); setNewClassroom({ name: cls.name, subjects: cls.subjects.join(', ') }); setEnrollingClass(null); }} className="btn-cancel" style={{ padding: '6px 12px', border: 'none', background: '#f1f5f9' }}>
                          ✎
                        </button>
                        <button onClick={() => handleDeleteClassroom(cls._id)} className="btn-cancel" style={{ padding: '6px 12px', border: 'none', color: 'var(--danger)', background: '#fff1f2' }}>
                          🗑
                        </button>
                      </div>

                      <div>
                        <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>{cls.name}</h4>
                        <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '0.95rem', paddingRight: '60px', lineHeight: '1.5' }}>
                          📚 Subjects: {cls.subjects.join(', ')}
                        </p>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.3rem' }}>👥</span>
                          <span style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem' }}>
                            {cls.students ? cls.students.length : 0} Enrolled
                          </span>
                        </div>
                        
                        <button onClick={() => { setEnrollingClass(cls); setSelectedStudents(cls.students?.map(s => s._id || s) || []); setEditingClassId(null); }} className="btn-primary" style={{ background: 'var(--admin-teal, #0d9488)', padding: '8px 16px', fontSize: '0.9rem' }}>
                          Manage Roster →
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            
            {activeTab === 'exams' && (
              <div className="light-card fade-in" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <h4 style={{ color: 'var(--text-main)', fontSize: '1.2rem', marginBottom: '10px' }}>What happens when you deploy an Exam Paper?</h4>
                <p>Teachers assigned to the class will receive this exam in their dashboard.</p>
                <p>They can then manually evaluate papers and input student marks.</p>
                <p>Once graded and published, marks will be updated in the Student's report card dynamically.</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
