import React from 'react';
import { Mic, Square, Send, RefreshCw, Loader2, Trash2 } from 'lucide-react';
import { RecorderState } from '../types';

interface ControlIslandProps {
  recorderState: RecorderState;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSendAudio: () => void;
  onReset: () => void;
}

export const ControlIsland: React.FC<ControlIslandProps> = ({
  recorderState,
  onStartRecording,
  onStopRecording,
  onSendAudio,
  onReset,
}) => {
  
  const isRecording = recorderState === RecorderState.RECORDING;
  const isProcessing = recorderState === RecorderState.PROCESSING;
  const hasAudio = recorderState === RecorderState.HAS_AUDIO;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-groq-island border border-white/10 shadow-2xl backdrop-blur-md rounded-full px-2 py-2 flex items-center gap-2 transition-all duration-300 ease-in-out">
        
        {/* Left Section: Record / Stop / Delete */}
        <div className="flex items-center">
          {isRecording ? (
            <button
              onClick={onStopRecording}
              className="group flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
              title="Detener grabación"
            >
              <div className="w-4 h-4 rounded-sm bg-current group-hover:scale-110 transition-transform" />
            </button>
          ) : hasAudio ? (
            <button
              onClick={onReset}
              className="flex items-center justify-center w-12 h-12 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
              title="Descartar grabación"
              disabled={isProcessing}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onStartRecording}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-black hover:scale-105 transition-transform"
              title="Iniciar grabación"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Visual Separator if we have audio or are recording */}
        {(isRecording || hasAudio) && (
           <div className="h-6 w-px bg-white/10 mx-1" />
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div className="px-3 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-sm font-medium text-white/90 tabular-nums">Grabadando...</span>
          </div>
        )}

        {/* Send Button (Only visible when audio is ready) */}
        {hasAudio && (
          <button
            onClick={onSendAudio}
            disabled={isProcessing}
            className={`
              flex items-center gap-2 px-6 h-12 rounded-full font-semibold text-sm transition-all duration-200
              ${isProcessing 
                ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40'
              }
            `}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <span>Transcribir</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};