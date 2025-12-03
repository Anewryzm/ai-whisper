import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { ControlIsland } from './components/ControlIsland';
import { TranscriptionDisplay } from './components/TranscriptionDisplay';
import { ApiKeyModal } from './components/ApiKeyModal';
import { transcribeAudio, generateActionPlan } from './services/groqService';
import { RecorderState } from './types';

function App() {
  const [recorderState, setRecorderState] = useState<RecorderState>(RecorderState.IDLE);
  const [transcription, setTranscription] = useState<string>('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<'idle' | 'transcribing' | 'generating'>('idle');
  
  // API Key State
  const [apiKey, setApiKey] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Cargar API Key del localStorage al iniciar
    const storedKey = localStorage.getItem('groq_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
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

    if (!apiKey) {
      setError('Por favor configura tu Groq API Key en el icono de engranaje antes de continuar.');
      setIsSettingsOpen(true);
      return;
    }

    setRecorderState(RecorderState.PROCESSING);
    setError(null);

    try {
      // Paso 1: Transcribir el audio
      setProcessingStep('transcribing');
      const rawText = await transcribeAudio(apiKey, audioBlob);
      
      // Paso 2: Generar el plan de acción (To-Do List)
      setProcessingStep('generating');
      const actionPlan = await generateActionPlan(apiKey, rawText);

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
        onSave={handleSaveApiKey}
        currentKey={apiKey}
      />

      {/* Header / Nav Area */}
      <nav className="w-full p-6 flex items-center relative">
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-sm font-medium tracking-widest text-neutral-500 uppercase opacity-50">
            Groq AI Planner
          </h1>
        </div>
        <div className="ml-auto z-10">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 group"
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