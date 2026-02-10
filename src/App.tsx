
import React, { useState, useCallback, useEffect } from 'react';
import { UrlInput } from './components/UrlInput';
import { ImageCard } from './components/ImageCard';
import { MeasurementEditor } from './components/MeasurementEditor';
import { AiGeneratorModal } from './components/AiGeneratorModal';
import { VtexConfigModal } from './components/VtexConfigModal';
import { extractProductId, fetchProductData } from './services/vtexService';
import { urlToJpgBlob, processLocalFile, downloadBlob, downloadAllAsZip } from './services/imageService';
import { generateImageDescription } from './services/geminiService';
import { uploadImageToVtex } from './services/uploadService';
import { ProductImage, ProcessingStatus, VtexConfig } from './types';
import { Download, Sparkles, AlertCircle, Loader2, CheckSquare, Square, CloudUpload, CheckCircle, Wand2, Settings, ShoppingBag, Search as SearchIcon, MousePointer2, Lock, KeyRound } from 'lucide-react';

const ACCESS_PASSWORD = "CONTENIDO2026";

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === ACCESS_PASSWORD) {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-oechsle-gray flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10 border border-oechsle-border animate-fade-in">
        <div className="flex flex-col items-center mb-10">
          <div className="flex flex-col text-oechsle-red font-[900] tracking-tighter leading-none mb-6">
            <span className="text-5xl">oechsle</span>
            <span className="text-[10px] self-end tracking-[0.3em] opacity-80 mt-1 text-oechsle-black">CATALOG STUDIO</span>
          </div>
          <div className="bg-oechsle-gray p-4 rounded-full mb-4">
            <Lock className="w-8 h-8 text-oechsle-black" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-oechsle-black text-center">Acceso Restringido</h2>
          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest text-center">Ingresa la clave para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className={`block w-full pl-10 h-12 text-sm border-2 ${error ? 'border-oechsle-red animate-shake' : 'border-oechsle-gray'} rounded-xl focus:ring-oechsle-red focus:border-oechsle-red outline-none transition-all font-bold tracking-widest`}
              placeholder="••••••••••••"
              autoFocus
            />
          </div>
          
          <button
            type="submit"
            className="w-full h-12 bg-oechsle-red text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl hover:bg-oechsle-darkRed transition-all shadow-lg shadow-oechsle-red/20 active:scale-95"
          >
            Ingresar al Sistema
          </button>
        </form>

        <div className="mt-8 text-center">
          <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">© 2026 Oechsle Catalog Digital Unit</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('is_authenticated') === 'true';
  });
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [productName, setProductName] = useState<string>('');
  const [currentSkuId, setCurrentSkuId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const [vtexConfig, setVtexConfig] = useState<VtexConfig | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  const [editingImage, setEditingImage] = useState<ProductImage | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [generatorRefImage, setGeneratorRefImage] = useState<ProductImage | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('vtex_config');
    if (saved) {
      try {
        setVtexConfig(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('is_authenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('is_authenticated');
  };

  const handleSaveVtexConfig = (config: VtexConfig) => {
    setVtexConfig(config);
    localStorage.setItem('vtex_config', JSON.stringify(config));
  };

  const handleSearch = useCallback(async (url: string) => {
    setError(null);
    setImages([]);
    setSelectedIds(new Set());
    setProductName('');
    setStatus(ProcessingStatus.FETCHING_INFO);
    setUploadSuccess(false);

    try {
      const productId = extractProductId(url);
      if (!productId) {
        throw new Error("No se pudo detectar el ID del producto.");
      }
      setCurrentSkuId(productId);

      const data = await fetchProductData(productId);
      setProductName(data.productName);
      setStatus(ProcessingStatus.CONVERTING);
      
      const imagePromises = data.images.map(async (imgUrl): Promise<ProductImage | null> => {
        try {
            const { blob, width, height } = await urlToJpgBlob(imgUrl);
            const objectUrl = URL.createObjectURL(blob);
            return {
                id: crypto.randomUUID(),
                originalUrl: imgUrl,
                blob,
                objectUrl,
                status: 'success' as const,
                width,
                height,
            };
        } catch (e) { return null; }
      });

      const processed = await Promise.all(imagePromises);
      const validImages = processed.filter((img): img is ProductImage => img !== null);
      
      if (validImages.length === 0) throw new Error("No se pudieron procesar las imágenes.");

      // Auto-rename images based on SKU
      const renamedImages = validImages.map((img, index) => ({
        ...img,
        suggestedName: index === 0 ? productId : `${productId}_${index}`
      }));

      setImages(renamedImages);
      setStatus(ProcessingStatus.COMPLETE);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error.");
      setStatus(ProcessingStatus.ERROR);
    }
  }, []);

  const handleUpload = async (files: FileList) => {
      setError(null);
      setImages([]);
      setSelectedIds(new Set());
      setProductName('Archivos Locales');
      setStatus(ProcessingStatus.CONVERTING);
      setUploadSuccess(false);

      try {
          const fileArray = Array.from(files);
          const imagePromises = fileArray.map(async (file): Promise<ProductImage | null> => {
              try {
                  const { blob, width, height } = await processLocalFile(file);
                  const objectUrl = URL.createObjectURL(blob);
                  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                  return {
                      id: crypto.randomUUID(),
                      originalUrl: 'local-file',
                      blob,
                      objectUrl,
                      status: 'success' as const,
                      suggestedName: baseName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase(),
                      width,
                      height,
                  };
              } catch (e) { return null; }
          });

          const processed = await Promise.all(imagePromises);
          const validImages = processed.filter((img): img is ProductImage => img !== null);
          if (validImages.length === 0) throw new Error("Error al procesar archivos.");
          setImages(validImages);
          setStatus(ProcessingStatus.COMPLETE);
      } catch (err: any) {
          setError("Error procesando archivos.");
          setStatus(ProcessingStatus.ERROR);
      }
  };

  const handleUploadToServer = async () => {
    if (!vtexConfig) {
        setIsConfigOpen(true);
        setError("Configura las credenciales de VTEX primero.");
        return;
    }

    const imagesToUpload = selectedIds.size > 0 ? images.filter(img => selectedIds.has(img.id)) : images;
    if (imagesToUpload.length === 0) return;
    
    setIsUploading(true);
    let successCount = 0;
    let lastErrorMsg = "";

    for (const img of imagesToUpload) {
        const result = await uploadImageToVtex(img, currentSkuId, vtexConfig);
        if (result.success) {
            successCount++;
        } else {
            lastErrorMsg = result.message || "Fallo desconocido";
        }
    }

    setIsUploading(false);
    if (successCount === imagesToUpload.length) {
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
    } else {
        setError(`Error: ${lastErrorMsg}`);
    }
  };

  const handleAnalyzeAll = async () => {
    const allIds = new Set(images.map(i => i.id));
    setAnalyzingIds(allIds);
    const results = await Promise.all(images.map(async (img) => {
        if (img.blob) {
            const name = await generateImageDescription(img.blob);
            return { id: img.id, name };
        }
        return null;
    }));
    setImages(prev => prev.map(img => {
        const res = results.find(r => r?.id === img.id);
        return res ? { ...img, suggestedName: res.name } : img;
    }));
    setAnalyzingIds(new Set());
  };

  const handleAnalyzeSingle = async (image: ProductImage) => {
      setAnalyzingIds(prev => new Set(prev).add(image.id));
      if (image.blob) {
          const name = await generateImageDescription(image.blob);
          setImages(prev => prev.map(img => img.id === image.id ? { ...img, suggestedName: name } : img));
      }
      setAnalyzingIds(prev => { const next = new Set(prev); next.delete(image.id); return next; });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(selectedIds.size === images.length ? new Set() : new Set(images.map(i => i.id)));
  };

  const handleSaveEditedImage = (newBlob: Blob) => {
    if (!editingImage) return;
    if (editingImage.objectUrl) URL.revokeObjectURL(editingImage.objectUrl);
    const newUrl = URL.createObjectURL(newBlob);
    setImages(prev => prev.map(img => img.id === editingImage.id ? { ...img, blob: newBlob, objectUrl: newUrl } : img));
    setEditingImage(null);
  };

  const handleAddAiImageToGallery = (blob: Blob, prompt: string, width?: number, height?: number) => {
    const id = crypto.randomUUID();
    const objectUrl = URL.createObjectURL(blob);
    const name = prompt.substring(0, 20).toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newImage: ProductImage = {
        id,
        originalUrl: 'ai-generated',
        blob,
        objectUrl,
        status: 'success',
        suggestedName: `ai-${name}`,
        width: width || 1024,
        height: height || 1024
    };
    setImages(prev => [newImage, ...prev]);
    setIsGeneratorOpen(false);
    setGeneratorRefImage(null);
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Promo bar like Oechsle */}
      <div className="bg-black text-white text-[10px] font-bold text-center py-1 tracking-[0.15em] uppercase">
        Isométrico + Ai
      </div>

      {/* Main Oechsle Header */}
      <header className="bg-oechsle-red h-[70px] flex items-center sticky top-0 z-40 px-4">
        <div className="max-w-[1280px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex flex-col text-white font-[900] tracking-tighter leading-none">
              <span className="text-3xl">oechsle</span>
              <span className="text-[10px] self-end tracking-widest opacity-80 mt-1">CATALOG STUDIO</span>
            </div>
            
            <div className="hidden lg:flex items-center gap-6 text-white text-xs font-bold uppercase tracking-wider">
               <span className="cursor-pointer hover:underline">Imágenes</span>
               <span className="cursor-pointer hover:underline">Sincronización</span>
               <span className="cursor-pointer hover:underline">IA Tools</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button 
                onClick={() => setIsConfigOpen(true)}
                className="bg-white/20 hover:bg-white/30 p-2.5 rounded-full text-white transition-all border border-white/10"
                title="VTEX API Config"
             >
                <Settings className="h-5 w-5" />
             </button>
             <button 
                onClick={handleLogout}
                className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-white text-[10px] font-black uppercase tracking-widest border border-white/20 transition-all"
                title="Cerrar Sesión"
             >
                Cerrar
             </button>
             <div className="h-8 w-px bg-white/20 mx-2"></div>
             <div className="flex flex-col items-end text-white leading-none">
                <span className="text-[10px] font-bold opacity-70">CUENTA</span>
                <span className="text-xs font-bold uppercase mt-0.5">{vtexConfig?.accountName || 'Oechsle'}</span>
             </div>
             <ShoppingBag className="h-6 w-6 text-white" />
          </div>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-4 py-12">
        {/* Search / Entry Section */}
        <section className="mb-16">
          <div className="bg-oechsle-gray p-8 rounded-lg">
             <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl font-extrabold uppercase tracking-tight text-oechsle-black mb-2">Editor y Extractor de Catálogo</h2>
                <p className="text-sm text-gray-600 mb-8 font-medium italic">Optimiza tus imágenes para VTEX con un solo click.</p>
                <UrlInput onSearch={handleSearch} onUpload={handleUpload} isLoading={status !== ProcessingStatus.IDLE && status !== ProcessingStatus.COMPLETE && status !== ProcessingStatus.ERROR} />
             </div>
          </div>
        </section>

        {/* Messaging Area */}
        {error && (
            <div className="mb-8 p-4 border border-oechsle-red bg-oechsle-red/5 flex items-center gap-3 animate-fade-in rounded">
                <AlertCircle className="h-5 w-5 text-oechsle-red" />
                <span className="text-sm font-bold text-oechsle-red">{error}</span>
            </div>
        )}
        
        {uploadSuccess && (
            <div className="mb-8 p-4 border border-green-600 bg-green-50 flex items-center gap-3 animate-fade-in rounded">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-bold text-green-600 uppercase tracking-widest">Sincronización VTEX Exitosa</span>
            </div>
        )}

        {/* Gallery Section */}
        {images.length > 0 && (
          <div className="animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6 border-b border-oechsle-border pb-6">
              <div>
                <h3 className="text-xl font-black uppercase text-oechsle-black tracking-tighter">{productName}</h3>
                <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{images.length} Archivos</span>
                    {currentSkuId && (
                      <span className="text-[10px] font-black bg-oechsle-black text-white px-2 py-1 uppercase tracking-widest">
                        SKU: {currentSkuId}
                      </span>
                    )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                 <button 
                    onClick={selectAll} 
                    className="px-6 py-2.5 bg-white border border-oechsle-border text-[10px] font-black uppercase tracking-widest hover:border-oechsle-black hover:bg-gray-50 transition-all rounded-full shadow-sm flex items-center gap-2"
                 >
                    <MousePointer2 className="w-3.5 h-3.5" />
                    {selectedIds.size === images.length ? 'Deseleccionar' : 'Seleccionar Todo'}
                 </button>

                 <button 
                    onClick={handleAnalyzeAll} 
                    disabled={analyzingIds.size > 0} 
                    className="px-6 py-2.5 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 text-[10px] font-black uppercase tracking-widest transition-all rounded-full shadow-sm flex items-center gap-2"
                 >
                    {analyzingIds.size > 0 ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Sparkles className="w-3.5 h-3.5" />}
                    Renombrar IA
                </button>

                <button 
                    onClick={handleUploadToServer} 
                    disabled={isUploading} 
                    className="px-6 py-2.5 bg-oechsle-red text-white hover:bg-oechsle-darkRed text-[10px] font-black uppercase tracking-widest transition-all rounded-full shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <CloudUpload className="w-3.5 h-3.5" />}
                    Subir a VTEX
                </button>
                
                <button 
                  onClick={() => setIsGeneratorOpen(true)}
                  className="px-6 py-2.5 bg-oechsle-black text-white hover:bg-gray-800 text-[10px] font-black uppercase tracking-widest transition-all rounded-full shadow-md flex items-center gap-2"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Crear Variación
                </button>

                <button onClick={selectedIds.size > 0 ? (async () => {
                    const selected = images.filter(img => selectedIds.has(img.id));
                    await downloadAllAsZip(selected, 'oechsle_cat_export');
                }) : (async () => {
                    await downloadAllAsZip(images, 'oechsle_cat_export');
                })} className="px-6 py-2.5 bg-white border border-oechsle-border text-oechsle-black hover:bg-gray-50 text-[10px] font-black uppercase tracking-widest transition-all rounded-full shadow-sm flex items-center gap-2">
                    <Download className="w-3.5 h-3.5" />
                    Descargar {selectedIds.size > 0 ? `(${selectedIds.size})` : 'ZIP'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
              {images.map((img) => (
                <ImageCard 
                    key={img.id} 
                    image={img} 
                    selected={selectedIds.has(img.id)}
                    onToggleSelect={() => toggleSelect(img.id)}
                    onDownload={(image) => {
                        if (image.blob) {
                            const name = image.suggestedName ? `${image.suggestedName}.jpg` : `img-${image.id.substring(0,4)}.jpg`;
                            downloadBlob(image.blob, name);
                        }
                    }}
                    onAnalyze={handleAnalyzeSingle}
                    onEdit={(i) => setEditingImage(i)}
                    onGenerateFrom={(i) => { setGeneratorRefImage(i); setIsGeneratorOpen(true); }}
                    isAnalyzing={analyzingIds.has(img.id)}
                />
              ))}
            </div>
          </div>
        )}

        {status !== ProcessingStatus.IDLE && images.length === 0 && !error && (
            <div className="py-24 flex flex-col items-center justify-center">
                 <div className="relative mb-6">
                    <Loader2 className="h-12 w-12 text-oechsle-red animate-spin" />
                    <ShoppingBag className="h-5 w-5 text-oechsle-black absolute inset-0 m-auto" />
                 </div>
                 <h3 className="text-sm font-black uppercase tracking-[0.2em] text-oechsle-black">Procesando Activos Visuales</h3>
                 <p className="text-gray-400 mt-2 text-xs font-medium uppercase tracking-widest">Ajustando a estándares de catálogo oficial</p>
            </div>
        )}
      </main>

      {/* Footer minimalista Oechsle */}
      <footer className="bg-oechsle-gray mt-20 py-12 border-t border-oechsle-border">
         <div className="max-w-[1280px] mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col font-black tracking-tighter leading-none opacity-40">
              <span className="text-2xl">oechsle</span>
              <span className="text-[8px] self-end tracking-widest mt-0.5 uppercase">2026</span>
            </div>
            <div className="flex gap-10 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
               <span className="hover:text-oechsle-red cursor-pointer">Soporte API</span>
               <span className="hover:text-oechsle-red cursor-pointer">Privacidad</span>
               <span className="hover:text-oechsle-red cursor-pointer">VTEX Partner</span>
            </div>
         </div>
      </footer>

      {editingImage && <MeasurementEditor image={editingImage} onClose={() => setEditingImage(null)} onSave={handleSaveEditedImage} />}
      {isGeneratorOpen && (
        <AiGeneratorModal 
            referenceImage={generatorRefImage} 
            onClose={() => { setIsGeneratorOpen(false); setGeneratorRefImage(null); }} 
            onAddToGallery={handleAddAiImageToGallery}
        />
      )}
      {isConfigOpen && (
          <VtexConfigModal 
            initialConfig={vtexConfig} 
            onClose={() => setIsConfigOpen(false)} 
            onSave={handleSaveVtexConfig} 
          />
      )}
    </div>
  );
}
