import React, { useRef, useEffect } from 'react';
import { FaUser, FaRobot } from 'react-icons/fa';
import './ConversationDisplay.css';

const ConversationDisplay = ({ messages, assistantName = 'JARVIS' }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    // RAF ensures the DOM has painted the new message before we scroll
    const raf = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [messages]);

  return (
    <div className="conversation-container" ref={scrollRef}>
      {messages.length === 0 ? (
        <div className="empty-state">
          <FaRobot size={52} className="empty-icon" />
          <p>Hello! I&apos;m <strong>{assistantName}</strong>, your Intelligent Assistant.</p>
          <p className="hint">Tap the microphone or type a message to begin.</p>
        </div>
      ) : (
        messages.map((msg, index) => (
          <div key={index} className={`message-wrapper ${msg.role}`}>
            <div className="message-bubble">
              <div className="message-icon">
                {msg.role === 'user' ? <FaUser size={13} /> : <FaRobot size={13} />}
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
