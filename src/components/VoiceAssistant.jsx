import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import MicrophoneButton from './MicrophoneButton';
import ConversationDisplay from './ConversationDisplay';
import TextInputArea from './TextInputArea';
import './VoiceAssistant.css';

// Resolve the AI name from the current voice gender
const getAssistantName = (gender) => (gender === 'female' ? 'FRIDAY' : 'JARVIS');

const VoiceAssistant = ({ onClearMessages, messages, setMessages, isMuted, voiceGender, currentUser }) => {
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const recognitionRef     = useRef(null);
  const synthRef           = useRef(window.speechSynthesis);
  const abortControllerRef = useRef(null);
  const isMutedRef         = useRef(isMuted);
  const voiceGenderRef     = useRef(voiceGender);

  // Keep refs in sync with latest props so async callbacks see the freshest values
  useEffect(() => {
    isMutedRef.current = isMuted;
    if (isMuted) {
      // Pause instead of cancel so we can resume later
      if (synthRef.current.speaking) {
        synthRef.current.pause();
        // Keep status as 'speaking' so user knows it's paused
      }
    } else {
      // Unmute: resume if paused
      if (synthRef.current.paused) {
        synthRef.current.resume();
      }
    }
  }, [isMuted]);

  useEffect(() => {
    voiceGenderRef.current = voiceGender;
  }, [voiceGender]);

  // Initialize Gemini
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const genAI  = new GoogleGenerativeAI(apiKey);

  // Setup Speech Recognition once
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      recognitionRef.current = new SR();
      recognitionRef.current.continuous     = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang           = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleUserMessage(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'no-speech') {
          setStatus('error');
          setTimeout(() => setStatus('idle'), 3000);
        } else {
          setStatus('idle');
        }
      };

      recognitionRef.current.onend = () => {
        setStatus((prev) => (prev === 'listening' ? 'idle' : prev));
      };
    } else {
      console.warn('Speech Recognition not supported in this browser.');
    }

    return () => {
      recognitionRef.current?.abort();
      synthRef.current?.cancel();
    };
  }, []);

  // ── Core: send message to Gemini ────────────────────────────────────────────
  const handleUserMessage = async (text) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setStatus('processing');

    try {
      abortControllerRef.current = new AbortController();

      // Retrieve configuration (BYOK or fallback)
      let customApi, customModel;
      if (currentUser?.email) {
        const usersDB = JSON.parse(localStorage.getItem('mockUsersDB') || '{}');
        const dbUser = usersDB[currentUser.email];
        customApi = dbUser?.customApiKey || null;
        customModel = dbUser?.customModel || null;
      }

      // Initialize generative AI with overriding keys
      const activeKey = customApi || import.meta.env.VITE_GEMINI_API_KEY;
      const activeModel = customModel || 'gemini-2.5-flash';
      
      const genAIClient = new GoogleGenerativeAI(activeKey);
      const model = genAIClient.getGenerativeModel({ model: activeModel });
      const name = getAssistantName(voiceGenderRef.current);

      // Detect if user explicitly asked for more detail
      const wantsMore = /more|detail|explain|elaborate|expand|in depth|full|complete|longer|everything/i.test(text);

      const prompt = wantsMore
        ? `You are ${name}, a smart and friendly AI assistant. The user wants a detailed answer. Respond clearly and thoroughly.

User: ${text}`
        : `You are ${name}, a smart and friendly AI assistant. Answer the following question in 3 to 5 lines maximum. Be clear, direct, and conversational. Do not list bullet points unless asked.

User: ${text}`;

      const result     = await model.generateContent(prompt, {
        signal: abortControllerRef.current.signal,
      });
      const outputText = result.response.text();

      if (abortControllerRef.current.signal.aborted) return;

      setMessages((prev) => [...prev, { role: 'ai', text: outputText }]);
      
      // Save interaction to History
      if (currentUser?.email) {
        try {
          const key = `chatHistory_${currentUser.email}`;
          const currentLog = JSON.parse(localStorage.getItem(key) || '[]');
          currentLog.push({
            timestamp: new Date().toISOString(),
            prompt: text,
            response: outputText
          });
          localStorage.setItem(key, JSON.stringify(currentLog));
        } catch (e) {
          console.error("Failed to save history", e);
        }
      }

      speakText(outputText);
    } catch (error) {
      console.error('Gemini API Error:', error);
      if (error.name === 'AbortError' || error.message?.includes('abort')) {
        setStatus('idle');
      } else {
        setStatus('error');
        setErrorMsg(`API Error: ${error.message || 'Check your network connection.'}`);
        setTimeout(() => setStatus('idle'), 6000); // give them more time to read it
      }
    }
  };

  // ── TTS: pick best available voice by gender ────────────────────────────────
  const getVoiceByGender = (gender) => {
    // Wait until voices are loaded
    const voices = synthRef.current.getVoices();
    if (!voices.length) return null;

    const enVoices = voices.filter((v) => v.lang.startsWith('en'));

    if (gender === 'female') {
      return (
        // Chrome/Edge natural female voices (ordered by quality)
        enVoices.find((v) => /google us english/i.test(v.name)) ||
        enVoices.find((v) => /samantha|karen|victoria|moira|fiona|zira|aria|jenny|sonia|susan/i.test(v.name)) ||
        enVoices.find((v) => /female/i.test(v.name)) ||
        enVoices.find((v) => v.lang === 'en-US') ||
        enVoices[0]
      );
    } else {
      return (
        // Chrome/Edge natural male voices
        enVoices.find((v) => /ryan|guy|christopher|george|william|thomas|mark|david|james/i.test(v.name)) ||
        enVoices.find((v) => /male/i.test(v.name)) ||
        enVoices.find((v) => v.lang === 'en-GB') ||
        enVoices.find((v) => v.lang === 'en-US') ||
        enVoices[0]
      );
    }
  };

  const speakText = (text) => {
    if (isMutedRef.current) { setStatus('idle'); return; }
    if (!('speechSynthesis' in window)) { setStatus('idle'); return; }

    // Chrome bug: cancel() then immediate speak() silently fails.
    // Fix: cancel, wait a tick, then speak.
    synthRef.current.cancel();

    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Pick voice
      const voices = synthRef.current.getVoices();
      if (voices.length > 0) {
        const enVoices = voices.filter((v) => v.lang.startsWith('en'));
        let voice = null;

        if (voiceGenderRef.current === 'female') {
          voice =
            enVoices.find((v) => /zira|samantha|karen|victoria|aria|jenny|sonia|susan/i.test(v.name)) ||
            enVoices.find((v) => /google us english/i.test(v.name)) ||
            enVoices.find((v) => /female/i.test(v.name)) ||
            enVoices[0];
        } else {
          voice =
            enVoices.find((v) => /david|mark|james|ryan|george|christopher|william|thomas|guy/i.test(v.name)) ||
            enVoices.find((v) => /male/i.test(v.name)) ||
            enVoices[0];
        }
        if (voice) utterance.voice = voice;
      }

      utterance.pitch  = 1.0;
      utterance.rate   = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => setStatus('speaking');
      utterance.onend   = () => setStatus('idle');
      utterance.onerror = (e) => {
        console.error('TTS Error:', e);
        setStatus('idle');
      };

      synthRef.current.speak(utterance);

      // Chrome bug: long text causes speech to stop after ~15 seconds.
      // Workaround: keep-alive timer using pause/resume.
      const keepAlive = setInterval(() => {
        if (!synthRef.current.speaking) {
          clearInterval(keepAlive);
        } else {
          synthRef.current.pause();
          synthRef.current.resume();
        }
      }, 10000);

      utterance.onend = () => {
        clearInterval(keepAlive);
        setStatus('idle');
      };
      utterance.onerror = (e) => {
        clearInterval(keepAlive);
        console.error('TTS Error:', e);
        setStatus('idle');
      };
    }, 150); // 150ms delay to let cancel() fully complete
  };

  // ── Mic toggle / terminate ───────────────────────────────────────────────────
  const toggleListening = () => {
    if (status === 'speaking') {
      synthRef.current.cancel();
      setStatus('idle');
      return;
    }
    if (status === 'processing') {
      abortControllerRef.current?.abort();
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
          console.error('Microphone start error:', e);
        }
      } else {
        setErrorMsg('Voice recognition unavailable. Use the text input below.');
      }
    }
  };

  const assistantName = getAssistantName(voiceGender);
  const isFemale      = voiceGender === 'female';

  return (
    <div className="workspace">
      {/* ── LEFT – Control Panel ── */}
      <div className="left-panel glass-panel">
        <div className="left-panel-inner">
          <div className="brand-header">
            <div className={`ai-avatar ${isFemale ? 'female' : 'male'}`} />
            <h1 className={isFemale ? 'name-female' : 'name-male'}>{assistantName}</h1>
          </div>

          {errorMsg && <div className="error-toast">{errorMsg}</div>}

          <MicrophoneButton status={status} onToggleListening={toggleListening} />

          <div className="divider"><span>or type below</span></div>

          <TextInputArea
            onSendMessage={handleUserMessage}
            disabled={status === 'processing' || status === 'listening'}
          />
        </div>
      </div>

      {/* ── RIGHT – Conversation ── */}
      <div className="right-panel glass-panel">
        <div className="chat-header">
          <span className="chat-title">Conversation with {assistantName}</span>
          <span className={`status-pill ${status}`}>{status}</span>
        </div>
        <ConversationDisplay messages={messages} assistantName={assistantName} />
      </div>
    </div>
  );
};

export default VoiceAssistant;
