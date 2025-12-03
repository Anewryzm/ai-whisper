import React, { useState, useEffect } from 'react';
import { X, Key, Save, ExternalLink, ShieldCheck } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  currentKey: string;
  isEnvSet: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentKey,
  isEnvSet 
}) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue(currentKey);
    }
  }, [isOpen, currentKey]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(inputValue);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-2 text-white">
            <Key className={`w-5 h-5 ${isEnvSet ? 'text-green-400' : 'text-indigo-400'}`} />
            <h2 className="font-semibold tracking-tight">Configuración API</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="apiKey" className="block text-sm font-medium text-neutral-300">
              Groq API Key
            </label>
            
            {isEnvSet ? (
              // Estado: Variable de Entorno Detectada
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-green-400">Configurada por Entorno</h3>
                    <p className="text-xs text-green-200/70 mt-1 leading-relaxed">
                      La aplicación ha detectado una API Key configurada a través de las variables de entorno del sistema (como <code>VITE_GROQ_API_KEY</code> o <code>REACT_APP_GROQ_API_KEY</code>). No es necesario que introduzcas una manualmente.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Estado: Input Manual
              <>
                <div className="relative">
                  <input
                    id="apiKey"
                    type="password"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-neutral-500 flex items-center gap-1">
                  Tu clave se guarda localmente en tu navegador.
                  <a 
                    href="https://console.groq.com/keys" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 hover:underline inline-flex items-center gap-0.5"
                  >
                    Obtener Key <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {isEnvSet ? 'Cerrar' : 'Cancelar'}
            </button>
            
            {!isEnvSet && (
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/20 transition-all"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};