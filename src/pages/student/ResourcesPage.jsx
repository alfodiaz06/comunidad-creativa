import NotificationChat from '../../components/shared/NotificationChat';
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSections, getSectionImages, DEFAULT_SECTIONS } from '../../lib/resources';
import { cloudinaryThumb, cloudinaryUrl } from '../../lib/cloudinary';
import { ChevronLeft, Check, Copy, FolderOpen, Image as ImageIcon, X } from 'lucide-react';

// ── Copy image — works with Cloudinary, not Drive (CORS blocked)
function isDriveUrl(url) {
  return url?.includes('drive.google.com') || url?.includes('googleapis.com');
}

async function copyImageToClipboard(url) {
  if (isDriveUrl(url)) {
    throw new Error('DRIVE_CORS');
  }
  
  // Unique URL to bypass ALL browser caches
  const sep = url.includes('?') ? '&' : '?';
  const uniqueUrl = `${url}${sep}nc=${Date.now()}${Math.floor(Math.random()*9999)}`;
  
  const response = await fetch(uniqueUrl, { cache: 'no-store', mode: 'cors', credentials: 'omit' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const buffer = await response.arrayBuffer();
  const mimeType = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
  const freshBlob = new Blob([buffer], { type: mimeType });
  const imageBitmap = await createImageBitmap(freshBlob);
  const offscreen = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
  const ctx = offscreen.getContext('2d');
  ctx.clearRect(0, 0, offscreen.width, offscreen.height);
  ctx.drawImage(imageBitmap, 0, 0);
  imageBitmap.close();
  const pngBlob = await offscreen.convertToBlob({ type: 'image/png', quality: 1.0 });
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
}

// ── Image Viewer fullscreen
function ImageViewer({ img, onClose, onPrev, onNext, total, current }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = cloudinaryUrl(img.imgUrl, 1600) || img.imgUrl;
  const copyUrl = cloudinaryUrl(img.imgUrl, 800) || img.imgUrl;

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onPrev, onNext, onClose]);

  const [copyError, setCopyError] = useState(false);

  const handleCopy = async () => {
    try {
      await copyImageToClipboard(copyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch(e) {
      if (e.message === 'DRIVE_CORS') {
        setCopyError(true);
        setTimeout(() => setCopyError(false), 3000);
      } else {
        console.warn('copy failed:', e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{background:'rgba(0,0,0,0.96)'}}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
        <button onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-sm">
          <X className="w-4 h-4"/> Cerrar
        </button>
        {img.title && <p className="text-slate-400 text-sm font-body truncate mx-4">{img.title}</p>}
        <button onClick={handleCopy}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-display font-semibold transition-all
            ${copied ? 'bg-jade-500/20 text-jade-400 border border-jade-500/20'
              : copyError ? 'bg-red-500/20 text-red-400 border border-red-500/20'
              : 'bg-brand-500/15 text-brand-300 border border-brand-500/20 hover:bg-brand-500/25'}`}>
          {copied ? <><Check className="w-4 h-4"/>¡Copiada!</>
            : copyError ? <>⚠️ Imagen de Drive — sube a Cloudinary desde Admin</>
            : <><Copy className="w-4 h-4"/>Copiar</>}
        </button>
      </div>

      {/* Image area */}
      <div className="flex-1 flex items-center justify-center relative px-16 pb-6 overflow-hidden">
        {/* Prev */}
        {current > 0 && (
          <button onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/8 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all">
            <ChevronLeft className="w-5 h-5 text-white"/>
          </button>
        )}

        <img
          src={fullUrl}
          alt={img.title||''}
          className="max-w-full max-h-full object-contain rounded-2xl"
          style={{maxHeight:'calc(100vh - 140px)', boxShadow:'0 25px 60px rgba(0,0,0,0.5)'}}
        />

        {/* Next */}
        {current < total-1 && (
          <button onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/8 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all">
            <ChevronLeft className="w-5 h-5 text-white rotate-180"/>
          </button>
        )}
      </div>

      {/* Bottom dots */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-5 flex-shrink-0">
          {Array.from({length:total}).map((_,i)=>(
            <div key={i} className={`rounded-full transition-all duration-300 ${i===current?'w-6 h-1.5 bg-brand-400':'w-1.5 h-1.5 bg-white/15'}`}/>
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
  const [preloaded, setPreloaded] = useState(null); // cached blob for instant copy
  const thumbUrl = img.thumbUrl || cloudinaryThumb(img.imgUrl, 400) || img.imgUrl;
  const fullUrl = cloudinaryUrl(img.imgUrl, 800) || img.imgUrl;
  const isDrive = fullUrl?.includes('drive.google.com') || fullUrl?.includes('googleapis.com');

  // Preload blob on hover so copy is instant
  const handleMouseEnter = async () => {
    if (isDrive || preloaded) return;
    try {
      const sep = fullUrl.includes('?') ? '&' : '?';
      const res = await fetch(`${fullUrl}${sep}nc=pre`, { cache: 'force-cache', mode: 'cors', credentials: 'omit' });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        setPreloaded(buf);
      }
    } catch { /* silent */ }
  };

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (isDrive) {
      setCopied('drive');
      setTimeout(() => setCopied(false), 3000);
      return;
    }
    setCopied('loading');
    try {
      if (preloaded) {
        // Use preloaded buffer — instant!
        const blob = new Blob([preloaded], { type: 'image/jpeg' });
        const bitmap = await createImageBitmap(blob);
        const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
        offscreen.getContext('2d').drawImage(bitmap, 0, 0);
        bitmap.close();
        const pngBlob = await offscreen.convertToBlob({ type: 'image/png', quality: 1.0 });
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
      } else {
        await copyImageToClipboard(fullUrl);
      }
      setCopied('done');
    } catch(err) {
      console.error('COPY ERROR:', err.message);
      // Fallback to full copy
      try { await copyImageToClipboard(fullUrl); setCopied('done'); }
      catch { setCopied('error'); }
    }
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="card p-0 overflow-hidden flex flex-col hover:border-brand-500/30 hover:scale-[1.02] transition-all duration-200" onMouseEnter={handleMouseEnter}>
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
            ${copied==='done' ? 'bg-jade-500/20 text-jade-400 border border-jade-500/20'
            : copied==='error' ? 'bg-red-500/20 text-red-400 border border-red-500/20'
            : copied==='loading' ? 'bg-brand-500/10 text-brand-300 border border-brand-500/20'
            : 'bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20'
            }`}>
          {copied==='loading' ? <><div className="w-3 h-3 rounded-full border-2 border-brand-400/30 border-t-brand-400 animate-spin"/>Copiando...</>
            : copied==='done' ? <><Check className="w-3 h-3"/>¡Copiada!</>
            : copied==='drive' ? <>⚠️ Sube desde Admin</>
            : copied==='error' ? <>✗ Error</>
            : <><Copy className="w-3 h-3"/>Copiar</>}
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
