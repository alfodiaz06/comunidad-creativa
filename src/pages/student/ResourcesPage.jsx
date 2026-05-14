import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSections, getSectionImages, getTextItems, cloudinaryThumb, cloudinaryUrl } from '../../lib/resources';
import { ChevronLeft, Check, Copy, FolderOpen, Image as ImageIcon, X, FileText, Link as LinkIcon, Type } from 'lucide-react';

// ── Copy image to clipboard
async function copyImageToClipboard(url) {
  if (url?.includes('drive.google.com') || url?.includes('googleapis.com')) throw new Error('DRIVE_CORS');
  const sep = url.includes('?') ? '&' : '?';
  const uniqueUrl = `${url}${sep}nc=${Date.now()}${Math.floor(Math.random()*9999)}`;
  const response = await fetch(uniqueUrl, { cache: 'no-store', mode: 'cors', credentials: 'omit' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = await response.arrayBuffer();
  const mimeType = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
  const freshBlob = new Blob([buffer], { type: mimeType });
  const imageBitmap = await createImageBitmap(freshBlob);
  const offscreen = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
  offscreen.getContext('2d').drawImage(imageBitmap, 0, 0);
  imageBitmap.close();
  const pngBlob = await offscreen.convertToBlob({ type: 'image/png', quality: 1.0 });
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
}

// ── Image Viewer
function ImageViewer({ img, onClose, onPrev, onNext, total, current }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = cloudinaryUrl(img.imgUrl, 1600) || img.imgUrl;
  const copyUrl = cloudinaryUrl(img.imgUrl, 800) || img.imgUrl;

  useEffect(() => {
    const h = (e) => { if(e.key==='ArrowLeft') onPrev(); if(e.key==='ArrowRight') onNext(); if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onPrev, onNext, onClose]);

  const handleCopy = async () => {
    try { await copyImageToClipboard(copyUrl); setCopied(true); setTimeout(()=>setCopied(false),2000); } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{background:'rgba(0,0,0,0.96)'}}>
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
        <button onClick={onClose} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm">
          <X className="w-4 h-4"/> Cerrar
        </button>
        {img.title && <p className="text-slate-400 text-sm truncate mx-4">{img.title}</p>}
        <button onClick={handleCopy}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-display font-semibold transition-all
            ${copied?'bg-jade-500/20 text-jade-400 border border-jade-500/20':'bg-brand-500/15 text-brand-300 border border-brand-500/20 hover:bg-brand-500/25'}`}>
          {copied?<><Check className="w-4 h-4"/>¡Copiada!</>:<><Copy className="w-4 h-4"/>Copiar</>}
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center relative px-16 pb-6 overflow-hidden">
        {current > 0 && <button onClick={onPrev} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/8 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all"><ChevronLeft className="w-5 h-5 text-white"/></button>}
        <img src={fullUrl} alt={img.title||''} className="max-w-full max-h-full object-contain rounded-2xl" style={{maxHeight:'calc(100vh - 140px)',boxShadow:'0 25px 60px rgba(0,0,0,0.5)'}}/>
        {current < total-1 && <button onClick={onNext} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/8 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all"><ChevronLeft className="w-5 h-5 text-white rotate-180"/></button>}
      </div>
      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-5">
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
  const [preloaded, setPreloaded] = useState(null);
  const thumbUrl = img.thumbUrl || cloudinaryThumb(img.imgUrl, 400) || img.imgUrl;
  const fullUrl = cloudinaryUrl(img.imgUrl, 800) || img.imgUrl;
  const isDrive = fullUrl?.includes('drive.google.com') || fullUrl?.includes('googleapis.com');

  const handleMouseEnter = async () => {
    if (isDrive || preloaded) return;
    try {
      const sep = fullUrl.includes('?') ? '&' : '?';
      const res = await fetch(`${fullUrl}${sep}nc=pre`, { cache: 'force-cache', mode: 'cors', credentials: 'omit' });
      if (res.ok) setPreloaded(await res.arrayBuffer());
    } catch {}
  };

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (isDrive) { setCopied('drive'); setTimeout(()=>setCopied(false),3000); return; }
    setCopied('loading');
    try {
      if (preloaded) {
        const blob = new Blob([preloaded], { type: 'image/jpeg' });
        const bitmap = await createImageBitmap(blob);
        const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
        offscreen.getContext('2d').drawImage(bitmap, 0, 0);
        bitmap.close();
        const pngBlob = await offscreen.convertToBlob({ type: 'image/png', quality: 1.0 });
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
      } else { await copyImageToClipboard(fullUrl); }
      setCopied('done');
    } catch { setCopied('error'); }
    setTimeout(()=>setCopied(false),3000);
  };

  return (
    <div className="card p-0 overflow-hidden flex flex-col hover:border-brand-500/30 hover:scale-[1.02] transition-all duration-200" onMouseEnter={handleMouseEnter}>
      <button onClick={onClick} className="aspect-square bg-obsidian-700 relative flex items-center justify-center w-full overflow-hidden group cursor-pointer">
        {!loaded && <div className="absolute inset-0 flex items-center justify-center"><div className="w-5 h-5 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin"/></div>}
        <img src={thumbUrl} alt={img.title||''} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${loaded?'opacity-100':'opacity-0'}`} onLoad={()=>setLoaded(true)} onError={e=>{e.target.style.display='none';}}/>
        <div className="absolute inset-0 bg-brand-500/0 group-hover:bg-brand-500/10 transition-colors"/>
      </button>
      <div className="px-2.5 py-2 flex items-center gap-2">
        <span className="text-xs font-body text-slate-400 truncate flex-1">{img.title||'Imagen'}</span>
        <button onClick={handleCopy}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-display font-semibold flex-shrink-0 transition-all
            ${copied==='loading'?'bg-brand-500/10 text-brand-400 border border-brand-500/20'
              :copied==='done'?'bg-jade-500/20 text-jade-400 border border-jade-500/20'
              :copied==='drive'?'bg-red-500/20 text-red-400 border border-red-500/20'
              :copied==='error'?'bg-red-500/20 text-red-400 border border-red-500/20'
              :'bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20'}`}>
          {copied==='loading'?<><div className="w-3 h-3 rounded-full border-2 border-brand-400/30 border-t-brand-400 animate-spin"/>Copiando...</>
            :copied==='done'?<><Check className="w-3 h-3"/>¡Copiada!</>
            :copied==='drive'?<>⚠️ Sube desde Admin</>
            :copied==='error'?<>✗ Error</>
            :<><Copy className="w-3 h-3"/>Copiar</>}
        </button>
      </div>
    </div>
  );
}

// ── MAIN
export default function ResourcesPage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState('texts');
  const [texts, setTexts] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgsLoading, setImgsLoading] = useState(false);
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [t, s] = await Promise.all([getTextItems(), getSections()]);
        setTexts(t);
        setSections(s);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSelectSection = async (sec) => {
    setSelectedSection(sec);
    setImgsLoading(true);
    try { setImages(await getSectionImages(sec.id)); } finally { setImgsLoading(false); }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-strong border-b border-white/5 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {selectedSection ? (
            <button onClick={()=>{setSelectedSection(null);setImages([]);}} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm">
              <ChevronLeft className="w-4 h-4"/> Recursos
            </button>
          ) : (
            <Link to="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm">
              <ChevronLeft className="w-4 h-4"/> Dashboard
            </Link>
          )}
          {selectedSection && <>
            <div className="w-px h-4 bg-white/10"/>
            <span className="font-display font-semibold text-white text-sm">{selectedSection.emoji} {selectedSection.name}</span>
          </>}
          {!selectedSection && <span className="font-display font-bold text-white">Recursos</span>}
        </div>
        <div className="w-8 h-8 rounded-full bg-brand-500/15 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-xs">
          {(profile?.displayName||'E')[0].toUpperCase()}
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {!selectedSection ? (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-white/5 pb-1">
              <button onClick={()=>setTab('texts')}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-sm font-display font-semibold transition-all
                  ${tab==='texts'?'bg-obsidian-700 text-white border-b-2 border-brand-500':'text-slate-500 hover:text-slate-300'}`}>
                <Type className="w-4 h-4"/> Copys & URLs
              </button>
              <button onClick={()=>setTab('images')}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-sm font-display font-semibold transition-all
                  ${tab==='images'?'bg-obsidian-700 text-white border-b-2 border-brand-500':'text-slate-500 hover:text-slate-300'}`}>
                <ImageIcon className="w-4 h-4"/> Referencia Landings
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48"><div className="w-8 h-8 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin"/></div>
            ) : tab === 'texts' ? (
              /* Copys & URLs */
              texts.length === 0 ? (
                <div className="card text-center py-16">
                  <Type className="w-10 h-10 text-slate-700 mx-auto mb-3"/>
                  <p className="text-slate-500 text-sm">Próximamente</p>
                </div>
              ) : (
                <div className="space-y-3 animate-slide-up">
                  {texts.map(item => (
                    <div key={item.id} className="card flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-accent-500/15 border border-accent-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {item.type==='url'?<LinkIcon className="w-4 h-4 text-accent-400"/>:<FileText className="w-4 h-4 text-accent-400"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-white text-sm mb-1">{item.title}</p>
                        <p className="text-xs text-slate-300 font-mono break-all leading-relaxed select-text">{item.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* Referencia Landings */
              sections.length === 0 ? (
                <div className="card text-center py-16">
                  <FolderOpen className="w-10 h-10 text-slate-700 mx-auto mb-3"/>
                  <p className="text-slate-500 text-sm">Próximamente</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 animate-slide-up">
                  {sections.map(sec => (
                    <button key={sec.id} onClick={()=>handleSelectSection(sec)}
                      className="card hover:bg-obsidian-700/60 hover:border-brand-500/20 hover:scale-[1.02] transition-all duration-200 text-left cursor-pointer">
                      <div className="text-3xl mb-3">{sec.emoji}</div>
                      <h3 className="font-display font-semibold text-white text-sm">{sec.name}</h3>
                      {sec.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{sec.description}</p>}
                    </button>
                  ))}
                </div>
              )
            )}
          </>
        ) : (
          /* Image grid inside section */
          <div className="mt-2">
            <p className="text-slate-500 text-sm mb-5">{imgsLoading?'Cargando...':`${images.length} imagen${images.length!==1?'es':''}`}</p>
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
        <ImageViewer img={images[viewer.index]} current={viewer.index} total={images.length}
          onClose={()=>setViewer(null)}
          onPrev={()=>setViewer(v=>({index:Math.max(0,v.index-1)}))}
          onNext={()=>setViewer(v=>({index:Math.min(images.length-1,v.index+1)}))}/>
      )}
    </div>
  );
}
