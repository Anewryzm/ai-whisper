import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Settings, ShieldCheck, User, AlertCircle } from 'lucide-react';
import { ControlIsland } from './components/ControlIsland';
import { TranscriptionDisplay } from './components/TranscriptionDisplay';
import { ApiKeyModal } from './components/ApiKeyModal';
import { transcribeAudio, generateActionPlan } from './services/groqService';
import { RecorderState } from './types';

// Función robusta para detectar la API Key en diferentes entornos de construcción (Vite, CRA, Webpack)
const getSystemApiKey = (): string => {
  // 1. Intento: Vite Standard (import.meta.env)
  try {
    // @ts-ignore - Ignoramos error de TS si el target no es ESNext
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GROQ_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_GROQ_API_KEY;
    }
  } catch (e) {
    // Continuar si falla import.meta
  }

  // 2. Intento: Process Env (CRA, Next.js, Webpack, Node)
  if (typeof process !== 'undefined' && process.env) {
    // Prioridad 1: Prefijo REACT_APP_ (Create React App)
    if (process.env.REACT_APP_GROQ_API_KEY) return process.env.REACT_APP_GROQ_API_KEY;
    // Prioridad 2: Prefijo VITE_ en process.env (A veces inyectado)
    if (process.env.VITE_GROQ_API_KEY) return process.env.VITE_GROQ_API_KEY;
    // Prioridad 3: Nombre directo (Legacy o configuración manual de servidor)
    if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY;
  }

  return '';
};

const ENV_API_KEY = getSystemApiKey();

function App() {
  const [recorderState, setRecorderState] = useState<RecorderState>(RecorderState.IDLE);
  const [transcription, setTranscription] = useState<string>('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<'idle' | 'transcribing' | 'generating'>('idle');
  
  // API Key State (User Local Storage)
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Determinar qué Key usar: Entorno tiene prioridad sobre Usuario
  const effectiveApiKey = ENV_API_KEY || userApiKey;
  const isEnvSet = !!ENV_API_KEY;

  useEffect(() => {
    // Cargar API Key del localStorage al iniciar (solo si no hay env var, aunque es bueno tenerla cargada por si acaso)
    const storedKey = localStorage.getItem('groq_api_key');
    if (storedKey) {
      setUserApiKey(storedKey);
    }
  }, []);

  const handleSaveUserApiKey = (key: string) => {
    setUserApiKey(key);
    localStorage.setItem('groq_api_key', key);
    setError(null); // Limpiar errores previos si se actualiza la key
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : undefined
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: mediaRecorder.mimeType || 'audio/webm' 
        });
        setAudioBlob(blob);
        setRecorderState(RecorderState.HAS_AUDIO);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecorderState(RecorderState.RECORDING);
      setTranscription('');
      setError(null);
      setProcessingStep('idle');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('No se pudo acceder al micrófono. Por favor verifica los permisos.');
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleReset = useCallback(() => {
    setRecorderState(RecorderState.IDLE);
    setAudioBlob(null);
    setTranscription('');
    setError(null);
    setProcessingStep('idle');
  }, []);

  const handleSendAudio = async () => {
    if (!audioBlob) return;

    if (!effectiveApiKey) {
      setError('No se detectó configuración. Por favor configura tu Groq API Key en el engranaje.');
      setIsSettingsOpen(true);
      return;
    }

    setRecorderState(RecorderState.PROCESSING);
    setError(null);

    try {
      // Paso 1: Transcribir el audio
      setProcessingStep('transcribing');
      const rawText = await transcribeAudio(effectiveApiKey, audioBlob);
      
      // Paso 2: Generar el plan de acción (To-Do List)
      setProcessingStep('generating');
      const actionPlan = await generateActionPlan(effectiveApiKey, rawText);

      setTranscription(actionPlan);
      setRecorderState(RecorderState.IDLE); 
      setProcessingStep('idle');
    } catch (err: any) {
      console.error('Processing error:', err);
      setError(err.message || 'Ocurrió un error al procesar tu solicitud.');
      setRecorderState(RecorderState.HAS_AUDIO); // Permitir reintentar
      setProcessingStep('idle');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center overflow-hidden selection:bg-indigo-500/30">
      
      {/* Settings Modal */}
      <ApiKeyModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveUserApiKey}
        currentKey={userApiKey}
        isEnvSet={isEnvSet}
      />

      {/* Header / Nav Area */}
      <nav className="w-full p-6 flex items-center justify-between relative z-10">
        
        {/* LEFT: Status Indicator */}
        <div className="flex items-center">
          {isEnvSet ? (
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 backdrop-blur-md animate-in fade-in slide-in-from-left-4 duration-700">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-medium text-green-400/90 tracking-wide">
                  System Key Active
                </span>
              </div>
            </div>
          ) : userApiKey ? (
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md animate-in fade-in slide-in-from-left-4 duration-700">
              <div className="h-2 w-2 rounded-full bg-indigo-400"></div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-medium text-indigo-400/90 tracking-wide">
                  User Key Active
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-red-500/5 border border-red-500/20 backdrop-blur-md animate-in fade-in slide-in-from-left-4 duration-700">
              <div className="h-2 w-2 rounded-full bg-red-500/50"></div>
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs font-medium text-red-400/90 tracking-wide">
                  Setup Required
                </span>
              </div>
            </div>
          )}
        </div>

        {/* CENTER: Title */}
        <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block pointer-events-none">
          <h1 className="text-sm font-medium tracking-widest text-neutral-500 uppercase opacity-50">
            Groq AI Planner
          </h1>
        </div>
        
        {/* RIGHT: Settings Button */}
        <div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={`p-2 rounded-full transition-all duration-200 group ${
              isEnvSet 
                ? 'text-green-500/50 hover:text-green-400 hover:bg-green-500/10' 
                : !userApiKey 
                  ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10 animate-pulse-fast' 
                  : 'text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
            title="Configurar API Key"
          >
            <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl px-6 flex flex-col items-center pt-10 pb-32">
        
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm max-w-md text-center animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <TranscriptionDisplay 
          text={transcription} 
          isProcessing={recorderState === RecorderState.PROCESSING}
          isEmpty={!transcription && recorderState !== RecorderState.PROCESSING}
          step={processingStep}
        />
        
      </main>

      {/* Bottom Island Control */}
      <ControlIsland 
        recorderState={recorderState}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onSendAudio={handleSendAudio}
        onReset={handleReset}
      />

      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]" />
      </div>

    </div>
  );
}

export default App;