import React from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaSpinner, FaStop } from 'react-icons/fa';
import './MicrophoneButton.css';

const MicrophoneButton = ({ status, onToggleListening }) => {
  // status can be 'idle', 'listening', 'processing', 'speaking', 'error'

  const getIcon = () => {
    switch (status) {
      case 'listening': return <FaMicrophone size={32} />;
      case 'processing': return <FaStop size={32} />;
      case 'speaking': return <FaStop size={32} />;
      case 'error': return <FaMicrophoneSlash size={32} />;
      default: return <FaMicrophone size={32} />;
    }
  };

  const ringClass = `mic-ring ${status}`;

  return (
    <div className="mic-container">
      <div className={ringClass}></div>
      <div className={ringClass} style={{ animationDelay: '0.5s' }}></div>
      <button 
        className={`mic-btn ${status}`} 
        onClick={onToggleListening}
        aria-label={status === 'processing' || status === 'speaking' ? "Terminate Generation" : "Toggle Microphone"}
      >
        {getIcon()}
      </button>
      <div className="status-text">
        {status === 'idle' && 'Tap to speak'}
        {status === 'listening' && 'Listening...'}
        {status === 'processing' && 'Thinking...'}
        {status === 'speaking' && 'Speaking...'}
        {status === 'error' && 'Mic Error'}
      </div>
    </div>
  );
};

export default MicrophoneButton;
