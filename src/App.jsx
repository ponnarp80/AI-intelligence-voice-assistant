import React, { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import VoiceAssistant from './components/VoiceAssistant';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import History from './components/History';
import AccountSettings from './components/AccountSettings';
import AIPersonaSettings from './components/AIPersonaSettings';
import './App.css';

function App() {
  // App state
  const [currentUser, setCurrentUser]   = useState(null);
  const [currentView, setCurrentView]   = useState('auth'); // 'auth' | 'dashboard' | 'assistant' | 'history' | 'settings' | 'persona'
  
  // Settings / feature state
  const [messages, setMessages]       = useState([]);
  const [isMuted, setIsMuted]         = useState(false);
  const [isDark, setIsDark]           = useState(true);
  const [voiceGender, setVoiceGender] = useState('male'); // 'male' | 'female'

  // Check saved session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('activeUserSession');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setCurrentView('dashboard');
    }
  }, []);

  const handleLogin = (userObj) => {
    setCurrentUser(userObj);
    localStorage.setItem('activeUserSession', JSON.stringify(userObj));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('auth');
    setMessages([]); // clear session
    localStorage.removeItem('activeUserSession');
  };

  const handleClearChat    = () => setMessages([]);
  const handleToggleMute   = () => setIsMuted((p) => !p);
  const handleToggleGender = () => setVoiceGender((p) => (p === 'male' ? 'female' : 'male'));
  const handleToggleTheme  = () => {
    setIsDark((p) => !p);
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  };

  return (
    <div className={`app-root ${isDark ? 'theme-dark' : 'theme-light'}`}>
      
      {/* Hide navbar on auth screen entirely */}
      {currentView !== 'auth' && (
        <NavBar
          onClearChat={handleClearChat}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          voiceGender={voiceGender}
          onToggleGender={handleToggleGender}
          onLogout={handleLogout}
          currentView={currentView}
          onBackToDash={() => setCurrentView('dashboard')}
        />
      )}

      <main className="app-main">
        {currentView === 'auth' && <Auth onLogin={handleLogin} />}
        
        {currentView === 'dashboard' && (
          <Dashboard 
            user={currentUser} 
            onLaunchAssistant={() => setCurrentView('assistant')} 
            onNavigate={(view) => setCurrentView(view)}
          />
        )}
        
        {currentView === 'assistant' && (
          <VoiceAssistant
            messages={messages}
            setMessages={setMessages}
            isMuted={isMuted}
            voiceGender={voiceGender}
            onClearMessages={handleClearChat}
            currentUser={currentUser}
          />
        )}

        {currentView === 'history' && (
          <History currentUser={currentUser} />
        )}

        {currentView === 'settings' && (
          <AccountSettings 
            currentUser={currentUser} 
            onUpdateUser={handleLogin} 
          />
        )}

        {currentView === 'persona' && (
          <AIPersonaSettings 
            currentUser={currentUser} 
            onUpdateUser={handleLogin} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
