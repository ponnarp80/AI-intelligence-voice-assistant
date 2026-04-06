import React from 'react';
import './Dashboard.css';
import { FaMicrophoneAlt, FaHistory, FaCog, FaBrain } from 'react-icons/fa';

const Dashboard = ({ user, onLaunchAssistant, onNavigate }) => {
  // Use user's name or fallback
  const firstName = user?.name ? user.name.split(' ')[0] : 'Guest';

  return (
    <div className="dash-container">
      <div className="dash-header">
        <h1>Welcome back, <span className="highlight-name">{firstName}</span></h1>
        <p>Your Intelligent Assistant is ready.</p>
      </div>

      <div className="dash-grid">
        {/* Main Launch Card */}
        <div className="dash-card primary-card glass-panel" onClick={onLaunchAssistant}>
          <div className="card-icon-wrapper pulse-anim">
            <FaBrain className="card-icon" />
          </div>
          <div className="card-content">
            <h2>Launch Assistant</h2>
            <p>Start a new voice or text conversation with your AI</p>
          </div>
          <div className="card-action">
            <FaMicrophoneAlt />
          </div>
        </div>

        {/* Stats Card */}
        <div className="dash-card secondary-card glass-panel" onClick={() => onNavigate('history')}>
          <div className="card-icon-wrapper">
            <FaHistory className="card-icon" />
          </div>
          <div className="card-content">
            <h2>Recent History</h2>
            <p>View your past conversations and interactions</p>
          </div>
        </div>

        {/* Settings Card */}
        <div className="dash-card secondary-card glass-panel" onClick={() => onNavigate('settings')}>
          <div className="card-icon-wrapper">
            <FaCog className="card-icon" />
          </div>
          <div className="card-content">
            <h2>Account Settings</h2>
            <p>Manage your profile, password, and preferences</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
