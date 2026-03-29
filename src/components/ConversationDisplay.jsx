import React, { useRef, useEffect } from 'react';
import { FaUser, FaRobot } from 'react-icons/fa';
import './ConversationDisplay.css';

const ConversationDisplay = ({ messages }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="conversation-container" ref={scrollRef}>
      {messages.length === 0 ? (
        <div className="empty-state">
          <FaRobot size={48} className="empty-icon" />
          <p>Hello! I am your Intelligent Assistant.</p>
          <p className="hint">Tap the microphone or type below to start.</p>
        </div>
      ) : (
        messages.map((msg, index) => (
          <div key={index} className={`message-wrapper ${msg.role}`}>
            <div className="message-bubble">
              <div className="message-icon">
                {msg.role === 'user' ? <FaUser size={14} /> : <FaRobot size={14} />}
              </div>
              <div className="message-text">{msg.text}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ConversationDisplay;
