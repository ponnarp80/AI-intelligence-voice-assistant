import React from 'react';
import { FaBrain, FaTrashAlt, FaVolumeMute, FaVolumeUp, FaMoon, FaSun, FaExchangeAlt, FaSignOutAlt, FaArrowLeft } from 'react-icons/fa';
import './NavBar.css';

const NavBar = ({ 
  onClearChat, isMuted, onToggleMute, isDark, onToggleTheme, 
  voiceGender, onToggleGender, onLogout, currentView, onBackToDash 
}) => {
  const isFemale = voiceGender === 'female';

  return (
    <nav className="navbar" aria-label="Main navigation">
      {/* Brand & Navigation */}
      <div className="navbar-brand">
        {['assistant', 'history', 'settings'].includes(currentView) && (
          <button className="nav-btn icon-only" onClick={onBackToDash} title="Back to Dashboard">
            <FaArrowLeft size={14} />
          </button>
        )}
        <FaBrain className="brand-icon" />
        <span className="brand-name">{isFemale ? 'FRIDAY' : 'JARVIS'}</span>
      </div>

      {/* Actions */}
      <div className="navbar-actions">

        {/* Voice gender switch */}
        <button
          className={`nav-btn gender-btn ${isFemale ? 'female' : 'male'}`}
          onClick={onToggleGender}
          title={`Switch to ${isFemale ? 'JARVIS' : 'FRIDAY'}`}
          aria-label="Toggle voice gender"
        >
          <FaExchangeAlt size={14} />
          <span>Switch to {isFemale ? 'JARVIS' : 'FRIDAY'}</span>
        </button>

        {/* Mute TTS */}
        <button
          className={`nav-btn ${isMuted ? 'active' : ''}`}
          onClick={onToggleMute}
          title={isMuted ? 'Unmute voice' : 'Mute voice'}
          aria-label="Toggle voice output"
        >
          {isMuted ? <FaVolumeMute size={15} /> : <FaVolumeUp size={15} />}
          <span>{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        {/* Theme toggle */}
        <button
          className="nav-btn"
          onClick={onToggleTheme}
          title="Toggle theme"
          aria-label="Toggle light/dark theme"
        >
          {isDark ? <FaSun size={15} /> : <FaMoon size={15} />}
          <span>{isDark ? 'Light' : 'Dark'}</span>
        </button>

        {/* Clear Chat (Only in assistant view) */}
        {currentView === 'assistant' && (
          <button
            className="nav-btn danger"
            onClick={onClearChat}
            title="Clear conversation"
            aria-label="Clear chat history"
          >
            <FaTrashAlt size={15} />
            <span>Clear</span>
          </button>
        )}

        {/* Sign Out */}
        <button
          className="nav-btn"
          onClick={onLogout}
          title="Sign Out"
          aria-label="Sign out of account"
        >
          <FaSignOutAlt size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
