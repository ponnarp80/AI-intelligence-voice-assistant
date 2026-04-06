import React, { useState } from 'react';
import './AccountSettings.css'; // Let's reuse AccountSettings CSS to ensure it looks perfectly uniform!
import { FaRobot, FaCheckCircle, FaBrain, FaWrench } from 'react-icons/fa';

const AIPersonaSettings = ({ currentUser, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    aiTone: currentUser?.aiTone || 'default',
    aiVerbosity: currentUser?.aiVerbosity || 'concise'
  });
  
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  const handleUpdatePersona = (e) => {
    e.preventDefault();
    const usersDB = JSON.parse(localStorage.getItem('mockUsersDB') || '{}');
    if (currentUser?.email && usersDB[currentUser.email]) {
      usersDB[currentUser.email].aiTone = formData.aiTone;
      usersDB[currentUser.email].aiVerbosity = formData.aiVerbosity;
      localStorage.setItem('mockUsersDB', JSON.stringify(usersDB));
      
      onUpdateUser({ 
        ...currentUser, 
        aiTone: formData.aiTone, 
        aiVerbosity: formData.aiVerbosity
      });
      setMessage({ type: 'success', text: 'Cognitive Engine Successfully Overridden!' });
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>AI Persona Engine</h1>
        <p>Physically alter the psychological baseline and verbosity rules of the Generative Model.</p>
      </div>

      {message.text && (
        <div className={`settings-alert ${message.type}`}>
          {message.type === 'success' && <FaCheckCircle />}
          {message.text}
        </div>
      )}

      <div className="settings-grid">
        <div className="settings-card glass-panel" style={{ gridColumn: '1 / -1', maxWidth: '600px', margin: '0 auto' }}>
          <div className="card-title">
            <FaBrain className="title-icon" />
            <h2>Cognitive Matrix Editor</h2>
          </div>
          <form onSubmit={handleUpdatePersona} className="settings-form">
            <div className="form-group">
              <label>Assistant Tone & Tone</label>
              <select name="aiTone" value={formData.aiTone} onChange={handleChange} className="settings-select">
                <option value="default">Default (Helpful & Concise)</option>
                <option value="professional">Strictly Professional & Formal</option>
                <option value="sarcastic">Sarcastic, Witty & Humorous</option>
                <option value="creative">Creative & Dramatic Storyteller</option>
              </select>
              <small>This setting intercepts the generative system prompt and hacks its baseline instructions.</small>
            </div>
            
            <div className="form-group">
              <label>Model Verbosity Restrictions</label>
              <select name="aiVerbosity" value={formData.aiVerbosity} onChange={handleChange} className="settings-select">
                <option value="concise">Micro-Responses (3-5 Lines Maximum)</option>
                <option value="comprehensive">Comprehensive Output (Long essays)</option>
              </select>
              <small>Removes the strict character constraints enforced on the underlying API calls.</small>
            </div>

            <button type="submit" className="save-btn"><FaWrench style={{ marginRight: '8px' }}/> Install Neural Overrides</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIPersonaSettings;
