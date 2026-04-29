import NotificationChat from '../../components/shared/NotificationChat';
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSections, getSectionImages, DEFAULT_SECTIONS } from '../../lib/resources';
import { cloudinaryThumb, cloudinaryUrl } from '../../lib/cloudinary';
import { ChevronLeft, Check, Copy, FolderOpen, Image as ImageIcon, X } from 'lucide-react';

// ── Image Viewer fullscreen
function ImageViewer({ img, onClose, onPrev, onNext, total, current }) {
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onPrev, onNext, onClose]);

  const fullUrl = cloudinaryUrl(img.imgUrl, 1600) || img.imgUrl;

  return (
    <div className="fixed inset-0 z-50 bg-black/97 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <button onClick={onClose} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <X className="w-4 h-4"/> Cerrar
        </button>
        {img.title && <p className="text-slate-500 text-sm truncate mx-4">{img.title}</p>}
        <span className="text-slate-600 text-xs font-mono">{current+1}/{total}</span>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        {current > 0 && (
          <button onClick={onPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-5 h-5 text-white"/>
          </button>
        )}
        <img
          src={fullUrl}
          alt={img.title||''}
          className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
          style={{maxHeight:'calc(100vh - 120px)'}}
        />
        {current < total-1 && (
          <button onClick={onNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-5 h-5 text-white rotate-180"/>
          </button>
        )}
      </div>

      {/* Dots */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-3 flex-shrink-0">
          {Array.from({length:total}).map((_,i)=>(
            <div key={i} className={`rounded-full transition-all ${i===current?'w-5 h-1.5 bg-brand-400':'w-1.5 h-1.5 bg-white/20'}`}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Image Card
function ImageCard({ img, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const thumbUrl = img.thumbUrl || cloudinaryThumb(img.imgUrl, 400) || img.imgUrl;
  const fullUrl = cloudinaryUrl(img.imgUrl, 1200) || img.imgUrl;

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      // Draw to canvas and copy as PNG — works with Cloudinary (no CORS issues)
      const image = new Image();
      image.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = fullUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext('2d').drawImage(image, 0, 0);
      await new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
          await navigator.clipboard.write([new ClipboardItem({'image/png': blob})]);
          resolve();
        }, 'image/png', 1.0);
      });
    } catch(err) {
      // Fallback: fetch blob directly
      try {
        const res = await fetch(fullUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([new ClipboardItem({[blob.type]: blob})]);
      } catch {
        window.open(fullUrl, '_blank');
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card p-0 overflow-hidden flex flex-col hover:border-brand-500/30 hover:scale-[1.02] transition-all duration-200">
      <button onClick={onClick} className="aspect-square bg-obsidian-700 relative flex items-center justify-center w-full overflow-hidden group cursor-pointer">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin"/>
          </div>
        )}
        <img
          src={thumbUrl}
          alt={img.title||''}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${loaded?'opacity-100':'opacity-0'}`}
          onLoad={()=>setLoaded(true)}
          onError={e=>{e.target.style.display='none';}}
        />
        <div className="absolute inset-0 bg-brand-500/0 group-hover:bg-brand-500/10 transition-colors"/>
      </button>
      <div className="px-2.5 py-2 flex items-center gap-2">
        <span className="text-xs font-body text-slate-400 truncate flex-1">{img.title||'Imagen'}</span>
        <button onClick={handleCopy}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-display font-semibold flex-shrink-0 transition-all
            ${copied
              ? 'bg-jade-500/20 text-jade-400 border border-jade-500/20'
              : 'bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20'
            }`}>
          {copied ? <><Check className="w-3 h-3"/>¡Copiada!</> : <><Copy className="w-3 h-3"/>Copiar</>}
        </button>
      </div>
    </div>
  );
}

// ── MAIN
export default function ResourcesPage() {
  const { profile } = useAuth();
  const [sections, setSections] = useState([]);
  const [selected, setSelected] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgsLoading, setImgsLoading] = useState(false);
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let secs = await getSections();
        if (secs.length === 0) {
          secs = DEFAULT_SECTIONS.map((s,i) => ({...s, id:s.slug, order:i}));
        }
        setSections(secs);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSelectSection = async (sec) => {
    setSelected(sec);
    setImgsLoading(true);
    try {
      const imgs = await getSectionImages(sec.id);
      setImages(imgs);
    } finally { setImgsLoading(false); }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-strong border-b border-white/5 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {selected ? (
            <button onClick={()=>{setSelected(null);setImages([]);}}
              className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm">
              <ChevronLeft className="w-4 h-4"/> Recursos
            </button>
          ) : (
            <Link to="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm">
              <ChevronLeft className="w-4 h-4"/> Dashboard
            </Link>
          )}
          {selected && <>
            <div className="w-px h-4 bg-white/10"/>
            <span className="font-display font-semibold text-white text-sm">{selected.emoji} {selected.name}</span>
          </>}
        </div>
        <div className="w-8 h-8 rounded-full bg-brand-500/15 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-xs">
          {(profile?.displayName||'E')[0].toUpperCase()}
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {!selected ? (
          <>
            <div className="mb-6 mt-2">
              <h2 className="font-display text-xl font-bold text-white">📁 Secciones de referencia</h2>
              <p className="text-slate-500 text-sm mt-1">Selecciona una carpeta para ver las imágenes</p>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {[1,2,3,4,5].map(i=><div key={i} className="card h-28 shimmer-loading"/>)}
              </div>
            ) : sections.length === 0 ? (
              <div className="card text-center py-20">
                <FolderOpen className="w-12 h-12 text-slate-700 mx-auto mb-3"/>
                <p className="text-slate-500 text-sm">Próximamente</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 animate-slide-up">
                {sections.map(sec=>(
                  <button key={sec.id} onClick={()=>handleSelectSection(sec)}
                    className="card hover:bg-obsidian-700/60 hover:border-brand-500/20 hover:scale-[1.02] transition-all duration-200 text-left cursor-pointer">
                    <div className="text-3xl mb-3">{sec.emoji}</div>
                    <h3 className="font-display font-semibold text-white text-sm">{sec.name}</h3>
                    {sec.description&&<p className="text-xs text-slate-500 mt-1 line-clamp-2">{sec.description}</p>}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="mt-2">
            <p className="text-slate-500 text-sm mb-5">
              {imgsLoading ? 'Cargando...' : `${images.length} imagen${images.length!==1?'es':''} · Toca para ver · Botón Copiar para copiar`}
            </p>
            {imgsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {[1,2,3,4,5,6].map(i=><div key={i} className="card aspect-square shimmer-loading"/>)}
              </div>
            ) : images.length === 0 ? (
              <div className="card text-center py-16">
                <ImageIcon className="w-10 h-10 text-slate-700 mx-auto mb-3"/>
                <p className="text-slate-500 text-sm">Sin imágenes todavía</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 animate-slide-up">
                {images.map((img,idx)=>(
                  <ImageCard key={img.id||idx} img={img} onClick={()=>setViewer({index:idx})}/>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {viewer && images[viewer.index] && (
        <ImageViewer
          img={images[viewer.index]}
          current={viewer.index}
          total={images.length}
          onClose={()=>setViewer(null)}
          onPrev={()=>setViewer(v=>({index:Math.max(0,v.index-1)}))}
          onNext={()=>setViewer(v=>({index:Math.min(images.length-1,v.index+1)}))}
        />
      )}
      <NotificationChat/>
    </div>
  );
}
