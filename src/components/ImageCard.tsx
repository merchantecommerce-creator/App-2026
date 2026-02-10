
import React from 'react';
import { Download, Loader2, Sparkles, Ruler, Wand2, Check } from 'lucide-react';
import { ProductImage } from '../types';

interface ImageCardProps {
  image: ProductImage;
  selected: boolean;
  onToggleSelect: () => void;
  onDownload: (img: ProductImage) => void;
  onAnalyze: (img: ProductImage) => void;
  onEdit: (img: ProductImage) => void;
  onGenerateFrom: (img: ProductImage) => void;
  isAnalyzing: boolean;
}

export const ImageCard: React.FC<ImageCardProps> = ({ 
  image, 
  selected,
  onToggleSelect,
  onDownload, 
  onAnalyze, 
  onEdit,
  onGenerateFrom,
  isAnalyzing 
}) => {
  return (
    <div 
      className={`relative group bg-white border transition-all duration-300 ${
        selected ? 'border-oechsle-red ring-1 ring-oechsle-red' : 'border-oechsle-border hover:border-gray-400'
      }`}
    >
      {/* Selection Circle */}
      <button 
          onClick={onToggleSelect}
          className={`absolute top-3 left-3 z-20 w-5 h-5 flex items-center justify-center rounded-full border transition-all ${
              selected ? 'bg-oechsle-red border-oechsle-red text-white' : 'bg-white/90 border-gray-300 group-hover:opacity-100 opacity-0'
          }`}
      >
          {selected && <Check className="w-3 h-3" />}
      </button>

      {/* Format Tag */}
      <div className="absolute top-3 right-3 z-10 px-1.5 py-0.5 bg-oechsle-black text-white text-[8px] font-black uppercase tracking-widest rounded-sm opacity-80">
        JPG STD
      </div>

      {/* Image Container */}
      <div className="aspect-square relative bg-white flex items-center justify-center p-4 overflow-hidden border-b border-oechsle-border cursor-pointer" onClick={onToggleSelect}>
        {image.status === 'converting' ? (
           <div className="flex flex-col items-center gap-2">
             <Loader2 className="h-6 w-6 text-oechsle-red animate-spin" />
             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Ajustando...</span>
           </div>
        ) : image.objectUrl ? (
          <img 
            src={image.objectUrl} 
            alt="Catálogo" 
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <span className="text-red-500 text-[8px] font-black">IMAGE_ERROR</span>
        )}
        
        {/* Quick Actions Overlay */}
        <div className="absolute inset-x-0 bottom-0 flex p-1.5 gap-1.5 bg-white/60 backdrop-blur-sm transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
                onClick={(e) => { e.stopPropagation(); onAnalyze(image); }}
                disabled={isAnalyzing}
                className="flex-1 h-8 flex items-center justify-center bg-white border border-oechsle-border hover:bg-blue-600 hover:text-white transition-all text-gray-500"
                title="Sugerir Nombre IA"
            >
               {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Sparkles className="w-3.5 h-3.5" />}
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onGenerateFrom(image); }}
                className="flex-1 h-8 flex items-center justify-center bg-white border border-oechsle-border hover:bg-oechsle-black hover:text-white transition-all text-gray-500"
                title="Generar Variación"
            >
               <Wand2 className="w-3.5 h-3.5" />
            </button>
             <button
                onClick={(e) => { e.stopPropagation(); onEdit(image); }}
                className="flex-1 h-8 flex items-center justify-center bg-white border border-oechsle-border hover:bg-oechsle-black hover:text-white transition-all text-gray-500"
                title="Añadir Medidas"
            >
               <Ruler className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onDownload(image); }}
                className="flex-1 h-8 flex items-center justify-center bg-oechsle-red text-white hover:bg-oechsle-darkRed transition-all"
                title="Descargar"
            >
                <Download className="w-3.5 h-3.5" />
            </button>
        </div>
      </div>

      {/* Info Block */}
      <div className="p-4">
        <p className="text-[10px] font-black text-oechsle-black tracking-tight truncate uppercase leading-tight">
            {image.suggestedName ? (
                <span className="flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                    {image.suggestedName}
                </span>
            ) : (
                `ARCHIVO_${image.id.substring(0,6)}`
            )}
        </p>
        <div className="flex justify-between items-center mt-2 border-t border-oechsle-gray pt-2">
            <span className="text-[8px] text-gray-400 font-bold tracking-widest">DIMENSIÓN</span>
            {image.width && (
                <span className="text-[8px] text-oechsle-black font-black tracking-widest">{image.width} × {image.height} PX</span>
            )}
        </div>
      </div>
    </div>
  );
};
