import { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

export default function Chatbot({ dashboardContext = 'EduNexis System' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: `Hello! I am your EduNexis Assistant. How can I help you with the ${dashboardContext}?`, sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const apiKey = import.meta.env.VITE_CHATBOT_API_KEY;
  console.log("My API Key is:", apiKey);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMessage = { text: input, sender: 'student' };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const formattedHistory = newMessages.map(msg => ({
        role: msg.sender === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      // Using the exact model assigned to your account: gemini-3.8-flash
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: `You are the EduNexis AI support bot. The user is currently on the ${dashboardContext}. Keep your answers concise, friendly, and highly relevant to education management. Do not use complex markdown formatting.` }]
          },
          contents: formattedHistory
        })
      });

      const data = await response.json();
      
      if (data.error) throw new Error(data.error.message);

      const botReply = data.candidates[0].content.parts[0].text;
      setMessages(prev => [...prev, { text: botReply, sender: 'bot' }]);

    } catch (error) {
      console.error("Chatbot API Error:", error);
      setMessages(prev => [...prev, { text: "⚠️ Sorry, I lost connection to the server. Please try again.", sender: 'bot' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chatbot-container" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
      {isOpen ? (
        <div className="light-card" style={{ width: '320px', height: '450px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          {/* Header */}
          <div style={{ background: 'var(--text-main)', color: 'white', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>🤖 EduNexis Support</h3>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>✖</button>
          </div>
          
          {/* Message Window */}
          <div style={{ flexGrow: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-light)' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ 
                alignSelf: msg.sender === 'student' ? 'flex-end' : 'flex-start',
                background: msg.sender === 'student' ? 'var(--student-orange)' : 'white',
                color: msg.sender === 'student' ? 'white' : 'var(--text-main)',
                padding: '10px 14px',
                borderRadius: msg.sender === 'student' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                maxWidth: '85%',
                fontSize: '0.9rem',
                border: msg.sender === 'bot' ? '1px solid var(--border)' : 'none',
                boxShadow: 'var(--shadow-sm)'
              }}>
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', background: 'white', padding: '10px 14px', borderRadius: '12px 12px 12px 0', fontSize: '0.9rem', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                AI is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '15px', background: 'white', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your question..." 
              style={{ flexGrow: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none' }}
            />
            <button 
              onClick={handleSend} 
              disabled={isTyping}
              style={{ padding: '10px 15px', background: 'var(--student-orange)', color: 'white', border: 'none', borderRadius: '6px', cursor: isTyping ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
              ➤
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)} 
          style={{ padding: '12px 24px', background: 'var(--student-orange)', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🤖 Need Help?
        </button>
      )}
    </div>
  );
}