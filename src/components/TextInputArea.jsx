import React, { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import './TextInputArea.css';

const TextInputArea = ({ onSendMessage, disabled }) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() && !disabled) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <form className="text-input-container" onSubmit={handleSubmit}>
      <input
        type="text"
        className="text-input"
        placeholder="Type a message..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        disabled={disabled}
      />
      <button 
        type="submit" 
        className="send-button"
        disabled={!inputText.trim() || disabled}
      >
        <FaPaperPlane />
      </button>
    </form>
  );
};

export default TextInputArea;
