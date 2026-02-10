
import React, { useState, useEffect } from 'react';
import { X, Save, ShieldCheck, Globe, Key } from 'lucide-react';
import { VtexConfig } from '../types';

interface VtexConfigModalProps {
  onClose: () => void;
  onSave: (config: VtexConfig) => void;
  initialConfig?: VtexConfig | null;
}

export const VtexConfigModal: React.FC<VtexConfigModalProps> = ({ onClose, onSave, initialConfig }) => {
  const [config, setConfig] = useState<VtexConfig>({
    accountName: 'oechsle',
    appKey: '',
    appToken: '',
    environment: 'vtexcommercestable'
  });

  useEffect(() => {
    if (initialConfig) setConfig(initialConfig);
  }, [initialConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-oechsle-border flex items-center justify-between bg-oechsle-gray">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-oechsle-red" />
            <h3 className="text-xs font-black uppercase tracking-widest text-oechsle-black">Credenciales VTEX</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white rounded-full text-gray-400">
             <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
              <Globe className="w-3 h-3" /> Account Name
            </label>
            <input 
              type="text"
              required
              value={config.accountName}
              onChange={e => setConfig({...config, accountName: e.target.value})}
              className="w-full h-10 px-3 text-sm oechsle-input"
              placeholder="ej: oechsle"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
              <Key className="w-3 h-3" /> App Key
            </label>
            <input 
              type="text"
              required
              value={config.appKey}
              onChange={e => setConfig({...config, appKey: e.target.value})}
              className="w-full h-10 px-3 text-sm oechsle-input"
              placeholder="vtexappkey-..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> App Token
            </label>
            <input 
              type="password"
              required
              value={config.appToken}
              onChange={e => setConfig({...config, appToken: e.target.value})}
              className="w-full h-10 px-3 text-sm oechsle-input"
              placeholder="••••••••••••••••"
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className="w-full h-12 bg-oechsle-red text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-oechsle-darkRed transition-all"
            >
              Guardar Configuración
            </button>
            <p className="text-[9px] text-gray-400 mt-4 text-center font-medium uppercase tracking-widest">
              Conexión directa segura a la API de Catálogo
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
