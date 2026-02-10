
import React, { useState, useRef } from 'react';
import { Search, Loader2, Upload, ChevronRight } from 'lucide-react';

interface UrlInputProps {
  onSearch: (url: string) => void;
  onUpload: (files: FileList) => void;
  isLoading: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({ onSearch, onUpload, isLoading }) => {
  const [input, setInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input.trim());
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        onUpload(e.target.files);
        e.target.value = '';
    }
  };

  return (
    <div className="w-full space-y-4">
        <form onSubmit={handleSubmit} className="relative w-full">
            <input
                type="url"
                className="w-full h-14 pl-5 pr-14 text-sm font-medium placeholder-gray-400 bg-white border border-oechsle-border rounded-lg shadow-sm focus:outline-none focus:border-oechsle-red focus:ring-1 focus:ring-oechsle-red transition-all"
                placeholder="Busca un producto por URL de Oechsle..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
            />
            <button
                type="submit"
                disabled={isLoading || !input}
                className="absolute right-0 top-0 h-14 w-14 flex items-center justify-center bg-oechsle-red text-white hover:bg-oechsle-darkRed transition-all rounded-r-lg disabled:opacity-50"
            >
                {isLoading && input ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <Search className="h-5 w-5" />
                )}
            </button>
        </form>

        <div className="flex items-center justify-center gap-4">
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                multiple
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-oechsle-red transition-colors flex items-center gap-2"
            >
                <Upload className="h-3.5 w-3.5" />
                O Sube Archivos Locales
            </button>
        </div>
    </div>
  );
};
