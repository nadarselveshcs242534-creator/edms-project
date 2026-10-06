import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ExamEnvironment({ setIsExamActive }) {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    setIsExamActive(true); 
    return () => {
      setIsExamActive(false); 
    };
  }, [setIsExamActive]);

  const handleSubmit = () => {
    alert("Exam Submitted!");
    navigate('/student'); 
  };

  return (
    <div className="app-layout" style={{ justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div className="glass-card animate-up" style={{ width: '100%', maxWidth: '800px', padding: '40px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '30px' }}>
          <h2 style={{ margin: 0, color: 'var(--primary-glow)' }}>Live MCQ Exam</h2>
          <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>● LIVE</span>
        </div>
        
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ marginBottom: '20px' }}>1. Which hook is used to manage side effects in React?</h3>
          <div className="modern-form">
            {['useState', 'useEffect', 'useContext', 'useReducer'].map((opt, idx) => (
              <label key={idx} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '15px', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="radio" 
                  name="mcq" 
                  value={opt} 
                  onChange={() => setSelectedOption(opt)} 
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <button 
          onClick={handleSubmit} 
          className="modern-btn" 
          disabled={!selectedOption}
          style={{ width: '100%', opacity: selectedOption ? 1 : 0.5, cursor: selectedOption ? 'pointer' : 'not-allowed' }}
        >
          Submit Exam
        </button>
      </div>
    </div>
  );
}