import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParticleBackground } from '../components/ParticleBackground';
import { api } from '../utils/api';
import type { Question } from '../utils/api';
import { useTheme } from '../context/ThemeContext';

interface ChatMessage {
  sender: 'ai' | 'candidate' | 'acknowledgment';
  text: string;
  scores?: any;
  domain?: string;
}

// Domain config per role
const ROLE_DOMAINS: Record<string, string[]> = {
  'Senior Frontend Engineer': ['React & Component Architecture', 'State Management', 'Browser Rendering & Performance', 'CSS & Animations', 'Testing & Tooling'],
  'Backend SDE': ['System Design & Scalability', 'Database Design', 'API Design', 'Caching Strategies', 'Concurrency & Microservices'],
  'Full Stack SDE': ['End-to-End Architecture', 'REST API Design', 'Database Selection', 'Authentication Flows', 'Deployment & DevOps'],
  'ML Engineer': ['Model Selection & Evaluation', 'Feature Engineering', 'Training Pipeline Design', 'MLOps & Deployment', 'NLP & Deep Learning'],
  'Data Scientist': ['Statistical Foundations', 'Exploratory Data Analysis', 'A/B Testing', 'Python Data Stack', 'Business Communication'],
  'Java Developer': ['JVM Internals & GC', 'Spring Boot & Security', 'Concurrency', 'Design Patterns', 'JPA & Hibernate'],
  'Mobile Engineer': ['React Native / Flutter', 'App Performance', 'State Management Mobile', 'App Store Deployment', 'Offline-first Patterns'],
  'Product Manager': ['Product Strategy', 'User Research', 'Metrics & OKRs', 'Stakeholder Management', 'A/B Testing & Data'],
};

// Defaults — user can change max warnings in setup
const DEFAULT_MAX_WARNINGS = 5;
// Per-pixel colour-channel change that counts as "different"
const MOTION_THRESHOLD = 45; // raised from 25 → much less sensitive to lighting flicker

