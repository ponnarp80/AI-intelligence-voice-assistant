import React from 'react';
import { FaBrain, FaTrashAlt, FaVolumeMute, FaVolumeUp, FaMoon, FaSun, FaExchangeAlt } from 'react-icons/fa';
import './NavBar.css';

const NavBar = ({ onClearChat, isMuted, onToggleMute, isDark, onToggleTheme, voiceGender, onToggleGender }) => {
  const isFemale = voiceGender === 'female';

  return (
    <nav className="navbar" aria-label="Main navigation">
      {/* Brand */}
      <div className="navbar-brand">
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

        {/* Clear Chat */}
        <button
          className="nav-btn danger"
          onClick={onClearChat}
          title="Clear conversation"
          aria-label="Clear chat history"
        >
          <FaTrashAlt size={15} />
          <span>Clear</span>
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
