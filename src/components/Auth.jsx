import React, { useState } from 'react';
import './Auth.css';
import { FaUserCircle, FaEnvelope, FaLock, FaUser } from 'react-icons/fa';

const Auth = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (!pwd) return { score: 0, text: '', color: 'transparent' };
    if (pwd.length > 5) score += 1;
    if (pwd.length > 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 25, text: 'Weak', color: '#ff4d4d' };
    if (score === 2) return { score: 50, text: 'Fair', color: '#ffa64d' };
    if (score === 3) return { score: 75, text: 'Good', color: '#ffd24d' };
    return { score: 100, text: 'Strong', color: '#00cc66' };
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simulate database lookup from LocalStorage
    const usersDB = JSON.parse(localStorage.getItem('mockUsersDB') || '{}');
    
    if (isRegistering) {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        setError("All fields are required.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (usersDB[formData.email]) {
        setError("Email already registered. Please sign in.");
        return;
      }
      
      // Save new user
      const newUser = { name: formData.name, email: formData.email, joined: new Date().toISOString() };
      usersDB[formData.email] = { ...newUser, password: formData.password };
      localStorage.setItem('mockUsersDB', JSON.stringify(usersDB));
      
      onLogin(newUser);
    } else {
      // Sign in logic
      const user = usersDB[formData.email];
      if (!user || user.password !== formData.password) {
        setError("Invalid email or password.");
        return;
      }
      
      // Load EVERYTHING except the password into the session
      const { password, ...userProfile } = user;
      onLogin(userProfile);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <FaUserCircle className="auth-icon" />
          <h2>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
          <p>{isRegistering ? 'Register to access Intelligent Assistant' : 'Sign in to access your Workspace'}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegistering && (
            <div className="input-group">
              <FaUser className="input-icon" />
              <input 
                type="text" 
                name="name" 
                placeholder="Full Name" 
                value={formData.name} onChange={handleChange} 
              />
            </div>
          )}
          
          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input 
              type="email" 
              name="email" 
              placeholder="Email Address" 
              value={formData.email} onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="input-group">
            <FaLock className="input-icon" />
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              value={formData.password} onChange={handleChange} 
              required 
            />
          </div>

          {isRegistering && formData.password && (
            <div className="password-strength-container">
              <div className="strength-bar-bg">
                <div 
                  className="strength-bar-fill" 
                  style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
                ></div>
              </div>
              <span className="strength-text" style={{ color: strength.color }}>{strength.text}</span>
            </div>
          )}

          {isRegistering && (
            <div className="input-group">
              <FaLock className="input-icon" />
              <input 
                type="password" 
                name="confirmPassword" 
                placeholder="Confirm Password" 
                value={formData.confirmPassword} onChange={handleChange} 
                required 
              />
            </div>
          )}

          <button type="submit" className="auth-submit-btn">
            {isRegistering ? 'Register & Enter' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isRegistering ? "Already have an account?" : "New to the platform?"}{' '}
            <button 
              className="link-btn" 
              type="button" 
              onClick={() => { 
                setIsRegistering(!isRegistering); 
                setError(''); 
                setFormData({ name: '', email: '', password: '', confirmPassword: '' });
              }}
            >
              {isRegistering ? 'Sign In' : 'Create an account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