export const SessionPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // ── Session Setup ─────────────────────────────────────────────────────────
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [role, setRole] = useState('Senior Frontend Engineer');
  const [interviewType, setInterviewType] = useState<'behavioural' | 'technical' | 'resume_based'>('technical');
  const [durationMins, setDurationMins] = useState(30);
  const [selectedDomain, setSelectedDomain] = useState<string>('All Domains');

  // Reset selectedDomain to "All Domains" when role changes
  useEffect(() => {
    setSelectedDomain('All Domains');
  }, [role]);

  // ── Proctoring ────────────────────────────────────────────────────────────
  const [isProctoringEnabled, setIsProctoringEnabled] = useState(true);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [proctoringLogs, setProctoringLogs] = useState<{ timestamp: string; event: string }[]>([]);
  const [proctoringWarnings, setProctoringWarnings] = useState<string[]>([]);
  const [faceDetectionStatus, setFaceDetectionStatus] = useState<'initializing' | 'ok' | 'no_face' | 'multiple_faces' | 'looking_away' | 'movement' | 'disabled'>('disabled');
  const [maxMovementWarnings, setMaxMovementWarnings] = useState(DEFAULT_MAX_WARNINGS);
  const [warningCount, setWarningCount] = useState(0);
  const [movementWarnings, setMovementWarnings] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [showProctoringPanel, setShowProctoringPanel] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const motionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<any>(null);
  const detectionIntervalRef = useRef<any>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const movementWarningsRef = useRef(0);
  // Debounce: require N consecutive motion frames before flagging
  const consecutiveMotionRef = useRef(0);
  // Cooldown: minimum ms between two movement-warning events
  const lastWarningTimeRef = useRef(0);
  const maxMovementWarningsRef = useRef(DEFAULT_MAX_WARNINGS);
  const webcamStreamRef = useRef<MediaStream | null>(null);

  // ── Interview State ───────────────────────────────────────────────────────
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [responseText, setResponseText] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(1800);
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeScore, setActiveScore] = useState<any>(null);
  const [nextQuestionRef, setNextQuestionRef] = useState<Question | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentAcknowledgment, setCurrentAcknowledgment] = useState<string>('');
  const [weakDomains, setWeakDomains] = useState<string[]>([]);

  // ── Voice ─────────────────────────────────────────────────────────────────
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiState, setAiState] = useState<'idle' | 'speaking' | 'listening' | 'evaluating'>('idle');

  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const isListeningRef = useRef(false);
  const isVoiceActiveRef = useRef(isVoiceMode);
  const isMutedRef = useRef(isMuted);
  const currentQuestionRef = useRef(currentQuestion);
  const aiStateRef = useRef(aiState);
  const stableTextRef = useRef('');
  const responseTextRef = useRef(responseText);

  useEffect(() => {
    responseTextRef.current = responseText;
  }, [responseText]);

  useEffect(() => { isVoiceActiveRef.current = isVoiceMode; }, [isVoiceMode]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);
  useEffect(() => { aiStateRef.current = aiState; }, [aiState]);
  useEffect(() => { movementWarningsRef.current = movementWarnings; }, [movementWarnings]);
  useEffect(() => { maxMovementWarningsRef.current = maxMovementWarnings; }, [maxMovementWarnings]);

  // ── Save Proctoring Data ───────────────────────────────────────────────────
  const saveProctoringData = (sid: string) => {
    if (isProctoringEnabled) {
      localStorage.setItem(`proctoring_session_${sid}`, JSON.stringify({
        enabled: true,
        warnings: proctoringWarnings,
        warningCount: warningCount,
        movementWarnings: movementWarnings,
        logs: proctoringLogs,
      }));
    }
  };

  // ── Tab Switch Detection ───────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionStarted || !isProctoringEnabled) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const timestamp = new Date().toLocaleTimeString();
        const logMsg = 'Tab switched / window lost focus';
        setProctoringLogs(prev => [...prev, { timestamp, event: logMsg }]);
        setWarningCount(c => c + 1);
        setProctoringWarnings(prev => [...prev, `[${timestamp}] Warning: Tab switched or browser minimized.`]);
        alert('⚠️ Proctoring Warning: Tab switching is prohibited during the interview!');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sessionStarted, isProctoringEnabled]);

  // ── Load BlazeFace Model ───────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionStarted || !isProctoringEnabled) return;
    let isMounted = true;
    const loadScriptsAndModel = async () => {
      try {
        setFaceDetectionStatus('initializing');
        if (!(window as any).tf) {
          const tfScript = document.createElement('script');
          tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.18.0/dist/tf.min.js';
          tfScript.async = true;
          document.head.appendChild(tfScript);
          await new Promise(resolve => { tfScript.onload = resolve; });
        }
        if (!(window as any).blazeface) {
          const bfScript = document.createElement('script');
          bfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.0.7/dist/blazeface.min.js';
          bfScript.async = true;
          document.head.appendChild(bfScript);
          await new Promise(resolve => { bfScript.onload = resolve; });
        }
        if (!isMounted) return;
        const loadedModel = await (window as any).blazeface.load();
        modelRef.current = loadedModel;
        setModelLoaded(true);
        setFaceDetectionStatus('ok');
      } catch (err) {
        console.error('Failed to load proctoring model:', err);
        setFaceDetectionStatus('disabled');
      }
    };
    loadScriptsAndModel();
    return () => { isMounted = false; };
  }, [sessionStarted, isProctoringEnabled]);

  // ── Webcam Stream ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionStarted || !isProctoringEnabled) {
      webcamStreamRef.current?.getTracks().forEach(t => t.stop());
      webcamStreamRef.current = null;
      setWebcamStream(null);
      return;
    }
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: { max: 15 } },
          audio: false,
        });
        webcamStreamRef.current = stream;
        setWebcamStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error('Camera access failed:', err);
        alert('⚠️ Camera access is required for proctored mode. Anti-cheat has been disabled.');
        setIsProctoringEnabled(false);
      }
    };
    startWebcam();
    return () => {
      webcamStreamRef.current?.getTracks().forEach(t => t.stop());
      webcamStreamRef.current = null;
    };
  }, [sessionStarted, isProctoringEnabled]);

  // ── Motion + Face Detection Loop ──────────────────────────────────────────
  useEffect(() => {
    if (!sessionStarted || !isProctoringEnabled || !modelLoaded || !webcamStream) return;

    const detectFacesAndMotion = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const motionCanvas = motionCanvasRef.current;
      const model = modelRef.current;
      if (!video || !canvas || !model) return;
      if (video.readyState !== 4) return;

      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw current frame for motion analysis
      if (motionCanvas) {
        motionCanvas.width = video.videoWidth;
        motionCanvas.height = video.videoHeight;
        const mctx = motionCanvas.getContext('2d');
        if (mctx) {
          mctx.drawImage(video, 0, 0);
          const currentFrame = mctx.getImageData(0, 0, motionCanvas.width, motionCanvas.height);

          // ── Motion detection via pixel diff (debounced + cooldown) ────────
          if (prevFrameRef.current && prevFrameRef.current.data.length === currentFrame.data.length) {
            let diffCount = 0;
            const step = 4 * 12; // sample every 12th pixel (was 8) → less sensitive
            const totalSamples = currentFrame.data.length / step;
            for (let i = 0; i < currentFrame.data.length; i += step) {
              const dr = Math.abs(currentFrame.data[i]     - prevFrameRef.current.data[i]);
              const dg = Math.abs(currentFrame.data[i + 1] - prevFrameRef.current.data[i + 1]);
              const db = Math.abs(currentFrame.data[i + 2] - prevFrameRef.current.data[i + 2]);
              if (dr + dg + db > MOTION_THRESHOLD * 3) diffCount++;
            }

            const motionRatio = diffCount / totalSamples;

            // Must exceed 18 % of pixels changing (was 8 %) to count as "movement"
            if (motionRatio > 0.18) {
              consecutiveMotionRef.current += 1;
            } else {
              consecutiveMotionRef.current = 0; // reset streak on calm frame
            }

            // Only raise a warning after 4 consecutive motion frames AND cooldown elapsed
            const COOLDOWN_MS = 20_000; // 20 s between warnings
            const REQUIRED_CONSECUTIVE = 4;
            const now = Date.now();
            if (
              consecutiveMotionRef.current >= REQUIRED_CONSECUTIVE &&
              now - lastWarningTimeRef.current > COOLDOWN_MS
            ) {
              consecutiveMotionRef.current = 0;
              lastWarningTimeRef.current = now;
              const timestamp = new Date().toLocaleTimeString();
              setFaceDetectionStatus('movement');
              setMovementWarnings(c => {
                const next = c + 1;
                movementWarningsRef.current = next;
                setProctoringLogs(prev => [...prev, { timestamp, event: `Excessive movement detected (ratio: ${(motionRatio * 100).toFixed(1)}%)` }]);
                setProctoringWarnings(prev => [...prev, `[${timestamp}] Warning: Excessive body movement.`]);
                setWarningCount(w => w + 1);
                if (next >= maxMovementWarningsRef.current) {
                  setTimeout(() => {
                    alert(`🚫 Interview Terminated: ${maxMovementWarningsRef.current} excessive movement warnings reached. Your session has been flagged and ended.`);
                    handleForceEndSession();
                  }, 500);
                }
                return next;
              });
            }
          }
          prevFrameRef.current = currentFrame;
        }
      }

      // Face detection
      try {
        const predictions = await model.estimateFaces(video, false);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const timestamp = new Date().toLocaleTimeString();

        if (predictions.length === 0) {
          setFaceDetectionStatus('no_face');
          setWarningCount(c => {
            if (c % 10 === 0) {
              setProctoringLogs(prev => [...prev, { timestamp, event: 'No face detected in camera view' }]);
              setProctoringWarnings(prev => [...prev, `[${timestamp}] Warning: No face detected.`]);
            }
            return c + 1;
          });
        } else if (predictions.length > 1) {
          setFaceDetectionStatus('multiple_faces');
          setWarningCount(c => {
            if (c % 10 === 0) {
              setProctoringLogs(prev => [...prev, { timestamp, event: 'Multiple faces detected in frame' }]);
              setProctoringWarnings(prev => [...prev, `[${timestamp}] Warning: Multiple faces detected.`]);
            }
            return c + 1;
          });
        } else {
          const face = predictions[0];
          const [sx, sy] = face.topLeft;
          const [ex, ey] = face.bottomRight;
          const w = ex - sx;
          const h = ey - sy;

          // Draw bounding box
          ctx.strokeStyle = faceDetectionStatus === 'movement' ? '#F59E0B' : '#10B981';
          ctx.lineWidth = 3;
          ctx.strokeRect(sx, sy, w, h);

          if (face.landmarks) {
            ctx.fillStyle = '#6366F1';
            for (const [lx, ly] of face.landmarks) {
              ctx.beginPath();
              ctx.arc(lx, ly, 3, 0, 2 * Math.PI);
              ctx.fill();
            }

            const rightEye = face.landmarks[0];
            const leftEye = face.landmarks[1];
            const nose = face.landmarks[2];
            if (rightEye && leftEye && nose) {
              const eyeDistance = leftEye[0] - rightEye[0];
              if (eyeDistance > 0) {
                const noseOffset = (nose[0] - rightEye[0]) / eyeDistance;
                // Loosened from 0.28–0.72 → 0.15–0.85
                // Brief sideways glances (reading notes nearby) no longer flagged
                if (noseOffset < 0.15 || noseOffset > 0.85) {
                  setFaceDetectionStatus('looking_away');
                  ctx.strokeStyle = '#EF4444';
                  ctx.strokeRect(sx, sy, w, h);
                  return;
                }
              }
            }
          }
          if (faceDetectionStatus !== 'movement') setFaceDetectionStatus('ok');
        }
      } catch (err) {
        console.error('Face detection error:', err);
      }
    };

    detectionIntervalRef.current = setInterval(detectFacesAndMotion, 300);
    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, [sessionStarted, isProctoringEnabled, modelLoaded, webcamStream, faceDetectionStatus]);

  // ── Speech Helpers ────────────────────────────────────────────────────────
  const getBestVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const english = voices.filter(v => v.lang.startsWith('en'));
    const filtered = english.filter(v => {
      const n = v.name.toLowerCase();
      return !n.includes('male') && !n.includes('david') && !n.includes('george') && !n.includes('mark');
    });
    const pool = filtered.length > 0 ? filtered : english.length > 0 ? english : voices;
    return (
      pool.find(v => v.name.includes('Google UK English Female')) ||
      pool.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
      pool.find(v => v.name.includes('Samantha')) ||
      pool[0]
    );
  };

  const speakUtterance = (text: string, rate = 1.0, onEnd?: () => void) => {
    if (!('speechSynthesis' in window) || !text.trim()) { onEnd?.(); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getBestVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  };

  const startListeningAfterSpeech = () => {
    setAiState('listening');
    setIsListening(true);
    isListeningRef.current = true;
    if (isVoiceActiveRef.current && !isMutedRef.current && recognitionRef.current) {
      try {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        recognitionRef.current.start();
      } catch (e) {
        console.error('Error starting recognition:', e);
      }
    }
  };

  const speakResponse = (questionText: string, acknowledgment?: string) => {
    if (!('speechSynthesis' in window)) { startListeningAfterSpeech(); return; }
    window.speechSynthesis.cancel();
    setAiState('speaking');
    const speakQuestion = () => {
      speakUtterance(questionText, 1.0, () => {
        startListeningAfterSpeech();
      });
    };
    if (acknowledgment?.trim()) {
      speakUtterance(acknowledgment, 1.05, () => setTimeout(speakQuestion, 300));
    } else {
      speakQuestion();
    }
  };

  const toggleDictation = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported or enabled in this browser. Please use Google Chrome for voice features.');
      return;
    }
    if (isListening) {
      isListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
      setAiState('idle');
    } else {
      setAiState('listening');
      setIsListening(true);
      isListeningRef.current = true;
      stableTextRef.current = responseText;
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
      }
    }
  };

  // ── Speech Recognition ────────────────────────────────────────────────────
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || 'en-US';

    rec.onstart = () => {
      setAiState('listening');
      isListeningRef.current = true;
      setIsListening(true);
      stableTextRef.current = responseTextRef.current;
    };
    rec.onresult = (event: any) => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      const currentSessionText = finalTranscript + interimTranscript;
      setResponseText(stableTextRef.current + (stableTextRef.current.trim() ? ' ' : '') + currentSessionText);
    };
    rec.onerror = (err: any) => console.error('Speech error:', err);
    rec.onend = () => {
      if (!isMutedRef.current && isListeningRef.current) {
        try { rec.start(); } catch {}
      } else {
        setAiState(curr => curr === 'listening' ? 'idle' : curr);
        setIsListening(false);
      }
    };
    recognitionRef.current = rec;
    return () => { isListeningRef.current = false; rec.stop(); };
  }, [isVoiceMode, isMuted]);

  // ── Auto-speak on question ────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStarted && currentQuestion && isVoiceMode) {
      speakResponse(currentQuestion.questionText, (currentQuestion as any).briefAcknowledgment);
    }
    return () => window.speechSynthesis.cancel();
  }, [currentQuestion?.id, sessionStarted, isVoiceMode]);

  useEffect(() => {
    if (sessionStarted && currentQuestion && isVoiceMode) {
      speakResponse(currentQuestion.questionText, (currentQuestion as any).briefAcknowledgment);
    } else if (!isVoiceMode) {
      isListeningRef.current = false;
      recognitionRef.current?.stop();
      window.speechSynthesis.cancel();
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      setAiState('idle');
      setIsListening(false);
    }
  }, [isVoiceMode]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionStarted) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStarted]);

  // ── Auto scroll chat ──────────────────────────────────────────────────────
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const getWordCount = (text: string) => {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  };

  const domains = ROLE_DOMAINS[role] || ['General Knowledge', 'Problem Solving', 'Communication'];

  const handleStartSession = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.startSession(role, interviewType, durationMins, selectedDomain);
      setSessionId(res.sessionId);
      setCurrentQuestion(res.firstQuestion);
      setTimerSeconds(durationMins * 60);
      setSessionStarted(true);
      setQuestionNumber(1);
      const firstAck = (res.firstQuestion as any)?.briefAcknowledgment || '';
      const chatItems: ChatMessage[] = [];
      if (firstAck) { chatItems.push({ sender: 'acknowledgment', text: firstAck }); setCurrentAcknowledgment(firstAck); }
      chatItems.push({ sender: 'ai', text: res.firstQuestion?.questionText || '' });
      setChatHistory(chatItems);
    } catch (err) {
      console.error('Failed to start session', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Submit Answer ─────────────────────────────────────────────────────────
  const submitAnswer = async (text: string) => {
    if (!text.trim() || !currentQuestionRef.current || isSubmitting) return;
    setIsSubmitting(true);
    isListeningRef.current = false;
    recognitionRef.current?.stop();
    window.speechSynthesis.cancel();
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    setAiState('evaluating');

    try {
      const res = await api.submitAnswer(sessionId, currentQuestionRef.current.id, text);
      setActiveScore(res.scores);
      setNextQuestionRef(res.nextQuestion);
      setShowFeedbackPanel(true);

      // Track weak domains from score
      if (res.scores?.overallScore < 60) {
        const qText = currentQuestionRef.current.questionText.toLowerCase();
        const matchedDomain = domains.find(d => qText.includes(d.split(' ')[0].toLowerCase()));
        if (matchedDomain && !weakDomains.includes(matchedDomain)) {
          setWeakDomains(prev => [...prev, matchedDomain]);
        }
      }

      setChatHistory(prev => [...prev, { sender: 'candidate', text, scores: res.scores }]);

      if (isVoiceActiveRef.current) {
        // Auto-progress in voice mode after 3s
        setTimeout(() => {
          if (res.nextQuestion) {
            moveToNextQuestion(res.nextQuestion);
          } else {
            saveProctoringData(sessionId);
            handleForceEndSession();
          }
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to submit answer', err);
      setAiState('listening');
    } finally {
      setIsSubmitting(false);
    }
  };

  const moveToNextQuestion = (next: Question) => {
    setCurrentQuestion(next);
    setNextQuestionRef(null);
    setResponseText('');
    setActiveScore(null);
    setShowFeedbackPanel(false);
    setQuestionNumber(prev => prev + 1);
    const ack = (next as any).briefAcknowledgment || '';
    const chatItems: ChatMessage[] = [];
    if (ack) { chatItems.push({ sender: 'acknowledgment', text: ack }); setCurrentAcknowledgment(ack); }
    else setCurrentAcknowledgment('');
    chatItems.push({ sender: 'ai', text: next.questionText });
    setChatHistory(prev => [...prev, ...chatItems]);
    setAiState('idle');
  };

  const handleNextOrFinish = async () => {
    if (nextQuestionRef) {
      moveToNextQuestion(nextQuestionRef);
    } else {
      setIsSubmitting(true);
      try {
        isListeningRef.current = false;
        recognitionRef.current?.stop();
        window.speechSynthesis.cancel();
        saveProctoringData(sessionId);
        // Save weak domains to localStorage for SummaryPage
        localStorage.setItem(`weak_domains_${sessionId}`, JSON.stringify({ role, domains: weakDomains }));
        await api.endSession(sessionId);
        navigate(`/summary?sessionId=${sessionId}`);
      } catch {
        navigate('/summary');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleForceEndSession = async () => {
    isListeningRef.current = false;
    recognitionRef.current?.stop();
    window.speechSynthesis.cancel();
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    setIsSubmitting(true);
    try {
      if (sessionId) {
        saveProctoringData(sessionId);
        localStorage.setItem(`weak_domains_${sessionId}`, JSON.stringify({ role, domains: weakDomains }));
        await api.endSession(sessionId);
      }
      navigate(`/summary${sessionId ? `?sessionId=${sessionId}` : ''}`);
    } catch {
      navigate('/summary');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDoneSpeaking = () => {
    if (responseText.trim().length < 5 || isSubmitting) return;
    isListeningRef.current = false;
    recognitionRef.current?.stop();
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    submitAnswer(responseText);
  };


  const proctoringStatusColor = {
    ok: 'text-emerald-400',
    no_face: 'text-red-400',
    multiple_faces: 'text-red-500',
    looking_away: 'text-amber-400',
    movement: 'text-amber-500',
    initializing: 'text-blue-400',
    disabled: 'text-gray-400',
  }[faceDetectionStatus] || 'text-gray-400';

  const proctoringStatusText = {
    ok: '✅ Verified',
    no_face: '❌ No Face',
    multiple_faces: '🚨 Multiple Faces',
    looking_away: '⚠️ Looking Away',
    movement: '🟡 Movement Detected',
    initializing: '⏳ Loading AI...',
    disabled: '🔇 Inactive',
  }[faceDetectionStatus] || 'Inactive';

  return (
    <div className={`${isDark ? 'theme-joy-dark bg-background text-on-surface' : 'theme-joy bg-background text-on-surface'} min-h-screen transition-colors duration-300 relative overflow-x-hidden font-body`}>
      <ParticleBackground theme="joy" />

      {/* TopAppBar */}
      <header className="bg-surface border-b border-outline-variant shadow-lg flex justify-between items-center px-6 py-4 w-full top-0 z-50 fixed">
        <div className="flex items-center gap-4">
          <span onClick={() => navigate(api.getCurrentUser() ? '/dashboard' : '/')} className="text-2xl font-black text-primary tracking-tighter cursor-pointer">
            TechPrep AI
          </span>
          <div className="hidden md:flex gap-6 ml-8 text-sm">
            <button onClick={() => navigate('/dashboard')} className="text-on-surface-variant font-medium hover:text-primary transition-colors">Dashboard</button>
            <button onClick={() => navigate('/session')} className="text-primary font-bold border-b-2 border-primary pb-1">Practice</button>
            <button onClick={() => navigate('/history')} className="text-on-surface-variant font-medium hover:text-primary transition-colors">History</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {sessionStarted && (
            <div className="flex items-center gap-3">
              <button
                className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${isVoiceMode ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
                onClick={() => setIsVoiceMode(!isVoiceMode)}
                title="Toggle Voice/Text Mode"
              >
                {isVoiceMode ? '🎙️ Voice Mode' : '⌨️ Text Mode'}
              </button>
              <div className="flex items-center gap-2 bg-surface-container px-4 py-2 rounded-full shadow-inner border border-outline-variant">
                <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                <span className={`font-bold text-sm tabular-nums ${timerSeconds < 300 ? 'text-error animate-pulse' : 'text-on-surface'}`}>
                  {formatTime(timerSeconds)}
                </span>
              </div>
            </div>
          )}
          <button className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant" onClick={toggleTheme}>
            <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>
      </header>

      {/* Setup Screen */}
      {!sessionStarted ? (
        <main className="pt-28 pb-12 px-4 max-w-xl mx-auto flex items-center justify-center min-h-[90vh]">
          <div className="w-full bg-surface p-8 rounded-2xl shadow-2xl border border-primary/10 flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-3xl font-black text-primary mb-2">Setup Interview</h2>
              <p className="text-on-surface-variant text-sm font-medium">Configure your AI-powered proctored interview session</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface ml-2">Target Job Role</label>
                <select className="w-full px-6 py-3 rounded-full border-2 border-outline-variant focus:border-primary bg-surface-container transition-all outline-none text-on-surface text-sm" value={role} onChange={e => setRole(e.target.value)}>
                  {Object.keys(ROLE_DOMAINS).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Show domains for selected role */}
              <div className="bg-surface-container/40 rounded-xl p-3 border border-outline-variant">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Topics this interview will cover:</p>
                <div className="flex flex-wrap gap-1.5">
                  {(ROLE_DOMAINS[role] || []).map(d => (
                    <span key={d} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold border border-primary/20">{d}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface ml-2">Interview Focus</label>
                <select className="w-full px-6 py-3 rounded-full border-2 border-outline-variant focus:border-primary bg-surface-container transition-all outline-none text-on-surface text-sm" value={interviewType} onChange={e => setInterviewType(e.target.value as any)}>
                  <option value="technical">Technical Architecture & Coding</option>
                  <option value="behavioural">Behavioral (STAR Method)</option>
                  <option value="resume_based">Resume-based Deep Dive</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface ml-2">Interview Topic / Domain Focus</label>
                <select className="w-full px-6 py-3 rounded-full border-2 border-outline-variant focus:border-primary bg-surface-container transition-all outline-none text-on-surface text-sm" value={selectedDomain} onChange={e => setSelectedDomain(e.target.value)}>
                  <option value="All Domains">All Domains (HackerRank Cycle)</option>
                  {(ROLE_DOMAINS[role] || []).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface ml-2">Session Duration</label>
                <select className="w-full px-6 py-3 rounded-full border-2 border-outline-variant focus:border-primary bg-surface-container transition-all outline-none text-on-surface text-sm" value={durationMins} onChange={e => setDurationMins(Number(e.target.value))}>
                  <option value={15}>15 Minutes (Express)</option>
                  <option value={30}>30 Minutes (Standard)</option>
                  <option value={45}>45 Minutes (Full Deep Dive)</option>
                </select>
              </div>

              {/* Proctoring toggle + max warnings slider */}
              <div className="flex flex-col gap-3 p-4 bg-surface-container/40 border border-outline-variant rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-xs">videocam</span>
                      AI Proctoring & Anti-Cheat
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-medium">
                      Face detection, body movement, tab-switch monitoring
                    </span>
                  </div>
                  <input type="checkbox" checked={isProctoringEnabled} onChange={e => setIsProctoringEnabled(e.target.checked)} className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer" />
                </div>

                {isProctoringEnabled && (
                  <div className="pt-2 border-t border-outline-variant/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-amber-400 text-xs">crisis_alert</span>
                        Max movement warnings before auto-fail
                      </label>
                      <span className="text-xs font-black text-primary bg-primary/10 px-3 py-0.5 rounded-full border border-primary/20">
                        {maxMovementWarnings}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      step={1}
                      value={maxMovementWarnings}
                      onChange={e => setMaxMovementWarnings(Number(e.target.value))}
                      className="w-full accent-primary h-2 rounded-full cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-on-surface-variant font-semibold">
                      <span>1 — strict</span>
                      <span>10 — balanced</span>
                      <span>20 — lenient</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button onClick={handleStartSession} disabled={isSubmitting} className="w-full py-4 bg-primary text-on-primary font-black text-lg rounded-full shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2">
              {isSubmitting ? 'Launching Session...' : 'Start Interview'}
              <span className="material-symbols-outlined">rocket_launch</span>
            </button>
          </div>
        </main>
      ) : (
        /* ── ACTIVE INTERVIEW LAYOUT ─────────────────────────────────────── */
        <main className="pt-20 h-screen flex overflow-hidden">

          {/* LEFT: Camera Panel (Video Call style) */}
          {isProctoringEnabled && (
            <div className={`${showProctoringPanel ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden flex-shrink-0 flex flex-col bg-black border-r border-gray-800 relative`}>

              {/* Main video feed */}
              <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                {/* hidden motion canvas */}
                <canvas ref={motionCanvasRef} className="hidden" />

                {/* Overlay: Status badge */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm ${proctoringStatusColor}`}>
                    {proctoringStatusText}
                  </span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm ${movementWarnings >= maxMovementWarnings - 1 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                    🏃 {movementWarnings}/{maxMovementWarnings}
                  </span>
                </div>

                {/* Warning overlay when movement detected */}
                {faceDetectionStatus === 'movement' && (
                  <div className="absolute inset-0 border-4 border-amber-400 animate-pulse rounded pointer-events-none" />
                )}
                {(faceDetectionStatus === 'no_face' || faceDetectionStatus === 'multiple_faces') && (
                  <div className="absolute inset-0 border-4 border-red-500 animate-pulse rounded pointer-events-none" />
                )}

                {/* Warning count bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-400 font-bold">Movement Warnings</span>
                    <span className="text-[10px] text-gray-300 font-bold">{movementWarnings}/{maxMovementWarnings}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${movementWarnings >= maxMovementWarnings - 1 ? 'bg-red-500' : movementWarnings >= 2 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                      style={{ width: `${(movementWarnings / maxMovementWarnings) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* AI Avatar at bottom */}
              <div className="bg-gray-900 p-3 border-t border-gray-700 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex-shrink-0 p-0.5 ${aiState === 'speaking' ? 'bg-gradient-to-tr from-primary to-secondary animate-pulse' : aiState === 'listening' ? 'bg-gradient-to-tr from-secondary to-accent' : 'bg-gray-700'}`}>
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100&h=100"
                    alt="AI Interviewer"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">AI Interviewer</p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {aiState === 'speaking' ? '🗣️ Speaking...' : aiState === 'listening' ? '👂 Listening...' : aiState === 'evaluating' ? '🤔 Evaluating...' : '⏸️ Waiting'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Toggle sidebar button */}
          {isProctoringEnabled && (
            <button
              onClick={() => setShowProctoringPanel(p => !p)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-surface-container border border-outline-variant rounded-r-lg p-1 shadow-md"
              style={{ left: showProctoringPanel ? '288px' : '0px', transition: 'left 0.3s' }}
              title="Toggle camera panel"
            >
              <span className="material-symbols-outlined text-sm">{showProctoringPanel ? 'chevron_left' : 'chevron_right'}</span>
            </button>
          )}

          {/* CENTER: Interview content */}
          <div className="flex-1 flex overflow-hidden">

            {/* Main Q&A area */}
            <div className="flex-1 flex flex-col overflow-hidden p-6">

              {/* Question header */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="bg-primary-fixed text-on-primary-fixed-variant px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{role}</span>
                <span className="bg-secondary-container text-on-secondary-container px-4 py-1 rounded-full text-xs font-bold">Q{questionNumber}</span>
                <span className="bg-surface-container text-on-surface-variant px-4 py-1 rounded-full text-xs font-medium capitalize">{interviewType.replace('_', ' ')}</span>
                {weakDomains.length > 0 && (
                  <span className="bg-error/10 text-error px-3 py-1 rounded-full text-[10px] font-bold border border-error/20">
                    ⚠️ Weak: {weakDomains[weakDomains.length - 1]}
                  </span>
                )}
              </div>

              {/* Domain coverage bar */}
              <div className="mb-4 bg-surface-container/30 rounded-xl p-3 border border-outline-variant">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Domain Coverage — {role}</p>
                <div className="flex flex-wrap gap-1.5">
                  {domains.map(d => (
                    <span
                      key={d}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${weakDomains.includes(d)
                        ? 'bg-error/15 text-error border-error/30'
                        : 'bg-primary/10 text-primary border-primary/20'}`}
                    >
                      {weakDomains.includes(d) ? '⚠️ ' : '✓ '}{d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Question Card */}
              <div className="bg-surface rounded-2xl p-6 shadow-md border border-primary/10 relative overflow-hidden group mb-4">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 duration-500 transition-transform" />
                {currentAcknowledgment && (
                  <p className="text-sm text-secondary italic mb-3 leading-relaxed border-l-4 border-secondary/30 pl-3">{currentAcknowledgment}</p>
                )}
                <h2 className="text-xl font-bold leading-tight text-on-surface relative z-10">
                  {currentQuestion?.questionText}
                </h2>
              </div>

              {/* Response area */}
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2">
                    <label className="font-bold text-sm text-on-surface-variant">Your Answer</label>
                    <button
                      type="button"
                      onClick={toggleDictation}
                      className={`p-1.5 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                        isListening 
                          ? 'bg-secondary text-white animate-pulse' 
                          : 'bg-surface-container text-on-surface-variant hover:text-primary'
                      }`}
                      title={isListening ? 'Stop Listening' : 'Start Dictation'}
                    >
                      <span className="material-symbols-outlined text-[16px] leading-none">
                        {isListening ? 'mic' : 'mic_off'}
                      </span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {isListening && (
                      <span className="flex items-center gap-1.5 text-secondary text-xs font-bold animate-pulse">
                        <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                        Listening...
                      </span>
                    )}
                    <span className="text-xs font-medium bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-md">
                      {getWordCount(responseText)} words
                    </span>
                  </div>
                </div>

                <textarea
                  className="flex-grow min-h-[160px] p-5 rounded-2xl border-2 border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-base leading-relaxed resize-none bg-surface/50 backdrop-blur-md text-on-surface"
                  placeholder={isVoiceMode ? 'Speak your answer — microphone is active...' : 'Type your response here...'}
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  disabled={isSubmitting || showFeedbackPanel}
                />

                {/* Action buttons */}
                {!showFeedbackPanel && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* DONE SPEAKING — Primary CTA */}
                    <button
                      id="done-speaking-btn"
                      onClick={handleDoneSpeaking}
                      disabled={responseText.trim().length < 5 || isSubmitting}
                      className={`flex-1 py-4 rounded-full font-black text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${responseText.trim().length >= 5 && !isSubmitting
                        ? 'bg-primary text-on-primary hover:brightness-110 hover:scale-[1.02] active:scale-95'
                        : 'bg-surface-container text-on-surface-variant opacity-50 cursor-not-allowed'}`}
                    >
                      {isSubmitting
                        ? <><span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" /> Analyzing...</>
                        : <><span className="material-symbols-outlined">check_circle</span> Done Speaking — Submit</>
                      }
                    </button>

                    {/* End Interview */}
                    <button
                      onClick={() => { if (confirm('End this interview session? Your performance report will be compiled.')) handleForceEndSession(); }}
                      disabled={isSubmitting}
                      className="px-6 py-4 rounded-full font-bold bg-error/10 text-error border-2 border-error/20 hover:bg-error/20 transition-all text-sm flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">call_end</span>
                      End Interview
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Feedback Panel */}
            <div className={`${showFeedbackPanel && activeScore ? 'w-96' : 'w-0'} transition-all duration-300 overflow-hidden flex-shrink-0 border-l border-outline-variant bg-surface/95 flex flex-col`}>
              {activeScore && showFeedbackPanel && (
                <div className="p-5 overflow-y-auto flex flex-col gap-5 h-full">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-lg text-secondary">AI Score</h3>
                    <span className="bg-tertiary text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest animate-pulse">Live</span>
                  </div>

                  {/* Score circle */}
                  <div className="flex justify-center">
                    <div className="relative w-28 h-28 flex items-center justify-center rounded-full p-3 bg-gradient-to-r from-primary to-secondary">
                      <div className="bg-surface w-full h-full rounded-full flex flex-col items-center justify-center shadow-inner">
                        <span className="text-4xl font-black text-on-surface">{Math.round(activeScore.overallScore)}</span>
                        <span className="text-[10px] font-bold text-on-surface-variant -mt-1">SCORE</span>
                      </div>
                      <div className="absolute -top-2 -right-2 bg-secondary text-white w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-4 border-surface shadow-md">
                        {activeScore.overallScore >= 90 ? 'A+' : activeScore.overallScore >= 80 ? 'A-' : activeScore.overallScore >= 70 ? 'B' : 'C'}
                      </div>
                    </div>
                  </div>

                  {/* Score bars */}
                  <div className="space-y-3">
                    {[
                      { label: 'STAR Structure', value: activeScore.starScore, max: 25, color: 'bg-tertiary' },
                      { label: 'Technical Depth', value: activeScore.techDepthScore, max: 25, color: 'bg-primary' },
                      { label: 'Communication', value: activeScore.commScore, max: 20, color: 'bg-secondary' },
                      { label: 'Relevance', value: activeScore.relevanceScore, max: 15, color: 'bg-tertiary-container' },
                    ].map(({ label, value, max, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs font-bold px-1 mb-1">
                          <span>{label}</span>
                          <span className="text-primary">{Math.round((value / max) * 100)}%</span>
                        </div>
                        <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${(value / max) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Strength / Weakness */}
                  {/* Interviewer live correction */}
                  {activeScore.aiFeedbackJson?.interviewerCorrection && (
                    <div className="bg-primary-container/20 border-l-4 border-primary p-4 rounded-r-xl">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="material-symbols-outlined text-primary text-sm">face</span>
                        <span className="text-xs font-bold text-primary uppercase">Interviewer Correction</span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed italic">
                        "{activeScore.aiFeedbackJson.interviewerCorrection}"
                      </p>
                    </div>
                  )}

                  {/* Factual Technical Errors */}
                  {activeScore.aiFeedbackJson?.technicalErrors && activeScore.aiFeedbackJson.technicalErrors.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">error</span> Factual Mistakes
                      </p>
                      <ul className="space-y-1 pl-4 list-disc text-xs text-on-surface-variant font-medium">
                        {activeScore.aiFeedbackJson.technicalErrors.map((item: string, i: number) => (
                          <li key={i} className="text-red-400">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Key Concepts Missed */}
                  {activeScore.aiFeedbackJson?.keyConceptsMissed && activeScore.aiFeedbackJson.keyConceptsMissed.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">lightbulb</span> Concepts Missed
                      </p>
                      <ul className="space-y-1 pl-4 list-disc text-xs text-on-surface-variant font-medium">
                        {activeScore.aiFeedbackJson.keyConceptsMissed.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* What Was Correct */}
                  {activeScore.aiFeedbackJson?.whatWasCorrect && activeScore.aiFeedbackJson.whatWasCorrect.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">check_circle</span> Factual Corrections Done Right
                      </p>
                      <ul className="space-y-1 pl-4 list-disc text-xs text-on-surface-variant font-medium">
                        {activeScore.aiFeedbackJson.whatWasCorrect.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Ideal Answer outline */}
                  {activeScore.aiFeedbackJson?.idealAnswerOutline && (
                    <div className="bg-surface-container/60 border border-dashed border-outline-variant p-3.5 rounded-xl">
                      <p className="text-[10px] font-black text-secondary uppercase tracking-wider mb-1">Ideal Answer Guide</p>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {activeScore.aiFeedbackJson.idealAnswerOutline}
                      </p>
                    </div>
                  )}

                  {/* Fallback to Strength/Weakness if detailed corrections are missing */}
                  {!activeScore.aiFeedbackJson?.interviewerCorrection && (
                    <div className="space-y-2">
                      {activeScore.aiFeedbackJson?.topStrength && (
                        <div className="bg-surface rounded-xl p-3.5 border-l-4 border-emerald-500 flex gap-2.5 items-start">
                          <span className="material-symbols-outlined text-emerald-500 text-sm mt-0.5">check_circle</span>
                          <div>
                            <p className="font-bold text-xs">Strength</p>
                            <p className="text-xs text-on-surface-variant">{activeScore.aiFeedbackJson.topStrength}</p>
                          </div>
                        </div>
                      )}
                      {activeScore.aiFeedbackJson?.topWeakness && (
                        <div className="bg-surface rounded-xl p-3.5 border-l-4 border-error flex gap-2.5 items-start">
                          <span className="material-symbols-outlined text-error text-sm mt-0.5">warning</span>
                          <div>
                            <p className="font-bold text-xs">Weakness</p>
                            <p className="text-xs text-on-surface-variant">{activeScore.aiFeedbackJson.topWeakness}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Next Question button */}
                  <button
                    onClick={handleNextOrFinish}
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-full bg-secondary text-white font-bold shadow-md hover:brightness-110 transition-all text-sm mt-auto"
                  >
                    {nextQuestionRef ? '→ Next Question' : '🏁 Finish & View Report'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chat history overlay (voice mode) */}
          {isVoiceMode && chatHistory.length > 0 && (
            <div className="fixed bottom-20 right-6 w-80 max-h-[40vh] bg-surface/95 backdrop-blur-md border border-outline-variant rounded-2xl shadow-premium overflow-y-auto p-4 space-y-3 z-30">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">Live Transcript</p>
              {chatHistory.slice(-6).map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.sender === 'candidate' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] text-on-surface-variant uppercase font-black tracking-wider mb-0.5 px-1">
                    {msg.sender === 'candidate' ? 'You' : 'AI'}
                  </span>
                  <div className={`p-2.5 rounded-xl text-[11px] leading-relaxed max-w-[90%] ${msg.sender === 'candidate'
                    ? 'bg-primary text-on-primary rounded-tr-none'
                    : msg.sender === 'acknowledgment'
                      ? 'bg-secondary/10 text-secondary italic rounded-tl-none border border-secondary/20'
                      : 'bg-surface-container text-on-surface rounded-tl-none border border-outline-variant'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </main>
      )}

      {/* Warning toasts */}
      {sessionStarted && isProctoringEnabled && faceDetectionStatus !== 'ok' && faceDetectionStatus !== 'disabled' && faceDetectionStatus !== 'initializing' && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-error/95 text-white font-bold px-6 py-3 rounded-full shadow-lg border border-error-container flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-sm">warning</span>
          <span>
            {faceDetectionStatus === 'no_face' ? 'PROCTORING: No face detected!' :
              faceDetectionStatus === 'multiple_faces' ? 'PROCTORING: Multiple faces detected!' :
                faceDetectionStatus === 'looking_away' ? 'PROCTORING: Look at the screen!' :
                  faceDetectionStatus === 'movement' ? `PROCTORING: Excessive movement! (${movementWarnings}/${maxMovementWarnings})` :
                    'PROCTORING: Behavior deviation!'}
          </span>
        </div>
      )}

      {/* Movement auto-fail warning near limit */}
      {sessionStarted && isProctoringEnabled && movementWarnings >= maxMovementWarnings - 1 && movementWarnings < maxMovementWarnings && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-amber-500/95 text-white font-bold px-8 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-pulse">
          <span className="material-symbols-outlined">crisis_alert</span>
          <span>⚠️ FINAL WARNING: One more movement = Interview Auto-Terminated!</span>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 md:hidden bg-surface shadow-lg rounded-t-xl border-t border-outline-variant">
        <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-bold">Home</span>
        </button>
        {sessionStarted && (
          <button
            onClick={handleDoneSpeaking}
            disabled={responseText.trim().length < 5 || isSubmitting}
            className="flex flex-col items-center justify-center bg-primary text-on-primary rounded-full px-6 py-1.5 active:scale-90 transition-all shadow"
          >
            <span className="material-symbols-outlined">check_circle</span>
            <span className="text-[10px] font-bold">Done</span>
          </button>
        )}
        <button onClick={() => navigate('/history')} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">history</span>
          <span className="text-[10px] font-bold">History</span>
        </button>
      </nav>
    </div>
  );
};

export default SessionPage;
