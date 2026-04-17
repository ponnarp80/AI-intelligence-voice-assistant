import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import MicrophoneButton from './MicrophoneButton';
import ConversationDisplay from './ConversationDisplay';
import TextInputArea from './TextInputArea';
import './VoiceAssistant.css';

// App URI Schemes for Windows Integration
const COMMAND_MAP = {
  'whatsapp': 'whatsapp://',
  'spotify': 'spotify://',
  'calculator': 'calculator:',
  'settings': 'ms-settings:',
  'camera': 'microsoft.windows.camera:',
  'photos': 'ms-photos:',
  'calendar': 'outlookcal:',
  'maps': 'bingmaps:',
  'store': 'ms-windows-store:',
  'youtube': 'https://youtube.com',
  'gmail': 'https://mail.google.com',
  'facebook': 'https://facebook.com',
  'twitter': 'https://twitter.com',
  'instagram': 'https://instagram.com'
};

// Resolve the AI name from the current voice gender
const getAssistantName = (gender) => (gender === 'female' ? 'FRIDAY' : 'JARVIS');

const VoiceAssistant = ({ onClearMessages, messages, setMessages, isMuted, voiceGender, currentUser }) => {
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isHandsFree, setIsHandsFree] = useState(() => {
    return localStorage.getItem('isHandsFree') === 'true';
  });
  const [activeContext, setActiveContext] = useState(''); // Stores selection or clipboard
  const [toastMsg, setToastMsg] = useState(''); // Feedback for global commands

  const recognitionRef     = useRef(null);
  const synthRef           = useRef(window.speechSynthesis);
  const abortControllerRef = useRef(null);
  const isMutedRef         = useRef(isMuted);
  const voiceGenderRef     = useRef(voiceGender);
  const isHandsFreeRef     = useRef(isHandsFree);
  const activeContextRef   = useRef('');

  // Monitoring local selection
  useEffect(() => {
    const handleMouseUp = (e) => {
      // Ignore if clicking on interactive elements or the mic container
      if (e.target.closest('button') || e.target.closest('.handsfree-control') || e.target.closest('.mic-container')) return;

      const selection = window.getSelection().toString().trim();
      if (selection && selection.length > 3) { // Ignore tiny or accidental selections
        setActiveContext(selection);
        activeContextRef.current = selection;
      }
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem('isHandsFree', isHandsFree);
    isHandsFreeRef.current = isHandsFree;
    
    // If we turned it ON, ensure recognition is running
    if (isHandsFree && status === 'idle') {
      startRecognition();
    } else if (!isHandsFree && status === 'listening') {
      recognitionRef.current?.stop();
    }
  }, [isHandsFree]);

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

  const playActivationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const context = new AudioCtx();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, context.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.05, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.15);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start();
      oscillator.stop(context.currentTime + 0.15);
    } catch (e) {
      console.warn("Sound blocked by browser policy until interaction", e);
    }
  };

  // Setup Speech Recognition once
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      recognitionRef.current = new SR();
      recognitionRef.current.continuous     = true; // Always continuous for wake-word support
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang           = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptSnippet = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptSnippet;
          } else {
            interimTranscript += transcriptSnippet;
          }
        }

        const fullTranscript = (finalTranscript || interimTranscript).toLowerCase();
        
        // If "idle" or "listening" and we hear the wake word
        if (isHandsFreeRef.current && (status === 'idle' || status === 'listening')) {
          if (fullTranscript.includes('jarvis') || fullTranscript.includes('friday')) {
            // Found wake word! 
            // 1. Play sound
            playActivationSound();
            
            // 2. Extract the command part (everything after the wake word)
            let command = '';
            const words = fullTranscript.split(/\s+/);
            const indexJ = words.indexOf('jarvis');
            const indexF = words.indexOf('friday');
            const triggerIdx = indexJ !== -1 ? indexJ : indexF;
            
            command = words.slice(triggerIdx + 1).join(' ');
            
            if (command.trim().length > 2) {
              // We have a command! Stop recognition temporarily to process
              recognitionRef.current?.stop(); 
              handleUserMessage(command);
            }
          }
        } else if (!isHandsFreeRef.current && event.results[event.results.length - 1].isFinal) {
          // Normal manual mode
          handleUserMessage(event.results[0][0].transcript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone access denied.');
          setIsHandsFree(false);
        }
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setStatus('error');
          setTimeout(() => setStatus('idle'), 3000);
        } else {
          setStatus('idle');
        }
      };

      recognitionRef.current.onend = () => {
        // If HandsFree is ON, we must keep listening even if it stops
        if (isHandsFreeRef.current) {
          try {
            recognitionRef.current.start();
            setStatus('listening');
          } catch (e) {
            // Might already be started
          }
        } else {
          setStatus((prev) => (prev === 'listening' ? 'idle' : prev));
        }
      };

      // Auto-start if hands-free is enabled on mount
      if (isHandsFree) {
        startRecognition();
      }
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

      const wantsMore = /more|detail|explain|elaborate|expand|in depth|full|complete|longer|everything/i.test(text);
      const isContextRef = /this|selection|selected|that code|that line|copied|it/i.test(text);

      let contextToUse = activeContextRef.current;

      // If text mentions "copied" or if no selection found, try reading clipboard (requires focus)
      if (isContextRef) {
        try {
          // navigator.clipboard.readText() might fail if tab is background or not focused
          const clipboardText = await navigator.clipboard.readText();
          if (clipboardText && clipboardText.trim()) {
            contextToUse = clipboardText.trim();
          }
        } catch (err) {
          console.warn("Clipboard access denied or unavailable:", err);
        }
      }

      let toneInstruction = "a smart and friendly assistant";
      if (currentUser?.aiTone) {
        switch (currentUser.aiTone) {
          case 'professional': toneInstruction = "a highly professional, formal, and strictly efficient assistant"; break;
          case 'sarcastic': toneInstruction = "a witty, slightly sarcastic, and humorous assistant that gives cheeky but correct answers"; break;
          case 'creative': toneInstruction = "a wildly creative and dramatic storytelling assistant that uses vivid analogies"; break;
          default: toneInstruction = "a smart and friendly assistant";
        }
      }

      let verbosityInstruction = "Answer the following question in 3 to 5 lines maximum. Be clear, direct, and conversational. Do not list bullet points unless asked.";
      if (wantsMore || currentUser?.aiVerbosity === 'comprehensive') {
        verbosityInstruction = "The user wants a highly detailed, comprehensive answer. Respond thoroughly, clearly, and expand upon concepts gracefully.";
      }

      let prompt = `You are ${name}, ${toneInstruction}. ${verbosityInstruction}\n\n`;

      prompt += `CRITICAL: You have the ability to open applications. If the user asks to open an app, you MUST exactly append the following tag to your response: [COMMAND:OPEN, TARGET:appname].
Supported app names: ${Object.keys(COMMAND_MAP).join(', ')}.
KEEP YOUR RESPONSE SHORT (1-2 sentences) when opening an app.
Example: "Opening WhatsApp for you. [COMMAND:OPEN, TARGET:whatsapp]"\n\n`;
      
      if (isContextRef && contextToUse) {
        prompt += `BACKGROUND CONTEXT (from user's selection/clipboard):\n"""\n${contextToUse}\n"""\n\n`;
      }

      prompt += `User: ${text}`;

      const result = await model.generateContent(prompt, {
        signal: abortControllerRef.current.signal,
      });
      const outputText = result.response.text();

      if (abortControllerRef.current.signal.aborted) return;

      // Extract and execute commands if present
      let cleanOutput = outputText;
      const commandRegex = /\[COMMAND:(\w+),\s*TARGET:([\w.-]+)\]/i;
      const match = outputText.match(commandRegex);

      if (match) {
        const action = match[1].toUpperCase();
        const target = match[2].toLowerCase();
        
        if (action === 'OPEN') {
          executeCommand(target);
          cleanOutput = outputText.replace(commandRegex, '').trim();
        }
      } else {
        // HEURISTIC FALLBACK: If label is missing but text mentions "opening X"
        const lowerText = outputText.toLowerCase();
        for (const appName of Object.keys(COMMAND_MAP)) {
          if (lowerText.includes(`opening ${appName}`) || lowerText.includes(`launching ${appName}`)) {
            console.log(`Fallback detected: Opening ${appName}`);
            executeCommand(appName);
            break;
          }
        }
      }

      setMessages((prev) => [...prev, { role: 'ai', text: cleanOutput }]);
      
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

  const executeCommand = (target) => {
    const uri = COMMAND_MAP[target];
    if (uri) {
      setToastMsg(`Opening ${target.charAt(0).toUpperCase() + target.slice(1)}...`);
      
      // Use location.assign for URI schemes to bypass popup blockers
      // For web URLs (https), we still use window.open
      if (uri.startsWith('http')) {
        window.open(uri, '_blank');
      } else {
        window.location.assign(uri);
      }
      
      setTimeout(() => setToastMsg(''), 4000);
    } else {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(target)}`;
      setToastMsg(`Searching for ${target}...`);
      window.open(searchUrl, '_blank');
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  // ── Mic toggle / terminate ───────────────────────────────────────────────────
  const startRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setStatus('listening');
        setErrorMsg('');
      } catch (e) {
        // Already started
      }
    }
  };

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
    
    if (isHandsFree) {
        // In hands-free mode, the mic is always "on", but we can force a stop/start
        if (status === 'listening') {
            recognitionRef.current?.stop();
            setStatus('idle');
        } else {
            startRecognition();
        }
        return;
    }

    if (status === 'listening') {
      recognitionRef.current?.stop();
      setStatus('idle');
    } else {
      startRecognition();
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

          <div className="status-area">
            {errorMsg && <div className="error-toast">{errorMsg}</div>}
            {toastMsg && <div className="system-toast animate-pulse">{toastMsg}</div>}

            {activeContext && (
              <div className="context-indicator animate-slide-in">
                <span className="context-label">Context Active:</span>
                <span className="context-snippet">{activeContext.substring(0, 40)}{activeContext.length > 40 ? '...' : ''}</span>
                <button className="clear-context" onClick={() => { setActiveContext(''); activeContextRef.current = ''; }}>×</button>
              </div>
            )}
          </div>

          <div className="handsfree-control">
            <div className="hf-info">
              <span className="hf-label">Hands-Free Activation</span>
              <span className="hf-status">{isHandsFree ? 'System Listening' : 'Manual Trigger'}</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={isHandsFree} 
                onChange={(e) => setIsHandsFree(e.target.checked)} 
              />
              <span className="slider"></span>
            </label>
          </div>

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
