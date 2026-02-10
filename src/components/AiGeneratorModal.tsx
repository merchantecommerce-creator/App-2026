
import React, { useState } from 'react';
import { X, Wand2, Loader2, Download, Plus, AlertCircle, Sparkles } from 'lucide-react';
import { generateAiImage } from '../services/geminiService';
import { ProductImage } from '../types';

interface AiGeneratorModalProps {
  referenceImage?: ProductImage | null;
  onClose: () => void;
  onAddToGallery: (blob: Blob, prompt: string, width?: number, height?: number) => void;
}

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({ referenceImage, onClose, onAddToGallery }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    try {
        const blob = await generateAiImage(
            prompt, 
            referenceImage?.blob || undefined,
            referenceImage?.width,
            referenceImage?.height
        );
        const url = URL.createObjectURL(blob);
        setGeneratedBlob(blob);
        setGeneratedUrl(url);
    } catch (err: any) {
        setError(err.message || "No se pudo generar la imagen.");
    } finally {
        setIsGenerating(false);
    }
  };

  const downloadGenerated = () => {
    if (!generatedUrl) return;
    const a = document.createElement('a');
    a.href = generatedUrl;
    a.download = `ia-gen-${Date.now()}.jpg`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-oechsle-border flex items-center justify-between bg-oechsle-gray">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-oechsle-red" />
            <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-oechsle-black">Generador de Variaciones IA</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full text-gray-400">
             <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="aspect-square w-full max-w-md mx-auto relative bg-white border border-oechsle-border flex items-center justify-center overflow-hidden">
             {generatedUrl ? (
                <img src={generatedUrl} alt="AI Generated" className="w-full h-full object-contain animate-fade-in" />
             ) : isGenerating ? (
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-oechsle-red animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-oechsle-red">Generando Activo...</p>
                </div>
             ) : (
                <div className="flex flex-col items-center gap-2 text-gray-300">
                    <Sparkles className="w-12 h-12 opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Describe la modificación</p>
                </div>
             )}

             {referenceImage && !generatedUrl && !isGenerating && (
                <div className="absolute bottom-4 left-4 right-4 p-2 bg-white/90 border border-oechsle-border flex items-center gap-3">
                    <div className="w-10 h-10 border border-oechsle-border overflow-hidden flex-shrink-0">
                        <img src={referenceImage.objectUrl || ''} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Usando referencia de catálogo</span>
                </div>
             )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-oechsle-red/5 text-oechsle-red rounded text-xs border border-oechsle-red font-bold">
                <AlertCircle className="w-4 h-4" />
                {error}
            </div>
          )}

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Instrucción Creativa</label>
            <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ej: Sofá en color azul turquesa, estilo nórdico, fondo blanco..."
                className="w-full p-4 text-sm oechsle-input resize-none h-24"
                disabled={isGenerating}
            />
          </div>
        </div>

        <div className="p-4 bg-oechsle-gray border-t border-oechsle-border flex gap-3">
          {!generatedUrl ? (
            <button 
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="flex-1 h-12 bg-oechsle-red text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-oechsle-darkRed disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Generar
            </button>
          ) : (
            <>
                <button 
                    onClick={() => { setGeneratedUrl(null); setGeneratedBlob(null); }}
                    className="flex-1 h-12 border border-oechsle-black text-xs font-black uppercase tracking-[0.2em] transition-all"
                >
                    Nueva
                </button>
                <button 
                    onClick={() => { if (generatedBlob) onAddToGallery(generatedBlob, prompt, referenceImage?.width, referenceImage?.height); }}
                    className="flex-1 h-12 bg-oechsle-black text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Utilizar
                </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
