import React, { useState, useEffect } from 'react';
import './History.css';
import { FaTrashAlt, FaHistory, FaUser, FaRobot } from 'react-icons/fa';

const History = ({ currentUser }) => {
  const [historyLogs, setHistoryLogs] = useState([]);

  useEffect(() => {
    if (currentUser?.email) {
      const saved = localStorage.getItem(`chatHistory_${currentUser.email}`);
      if (saved) {
        setHistoryLogs(JSON.parse(saved).reverse()); // newest first
      }
    }
  }, [currentUser]);

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to permanently delete your conversation history?')) {
      localStorage.removeItem(`chatHistory_${currentUser.email}`);
      setHistoryLogs([]);
    }
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <div>
          <h1>Conversation History</h1>
          <p>Review your past interactions securely saved on your device.</p>
        </div>
        {historyLogs.length > 0 && (
          <button className="clear-history-btn" onClick={clearHistory}>
            <FaTrashAlt /> Clear History
          </button>
        )}
      </div>

      <div className="history-list">
        {historyLogs.length === 0 ? (
          <div className="empty-history glass-panel">
            <FaHistory className="empty-icon" />
            <h3>No History Found</h3>
            <p>Go to your dashboard and launch the assistant to start a conversation.</p>
          </div>
        ) : (
          historyLogs.map((log, index) => (
            <div key={index} className="history-item glass-panel">
              <div className="history-timestamp">
                {new Date(log.timestamp).toLocaleString(undefined, {
                  weekday: 'short', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
              <div className="history-messages">
                <div className="history-msg user">
                  <FaUser className="msg-icon" />
                  <div className="msg-bubble">{log.prompt}</div>
                </div>
                <div className="history-msg ai">
                  <FaRobot className="msg-icon" />
                  <div className="msg-bubble">{log.response}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default History;
