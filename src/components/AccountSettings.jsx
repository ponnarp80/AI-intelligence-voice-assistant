import React, { useState } from 'react';
import './AccountSettings.css';
import { FaUserEdit, FaLock, FaCheckCircle, FaKey } from 'react-icons/fa';

const AccountSettings = ({ currentUser, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    currentPassword: '',
    newPassword: '',
    customApiKey: currentUser?.customApiKey || '',
    customModel: currentUser?.customModel || 'gemini-2.5-flash',
    groqApiKey: currentUser?.groqApiKey || '',
    groqModel: currentUser?.groqModel || 'llama-3.3-70b-versatile',
    primaryProvider: currentUser?.primaryProvider || 'gemini'
  });
  
  const [message, setMessage] = useState({ type: '', text: '' }); // type: 'success' | 'error'

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    // Simulate DB Update
    const usersDB = JSON.parse(localStorage.getItem('mockUsersDB') || '{}');
    if (currentUser?.email && usersDB[currentUser.email]) {
      usersDB[currentUser.email].name = formData.name;
      localStorage.setItem('mockUsersDB', JSON.stringify(usersDB));
      
      onUpdateUser({ ...currentUser, name: formData.name });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    }
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!formData.currentPassword || !formData.newPassword) return;

    const usersDB = JSON.parse(localStorage.getItem('mockUsersDB') || '{}');
    const dbUser = usersDB[currentUser?.email];

    if (dbUser && dbUser.password === formData.currentPassword) {
      dbUser.password = formData.newPassword;
      localStorage.setItem('mockUsersDB', JSON.stringify(usersDB));
      setFormData({ ...formData, currentPassword: '', newPassword: '' });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
    } else {
      setMessage({ type: 'error', text: 'Incorrect current password.' });
    }
  };

  const handleUpdateConfig = (e) => {
    e.preventDefault();
    const usersDB = JSON.parse(localStorage.getItem('mockUsersDB') || '{}');
    if (currentUser?.email && usersDB[currentUser.email]) {
      usersDB[currentUser.email].customApiKey = formData.customApiKey;
      usersDB[currentUser.email].customModel = formData.customModel;
      usersDB[currentUser.email].groqApiKey = formData.groqApiKey;
      usersDB[currentUser.email].groqModel = formData.groqModel;
      usersDB[currentUser.email].primaryProvider = formData.primaryProvider;
      localStorage.setItem('mockUsersDB', JSON.stringify(usersDB));
      
      onUpdateUser({ 
        ...currentUser, 
        customApiKey: formData.customApiKey, 
        customModel: formData.customModel,
        groqApiKey: formData.groqApiKey,
        groqModel: formData.groqModel,
        primaryProvider: formData.primaryProvider
      });
      setMessage({ type: 'success', text: 'AI Configuration successfully updated!' });
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Account Settings</h1>
        <p>Manage your profile configuration and security credentials.</p>
      </div>

      {message.text && (
        <div className={`settings-alert ${message.type}`}>
          {message.type === 'success' && <FaCheckCircle />}
          {message.text}
        </div>
      )}

      <div className="settings-grid">
        {/* Profile Card */}
        <div className="settings-card glass-panel">
          <div className="card-title">
            <FaUserEdit className="title-icon" />
            <h2>Profile Details</h2>
          </div>
          <form onSubmit={handleUpdateProfile} className="settings-form">
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={currentUser?.email || ''} disabled className="disabled-input" />
              <small>Email cannot be changed.</small>
            </div>
            <div className="form-group">
              <label>Display Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <button type="submit" className="save-btn">Save Profile</button>
          </form>
        </div>

        {/* Security Card */}
        <div className="settings-card glass-panel">
          <div className="card-title">
            <FaLock className="title-icon" />
            <h2>Security</h2>
          </div>
          <form onSubmit={handleUpdatePassword} className="settings-form">
            <div className="form-group">
              <label>Current Password</label>
              <input 
                type="password" 
                name="currentPassword" 
                value={formData.currentPassword} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input 
                type="password" 
                name="newPassword" 
                value={formData.newPassword} 
                onChange={handleChange} 
                required 
              />
            </div>
            <button type="submit" className="save-btn danger-hover">Update Password</button>
          </form>
        </div>

        {/* AI Config Card */}
        <div className="settings-card glass-panel">
          <div className="card-title">
            <FaKey className="title-icon" />
            <h2>AI Configuration</h2>
          </div>
          <form onSubmit={handleUpdateConfig} className="settings-form">
            <div className="form-group">
              <label>Primary AI Engine (Default)</label>
              <div className="provider-selector">
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="primaryProvider" 
                    value="gemini" 
                    checked={formData.primaryProvider === 'gemini'} 
                    onChange={handleChange} 
                  />
                  <span>Gemini</span>
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="primaryProvider" 
                    value="groq" 
                    checked={formData.primaryProvider === 'groq'} 
                    onChange={handleChange} 
                  />
                  <span>Groq</span>
                </label>
              </div>
              <small>Choose which AI brain handles your commands first.</small>
            </div>
            <div className="form-group">
              <label>Custom Gemini API Key</label>
              <input 
                type="password" 
                name="customApiKey" 
                placeholder="Leave blank to use default system key"
                value={formData.customApiKey} 
                onChange={handleChange} 
              />
              <small>Your key is securely stored locally on your device.</small>
            </div>
            <div className="form-group">
              <label>AI Model Variant</label>
              <select name="customModel" value={formData.customModel} onChange={handleChange} className="settings-select">
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Advanced)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </select>
            </div>
            <button type="submit" className="save-btn">Save Configuration</button>
          </form>
        </div>
        {/* Groq Config Card */}
        <div className="settings-card glass-panel">
          <div className="card-title">
            <FaKey className="title-icon" style={{ color: '#f59e0b' }} />
            <h2>Groq Configuration (Failover)</h2>
          </div>
          <form onSubmit={handleUpdateConfig} className="settings-form">
            <div className="form-group">
              <label>Groq API Key</label>
              <input 
                type="password" 
                name="groqApiKey" 
                placeholder="gsk_..."
                value={formData.groqApiKey} 
                onChange={handleChange} 
              />
              <small>Used as a backup when Gemini hits rate limits.</small>
            </div>
            <div className="form-group">
              <label>Groq Model Variant</label>
              <select name="groqModel" value={formData.groqModel} onChange={handleChange} className="settings-select">
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
                <option value="llama-3.1-70b-versatile">Llama 3.1 70B Versatile</option>
                <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
              </select>
            </div>
            <button type="submit" className="save-btn">Save Groq Config</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
