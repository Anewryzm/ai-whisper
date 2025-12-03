import React from 'react';
import { Sparkles, FileText, CheckSquare } from 'lucide-react';

interface TranscriptionDisplayProps {
  text: string;
  isProcessing: boolean;
  isEmpty: boolean;
  step?: 'transcribing' | 'generating' | 'idle';
}

export const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ 
  text, 
  isProcessing,
  isEmpty,
  step = 'idle'
}) => {
  return (
    <div className="w-full max-w-3xl flex flex-col items-center justify-center min-h-[50vh] transition-opacity duration-500">
      
      {isEmpty && !isProcessing && (
        <div className="text-center text-neutral-500 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/5">
            <Sparkles className="w-8 h-8 text-neutral-600" />
          </div>
          <h2 className="text-2xl font-medium text-white tracking-tight">Asistente de Proyectos</h2>
          <p className="max-w-md mx-auto text-neutral-400 leading-relaxed">
            Graba tus ideas. Usaremos <span className="text-indigo-400 font-mono text-xs py-0.5 px-1.5 bg-indigo-400/10 rounded">Groq</span> para transcribir y estructurar tu plan de acción automáticamente.
          </p>
        </div>
      )}

      {isProcessing && (
        <div className="text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-r-2 border-white/20 rounded-full animate-spin animation-delay-200"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              {step === 'transcribing' ? (
                 <FileText className="w-6 h-6 text-indigo-400 animate-pulse" />
              ) : (
                 <CheckSquare className="w-6 h-6 text-green-400 animate-pulse" />
              )}
            </div>
          </div>
          <p className="text-neutral-400 animate-pulse font-light tracking-wide">
            {step === 'transcribing' ? 'Transcribiendo audio...' : 'Generando lista de tareas...'}
          </p>
        </div>
      )}

      {!isEmpty && !isProcessing && (
        <div className="w-full animate-in fade-in zoom-in-95 duration-500">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-b from-indigo-500/10 to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative bg-[#161616] border border-white/10 rounded-xl p-8 md:p-12 shadow-2xl">
              {/* Output Header Decoration */}
              <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Action Plan Generated</span>
              </div>
              
              <div className="prose prose-invert prose-lg max-w-none">
                <p className="leading-relaxed text-neutral-200 whitespace-pre-wrap font-light text-lg font-sans">
                  {text}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};