import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSections, getSectionImages, driveToImg } from '../../lib/resources';
import { ChevronLeft, Download, Copy, Check, ExternalLink, FolderOpen, Image as ImageIcon } from 'lucide-react';

function ImageViewer({ img, onClose, onPrev, onNext, total, current }) {
  const [copied, setCopied] = useState(false);
  const imgUrl = img.imgUrl || driveToImg(img.driveUrl);

  const copyImage = async () => {
    try {
      const res = await fetch(imgUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: open in new tab
      window.open(imgUrl, '_blank');
    }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onPrev, onNext, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col" onClick={onClose}>
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 flex-shrink-0" onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ChevronLeft className="w-4 h-4"/> Cerrar
        </button>
        <div className="text-slate-500 text-sm font-mono">{current + 1} / {total}</div>
        <div className="flex gap-2">
          <a href={img.driveUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-semibold bg-white/10 text-slate-300 hover:bg-white/20 transition-all">
            <ExternalLink className="w-3.5 h-3.5"/> Abrir en Drive
          </a>
          <button onClick={copyImage}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all
              ${copied ? 'bg-jade-500/20 text-jade-400' : 'bg-brand-500/15 text-brand-300 hover:bg-brand-500/25'}`}>
            {copied ? <><Check className="w-3.5 h-3.5"/>Copiada</> : <><Copy className="w-3.5 h-3.5"/>Copiar imagen</>}
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center p-4 relative" onClick={e=>e.stopPropagation()}>
        {/* Prev */}
        {current > 0 && (
          <button onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10">
            <ChevronLeft className="w-5 h-5 text-white"/>
          </button>
        )}
        <img src={imgUrl} alt={img.title||''} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"/>
        {/* Next */}
        {current < total - 1 && (
          <button onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10">
            <ChevronLeft className="w-5 h-5 text-white rotate-180"/>
          </button>
        )}
      </div>

      {/* Bottom title */}
      {img.title && (
        <div className="p-4 text-center flex-shrink-0" onClick={e=>e.stopPropagation()}>
          <p className="text-slate-400 text-sm font-body">{img.title}</p>
        </div>
      )}
    </div>
  );
}

export default function ResourcesPage() {
  const { profile } = useAuth();
  const [sections, setSections] = useState([]);
  const [selected, setSelected] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgsLoading, setImgsLoading] = useState(false);
  const [viewer, setViewer] = useState(null); // { index }

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try { setSections(await getSections()); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const loadImages = useCallback(async (sectionId) => {
    setImgsLoading(true);
    try { setImages(await getSectionImages(sectionId)); }
    finally { setImgsLoading(false); }
  }, []);

  const handleSelectSection = async (sec) => {
    setSelected(sec);
    await loadImages(sec.id);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-strong border-b border-white/5 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selected ? (
            <button onClick={() => { setSelected(null); setImages([]); }}
              className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm">
              <ChevronLeft className="w-4 h-4"/>
              <span className="hidden sm:inline">Recursos</span>
            </button>
          ) : (
            <Link to="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm">
              <ChevronLeft className="w-4 h-4"/> Dashboard
            </Link>
          )}
          <div className="w-px h-4 bg-white/10"/>
          <div>
            <h1 className="font-display font-bold text-white text-sm sm:text-base">
              {selected ? (
                <span className="flex items-center gap-2">{selected.emoji} {selected.name}</span>
              ) : 'Recursos'}
            </h1>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-brand-500/15 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-xs">
          {(profile?.displayName||'E')[0].toUpperCase()}
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {!selected ? (
          // Section grid
          <>
            <div className="mb-6 mt-2">
              <h2 className="font-display text-lg font-bold text-white">📁 Secciones de referencia</h2>
              <p className="text-slate-500 text-sm mt-1">Selecciona una sección para ver las imágenes de referencia</p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin"/>
              </div>
            ) : sections.length === 0 ? (
              <div className="card text-center py-20">
                <FolderOpen className="w-12 h-12 text-slate-700 mx-auto mb-3"/>
                <p className="text-slate-500 text-sm">Próximamente — el administrador está preparando los recursos</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 animate-slide-up">
                {sections.map(sec => (
                  <button key={sec.id} onClick={() => handleSelectSection(sec)}
                    className="card hover:bg-obsidian-700/60 hover:border-brand-500/20 transition-all text-left cursor-pointer">
                    <div className="text-3xl mb-3">{sec.emoji}</div>
                    <h3 className="font-display font-semibold text-white text-sm mb-1">{sec.name}</h3>
                    {sec.description && <p className="text-xs text-slate-500 line-clamp-2">{sec.description}</p>}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          // Images grid
          <div className="mt-2">
            <p className="text-slate-500 text-sm mb-5">
              {selected.description || 'Toca cualquier imagen para verla en grande y copiarla'}
            </p>
            {imgsLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin"/>
              </div>
            ) : images.length === 0 ? (
              <div className="card text-center py-16">
                <ImageIcon className="w-10 h-10 text-slate-700 mx-auto mb-3"/>
                <p className="text-slate-500 text-sm">Próximamente — imágenes en preparación</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 animate-slide-up">
                {images.map((img, idx) => (
                  <button key={img.id} onClick={() => setViewer({index:idx})}
                    className="card p-0 overflow-hidden group cursor-pointer hover:border-brand-500/30 transition-all text-left">
                    <div className="aspect-square bg-obsidian-700 relative">
                      <img src={img.imgUrl || driveToImg(img.driveUrl)} alt={img.title||`Imagen ${idx+1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e=>{e.target.style.display='none';}}/>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2">
                          <ExternalLink className="w-4 h-4 text-white"/>
                        </div>
                      </div>
                    </div>
                    {img.title && (
                      <div className="p-2">
                        <p className="text-xs font-body text-slate-400 truncate">{img.title}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image viewer */}
      {viewer && images[viewer.index] && (
        <ImageViewer
          img={images[viewer.index]}
          current={viewer.index}
          total={images.length}
          onClose={() => setViewer(null)}
          onPrev={() => setViewer(v => ({index: Math.max(0, v.index-1)}))}
          onNext={() => setViewer(v => ({index: Math.min(images.length-1, v.index+1)}))}
        />
      )}
    </div>
  );
}
