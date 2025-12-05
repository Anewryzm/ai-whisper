import React, { useState, useEffect } from 'react';
import { X, Key, Save, ExternalLink, ShieldCheck } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (groqKey: string, keywordsKey: string) => void;
  currentGroqKey: string;
  currentKeywordsKey: string;
  isGroqEnvSet: boolean;
  isKeywordsEnvSet: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentGroqKey,
  currentKeywordsKey,
  isGroqEnvSet,
  isKeywordsEnvSet
}) => {
  const [groqInput, setGroqInput] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGroqInput(currentGroqKey);
      setKeywordsInput(currentKeywordsKey);
    }
  }, [isOpen, currentGroqKey, currentKeywordsKey]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(groqInput, keywordsInput);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-2 text-white">
            <Key className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold tracking-tight">Configuración de APIs</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Groq Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="groqKey" className="flex items-center gap-2 text-sm font-medium text-neutral-300">
                <span>Groq API Key</span>
                <span className="text-[10px] uppercase bg-white/10 px-1.5 py-0.5 rounded text-neutral-400">Transcripción</span>
              </label>
            </div>
            
            {isGroqEnvSet ? (
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                <div className="flex items-center gap-2 text-green-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-sm font-medium">Configurada por Entorno</span>
                </div>
              </div>
            ) : (
              <div className="relative">
                <input
                  id="groqKey"
                  type="password"
                  value={groqInput}
                  onChange={(e) => setGroqInput(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm"
                />
                <div className="mt-1.5 text-xs text-neutral-500 text-right">
                  <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Obtener Key</a>
                </div>
              </div>
            )}
          </div>

          {/* Keywords AI Section */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between pt-2">
              <label htmlFor="keywordsKey" className="flex items-center gap-2 text-sm font-medium text-neutral-300">
                 <span>Keywords AI API Key</span>
                 <span className="text-[10px] uppercase bg-white/10 px-1.5 py-0.5 rounded text-neutral-400">Chat / LLM</span>
              </label>
            </div>

            {isKeywordsEnvSet ? (
               <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                <div className="flex items-center gap-2 text-green-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-sm font-medium">Configurada por Entorno</span>
                </div>
              </div>
            ) : (
              <div className="relative">
                <input
                  id="keywordsKey"
                  type="password"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="kw-..."
                  className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm"
                />
                <div className="mt-1.5 text-xs text-neutral-500 text-right">
                   <a href="https://keywordsai.co/" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Obtener Key</a>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20 transition-all"
            >
              <Save className="w-4 h-4" />
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};