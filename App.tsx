import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Settings, ShieldCheck, AlertCircle } from 'lucide-react';
import { ControlIsland } from './components/ControlIsland';
import { TranscriptionDisplay } from './components/TranscriptionDisplay';
import { ApiKeyModal } from './components/ApiKeyModal';
import { transcribeAudio, generateActionPlan } from './services/groqService';
import { RecorderState } from './types';

// ============================================================================
// SYSTEM KEY DETECTION
// ============================================================================

// Vite reemplaza estáticamente las variables que empiezan con VITE_ durante el build.
// Para que funcione en producción (Vercel), debemos acceder a ellas explícitamente
// y no a través de una función dinámica con nombres de variables.
const getEnvironmentKeys = () => {
  let groqKey = '';
  let keywordsKey = '';

  try {
    // @ts-ignore - Vite specific
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      if (import.meta.env.VITE_GROQ_API_KEY) {
        // @ts-ignore
        groqKey = import.meta.env.VITE_GROQ_API_KEY;
      }
      // @ts-ignore
      if (import.meta.env.VITE_KEYWORDS_API_KEY) {
        // @ts-ignore
        keywordsKey = import.meta.env.VITE_KEYWORDS_API_KEY;
      }
    }
  } catch (e) {
    console.debug('Environment variables not accessible via import.meta');
  }

  // Fallback para entornos que usen process.env (opcional)
  if (!groqKey && typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_GROQ_API_KEY) groqKey = process.env.VITE_GROQ_API_KEY;
    else if (process.env.GROQ_API_KEY) groqKey = process.env.GROQ_API_KEY;
  }

  if (!keywordsKey && typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_KEYWORDS_API_KEY) keywordsKey = process.env.VITE_KEYWORDS_API_KEY;
    else if (process.env.KEYWORDS_API_KEY) keywordsKey = process.env.KEYWORDS_API_KEY;
  }

  return { groqKey, keywordsKey };
};

const { groqKey: ENV_GROQ_KEY, keywordsKey: ENV_KEYWORDS_KEY } = getEnvironmentKeys();

function App() {
  const [recorderState, setRecorderState] = useState<RecorderState>(RecorderState.IDLE);
  const [transcription, setTranscription] = useState<string>('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<'idle' | 'transcribing' | 'generating'>('idle');
  
  // API Keys State (User Local Storage)
  const [userGroqKey, setUserGroqKey] = useState<string>('');
  const [userKeywordsKey, setUserKeywordsKey] = useState<string>('');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Determinar qué Keys usar
  const effectiveGroqKey = ENV_GROQ_KEY || userGroqKey;
  const effectiveKeywordsKey = ENV_KEYWORDS_KEY || userKeywordsKey;

  const isGroqReady = !!effectiveGroqKey;
  const isKeywordsReady = !!effectiveKeywordsKey;
  const isAllReady = isGroqReady && isKeywordsReady;

  useEffect(() => {
    // Cargar Keys del localStorage
    const storedGroq = localStorage.getItem('groq_api_key');
    const storedKeywords = localStorage.getItem('keywords_ai_api_key');
    
    if (storedGroq) setUserGroqKey(storedGroq);
    if (storedKeywords) setUserKeywordsKey(storedKeywords);
  }, []);

  const handleSaveApiKeys = (groqKey: string, keywordsKey: string) => {
    setUserGroqKey(groqKey);
    localStorage.setItem('groq_api_key', groqKey);
    
    setUserKeywordsKey(keywordsKey);
    localStorage.setItem('keywords_ai_api_key', keywordsKey);
    
    setError(null);
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

    if (!isAllReady) {
      setError('Faltan configuraciones. Por favor revisa las API Keys en el panel de configuración.');
      setIsSettingsOpen(true);
      return;
    }

    setRecorderState(RecorderState.PROCESSING);
    setError(null);

    try {
      // Paso 1: Transcribir (Usa Groq Key)
      setProcessingStep('transcribing');
      const rawText = await transcribeAudio(effectiveGroqKey, audioBlob);
      
      // Paso 2: Generar Plan (Usa Keywords AI Key)
      setProcessingStep('generating');
      const actionPlan = await generateActionPlan(effectiveKeywordsKey, rawText);

      setTranscription(actionPlan);
      setRecorderState(RecorderState.IDLE); 
      setProcessingStep('idle');
    } catch (err: any) {
      console.error('Processing error:', err);
      setError(err.message || 'Ocurrió un error al procesar tu solicitud.');
      setRecorderState(RecorderState.HAS_AUDIO);
      setProcessingStep('idle');
    }
  };

  // Helper para mostrar estado de las keys en el header
  const renderStatusBadge = () => {
    if (isAllReady) {
      return (
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 backdrop-blur-md animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs font-medium text-green-400/90 tracking-wide">
              Systems Online
            </span>
          </div>
        </div>
      );
    }

    if (isGroqReady || isKeywordsReady) {
      return (
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-md animate-in fade-in slide-in-from-left-4 duration-700">
           <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
           <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-medium text-yellow-400/90 tracking-wide">
              Config Partial
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-red-500/5 border border-red-500/20 backdrop-blur-md animate-in fade-in slide-in-from-left-4 duration-700">
        <div className="h-2 w-2 rounded-full bg-red-500/50"></div>
        <div className="flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-medium text-red-400/90 tracking-wide">
            Setup Needed
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center overflow-hidden selection:bg-indigo-500/30">
      
      <ApiKeyModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveApiKeys}
        currentGroqKey={userGroqKey}
        currentKeywordsKey={userKeywordsKey}
        isGroqEnvSet={!!ENV_GROQ_KEY}
        isKeywordsEnvSet={!!ENV_KEYWORDS_KEY}
      />

      <nav className="w-full p-6 flex items-center justify-between relative z-10">
        <div className="flex items-center">
          {renderStatusBadge()}
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block pointer-events-none">
          <h1 className="text-sm font-medium tracking-widest text-neutral-500 uppercase opacity-50">
            Groq x Keywords AI
          </h1>
        </div>
        
        <div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={`p-2 rounded-full transition-all duration-200 group ${
              !isAllReady 
                ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10 animate-pulse-fast' 
                : 'text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
            title="Configurar API Keys"
          >
            <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>
      </nav>

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

      <ControlIsland 
        recorderState={recorderState}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onSendAudio={handleSendAudio}
        onReset={handleReset}
      />

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}

export default App;