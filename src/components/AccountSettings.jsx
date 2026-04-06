import React, { useState } from 'react';
import './AccountSettings.css';
import { FaUserEdit, FaLock, FaCheckCircle, FaKey } from 'react-icons/fa';

const AccountSettings = ({ currentUser, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    currentPassword: '',
    newPassword: '',
    customApiKey: currentUser?.customApiKey || '',
    customModel: currentUser?.customModel || 'gemini-2.5-flash'
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
      localStorage.setItem('mockUsersDB', JSON.stringify(usersDB));
      
      onUpdateUser({ 
        ...currentUser, 
        customApiKey: formData.customApiKey, 
        customModel: formData.customModel
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
      </div>
    </div>
  );
};

export default AccountSettings;
