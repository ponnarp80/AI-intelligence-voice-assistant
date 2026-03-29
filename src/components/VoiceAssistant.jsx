import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import MicrophoneButton from './MicrophoneButton';
import ConversationDisplay from './ConversationDisplay';
import TextInputArea from './TextInputArea';
import './VoiceAssistant.css';

const VoiceAssistant = () => {
  const [status, setStatus] = useState('idle'); // idle, listening, processing, speaking, error
  const [messages, setMessages] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Initialize Gemini
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Setup Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        handleUserMessage(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== 'no-speech') {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        } else {
            setStatus('idle');
        }
      };

      recognitionRef.current.onend = () => {
        // If we were listening and it ended without going to processing, reset to idle
        setStatus((prev) => prev === 'listening' ? 'idle' : prev);
      };
    } else {
      console.warn("Speech Recognition not supported in this browser.");
    }
    
    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handleUserMessage = async (text) => {
    if (!text.trim()) return;
    
    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', text }]);
    setStatus('processing');
    
    try {
      // Call Gemini API
      // Use gemini-2.5-flash for text responses
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = text + " (Keep your response concise and conversational as you are a voice assistant)";
      
      const result = await model.generateContent(prompt);
      const outputText = result.response.text();
      
      // Add AI response to UI
      setMessages(prev => [...prev, { role: 'ai', text: outputText }]);
      
      // Read response aloud
      speakText(outputText);
      
    } catch (error) {
      console.error('Gemini API Error:', error);
      setStatus('error');
      setErrorMsg('Failed to process request. Check API key or connection.');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      synthRef.current.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a good English voice
      const voices = synthRef.current.getVoices();
      const preferredVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) || voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;
      
      utterance.pitch = 1;
      utterance.rate = 1;

      utterance.onstart = () => setStatus('speaking');
      utterance.onend = () => setStatus('idle');
      utterance.onerror = (e) => {
        console.error("Speech Synthesis Error", e);
        setStatus('idle');
      };

      synthRef.current.speak(utterance);
    } else {
      setStatus('idle'); // Fallback if no TTS
    }
  };

  const toggleListening = () => {
    if (status === 'speaking') {
      synthRef.current.cancel();
      setStatus('idle');
      return;
    }
    
    if (status === 'listening') {
      recognitionRef.current?.stop();
      setStatus('idle');
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setStatus('listening');
          setErrorMsg('');
        } catch (e) {
          console.error("Microphone start error:", e);
        }
      } else {
        setErrorMsg('Voice recognition not strictly supported in this browser. Try Chrome/Edge or use text input.');
      }
    }
  };

  return (
    <div className="glass-panel">
      <h1>Intelligent Assistant</h1>
      <p className="subtitle">Powered by Gemini AI</p>
      
      {errorMsg && <div className="error-toast">{errorMsg}</div>}
      
      <ConversationDisplay messages={messages} />
      
      <MicrophoneButton 
        status={status} 
        onToggleListening={toggleListening} 
      />
      
      <TextInputArea 
        onSendMessage={handleUserMessage} 
        disabled={status === 'processing' || status === 'listening'}
      />
    </div>
  );
};

export default VoiceAssistant;
