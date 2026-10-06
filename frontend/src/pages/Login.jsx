import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        ...credentials, role: selectedRole
      });
      localStorage.setItem('edms_token', response.data.token);
      
      const role = response.data.role;
      if (role === 'Admin') navigate('/admin');
      else if (role === 'Teacher') navigate('/teacher');
      else navigate('/student');
    } catch (err) {
      setError(err.response?.data?.error || 'Server connection failed.');
    }
  };

  if (selectedRole) {
    // Dynamic theme coloring with safe hex fallbacks
    const themeColor = selectedRole === 'Admin' ? '#0d9488' : selectedRole === 'Teacher' ? '#8b5cf6' : '#f97316';
    
    return (
      <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', padding: '20px' }}>
        <div className="light-card fade-in" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
          <h2 style={{ color: themeColor, fontSize: '2.2rem', margin: '0 0 10px 0' }}>{selectedRole} Login</h2>
          <p style={{ color: '#64748b', marginBottom: '30px' }}>Enter your credentials to continue</p>
          
          {error && <div style={{ background: '#fff1f2', color: '#e11d48', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: '600' }}>{error}</div>}
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input type="email" placeholder="Email Address" required onChange={e => setCredentials({...credentials, email: e.target.value})} className="animated-input" style={{ marginBottom: 0 }} />
            <input type="password" placeholder="Password" required onChange={e => setCredentials({...credentials, password: e.target.value})} className="animated-input" style={{ marginBottom: 0 }} />
            <button type="submit" className="btn-primary" style={{ background: themeColor, width: '100%', padding: '14px', fontSize: '1.05rem', marginTop: '10px' }}>Login Securely</button>
            <button type="button" onClick={() => setSelectedRole(null)} className="btn-cancel" style={{ border: 'none', background: 'transparent' }}>← Back to Role Selection</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', padding: '40px 20px' }}>
      
      <div className="fade-in" style={{ textAlign: 'center', marginBottom: '50px' }}>
        <div style={{ width: '64px', height: '64px', background: '#1e293b', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '2.2rem', margin: '0 auto 20px auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>E</div>
        <h1 style={{ fontSize: '2.8rem', color: '#1e293b', margin: '0 0 10px 0', letterSpacing: '-1px' }}>EduNexis</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', margin: 0 }}>One Platform. Every Learner. Endless Possibilities.</p>
      </div>

      {/* FIXED LAYOUT: Using CSS Grid to force a perfect 3-column row on desktop */}
      <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '30px', width: '100%', maxWidth: '1050px' }}>
        
        {/* Admin Card */}
        <div className="interactive-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 30px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>🛡️</div>
            <h3 style={{ color: '#0d9488', fontSize: '1.5rem', margin: '0 0 15px 0' }}>Administrator</h3>
            <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: '1.5', margin: 0 }}>Manage users, deploy classes, assign subjects, and oversee system workflow.</p>
          </div>
          <button onClick={() => setSelectedRole('Admin')} className="btn-primary" style={{ marginTop: '30px', background: '#0d9488', width: '100%' }}>Login as Admin →</button>
        </div>

        {/* Teacher Card */}
        <div className="interactive-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 30px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>👨‍🏫</div>
            <h3 style={{ color: '#8b5cf6', fontSize: '1.5rem', margin: '0 0 15px 0' }}>Educator</h3>
            <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: '1.5', margin: 0 }}>Upload materials, mark attendance, deploy assignments, and evaluate students.</p>
          </div>
          <button onClick={() => setSelectedRole('Teacher')} className="btn-primary" style={{ marginTop: '30px', background: '#8b5cf6', width: '100%' }}>Login as Teacher →</button>
        </div>

        {/* Student Card */}
        <div className="interactive-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 30px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>👨‍🎓</div>
            <h3 style={{ color: '#f97316', fontSize: '1.5rem', margin: '0 0 15px 0' }}>Student</h3>
            <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: '1.5', margin: 0 }}>Access your enrolled classes, submit assignments, take exams, and view reports.</p>
          </div>
          <button onClick={() => setSelectedRole('Student')} className="btn-primary" style={{ marginTop: '30px', background: '#f97316', width: '100%' }}>Login as Student →</button>
        </div>
        
      </div>
    </div>
  );
}