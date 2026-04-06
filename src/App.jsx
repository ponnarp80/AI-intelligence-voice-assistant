import React, { useState } from 'react';
import NavBar from './components/NavBar';
import VoiceAssistant from './components/VoiceAssistant';
import './App.css';

function App() {
  const [messages, setMessages]       = useState([]);
  const [isMuted, setIsMuted]         = useState(false);
  const [isDark, setIsDark]           = useState(true);
  const [voiceGender, setVoiceGender] = useState('male'); // 'male' | 'female'

  const handleClearChat    = () => setMessages([]);
  const handleToggleMute   = () => setIsMuted((p) => !p);
  const handleToggleGender = () => setVoiceGender((p) => (p === 'male' ? 'female' : 'male'));
  const handleToggleTheme  = () => {
    setIsDark((p) => !p);
  };

  return (
    <div className={`app-root ${isDark ? 'theme-dark' : 'theme-light'}`}>
      <NavBar
        onClearChat={handleClearChat}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        voiceGender={voiceGender}
        onToggleGender={handleToggleGender}
      />
      <main className="app-main">
        <VoiceAssistant
          messages={messages}
          setMessages={setMessages}
          isMuted={isMuted}
          voiceGender={voiceGender}
          onClearMessages={handleClearChat}
        />
      </main>
    </div>
  );
}

export default App;
