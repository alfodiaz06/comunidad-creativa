import { useState, useEffect, useCallback } from 'react';
import AdminNav from '../../components/admin/AdminNav';
import {
  getSections, saveSection, deleteSection,
  getSectionImages, saveImage, deleteImage, getAllImages, driveToImg
} from '../../lib/resources';
import { Plus, Pencil, Trash2, X, Check, ChevronLeft, Image, FolderOpen, GripVertical, ExternalLink } from 'lucide-react';

// ── Section Modal
function SectionModal({ section, sections, onClose, onSave }) {
  const [form, setForm] = useState({
    name: section?.name || '',
    emoji: section?.emoji || '📁',
    description: section?.description || '',
    order: section?.order ?? sections.length,
  });
  const [loading, setLoading] = useState(false);
  const emojis = ['📁','🎯','⭐','🏆','💡','🔥','📸','✨','🎨','📊','💬','❓','🔑','🛠️','📋'];
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-display font-semibold text-white">{section ? '✏️ Editar sección' : '➕ Nueva sección'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Emoji</label>
            <div className="flex flex-wrap gap-2">
              {emojis.map(e => (
                <button key={e} onClick={() => setForm(f=>({...f,emoji:e}))}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all
                    ${form.emoji===e?'bg-brand-500/30 border border-brand-500':'bg-obsidian-700 border border-white/5 hover:border-white/20'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Nombre de la sección</label>
            <input className="input-field" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Hero, Oferta, Testimonios..."/>
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Descripción (opcional)</label>
            <input className="input-field" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Breve descripción de esta sección"/>
          </div>
        </div>
        <div className="p-5 border-t border-white/5 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={async()=>{if(!form.name)return;setLoading(true);try{await onSave({...section,...form});}finally{setLoading(false);}}}
            disabled={loading||!form.name} className="btn-primary flex items-center gap-2">
            {loading?<div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>:<Check className="w-4 h-4"/>}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Image Modal
function ImageModal({ sectionId, image, imageCount, onClose, onSave }) {
  const [form, setForm] = useState({
    title: image?.title || '',
    driveUrl: image?.driveUrl || '',
    order: image?.order ?? imageCount,
  });
  const [preview, setPreview] = useState(image?.driveUrl ? driveToImg(image.driveUrl) : '');
  const [loading, setLoading] = useState(false);

  const handleUrlChange = (val) => {
    setForm(f=>({...f,driveUrl:val}));
    setPreview(driveToImg(val));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-display font-semibold text-white">{image?'✏️ Editar imagen':'🖼️ Agregar imagen'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5"/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Título (opcional)</label>
            <input className="input-field" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Ej: Referencia Hero 1"/>
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Link de Google Drive</label>
            <input className="input-field font-mono text-sm" value={form.driveUrl}
              onChange={e=>handleUrlChange(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."/>
            <p className="text-xs text-slate-500 mt-1.5">Pega el link de Drive. Asegúrate que sea público ("Cualquiera con el enlace").</p>
          </div>
          {/* Preview */}
          {preview && (
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Vista previa</label>
              <div className="relative rounded-xl overflow-hidden bg-obsidian-700 border border-white/5">
                <img src={preview} alt="preview" className="w-full max-h-48 object-contain"
                  onError={e=>{e.target.style.display='none';}}/>
                <a href={form.driveUrl} target="_blank" rel="noopener noreferrer"
                  className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5"/>
                </a>
              </div>
            </div>
          )}
        </div>
        <div className="p-5 border-t border-white/5 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={async()=>{if(!form.driveUrl)return;setLoading(true);try{await onSave(sectionId,{...image,...form,imgUrl:driveToImg(form.driveUrl)});}finally{setLoading(false);}}}
            disabled={loading||!form.driveUrl} className="btn-primary flex items-center gap-2">
            {loading?<div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>:<Check className="w-4 h-4"/>}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Section Detail
function SectionDetail({ section, onBack, onRefresh }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    try { setImages(await getSectionImages(section.id)); }
    finally { setLoading(false); }
  }, [section.id]);

  useEffect(() => { loadImages(); }, [loadImages]);

  const handleSaveImage = async (sectionId, img) => {
    await saveImage(sectionId, img);
    await loadImages();
    setModal(null);
  };

  const handleDeleteImage = async (img) => {
    if (!confirm(`¿Eliminar "${img.title || 'esta imagen'}"?`)) return;
    await deleteImage(section.id, img.id);
    await loadImages();
  };

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-200 text-sm mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4"/> Volver a secciones
      </button>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{section.emoji}</span>
          <div>
            <h2 className="font-display text-xl font-bold text-white">{section.name}</h2>
            {section.description && <p className="text-slate-500 text-sm">{section.description}</p>}
            <p className="text-xs font-mono text-slate-600 mt-0.5">{images.length} imagen{images.length!==1?'es':''}</p>
          </div>
        </div>
        <button onClick={() => setModal({type:'image'})} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4"/> Agregar imagen
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-6 h-6 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin"/></div>
      ) : images.length === 0 ? (
        <div className="card text-center py-16">
          <Image className="w-10 h-10 text-slate-700 mx-auto mb-3"/>
          <p className="text-slate-500 text-sm">Sin imágenes todavía</p>
          <button onClick={() => setModal({type:'image'})} className="btn-primary mt-4 text-sm flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4"/> Agregar primera imagen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {images.map(img => (
            <div key={img.id} className="card p-0 overflow-hidden group relative">
              <div className="aspect-square bg-obsidian-700 relative">
                <img src={img.imgUrl || driveToImg(img.driveUrl)} alt={img.title||''}
                  className="w-full h-full object-cover"
                  onError={e=>{e.target.src='';e.target.parentElement.classList.add('flex','items-center','justify-center');}}/>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => setModal({type:'editImage', image:img})}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                    <Pencil className="w-4 h-4 text-white"/>
                  </button>
                  <button onClick={() => handleDeleteImage(img)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400"/>
                  </button>
                </div>
              </div>
              {img.title && (
                <div className="p-2">
                  <p className="text-xs font-body text-slate-400 truncate">{img.title}</p>
                </div>
              )}
            </div>
          ))}
          {/* Add more button */}
          <button onClick={() => setModal({type:'image'})}
            className="card border-dashed border-white/10 hover:border-brand-500/30 hover:bg-brand-500/5 flex flex-col items-center justify-center gap-2 aspect-square transition-all cursor-pointer">
            <Plus className="w-6 h-6 text-slate-600"/>
            <span className="text-xs text-slate-600">Agregar</span>
          </button>
        </div>
      )}

      {modal?.type==='image' && (
        <ImageModal sectionId={section.id} imageCount={images.length} onClose={()=>setModal(null)} onSave={handleSaveImage}/>
      )}
      {modal?.type==='editImage' && (
        <ImageModal sectionId={section.id} image={modal.image} imageCount={images.length} onClose={()=>setModal(null)} onSave={handleSaveImage}/>
      )}
    </div>
  );
}

// ── MAIN
export default function AdminResources() {
  const [sections, setSections] = useState([]);
  const [imageCounts, setImageCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const secs = await getSections();
      setSections(secs);
      // Load image counts
      const counts = {};
      await Promise.all(secs.map(async s => {
        const imgs = await getSectionImages(s.id);
        counts[s.id] = imgs.length;
      }));
      setImageCounts(counts);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaveSection = async (sec) => {
    await saveSection(sec);
    await load();
    setModal(null);
  };

  const handleDeleteSection = async (sec) => {
    if (!confirm(`¿Eliminar la sección "${sec.name}" y todas sus imágenes?`)) return;
    await deleteSection(sec.id);
    await load();
  };

  const currentSection = selected ? sections.find(s => s.id === selected) : null;

  return (
    <div className="flex min-h-screen lg:h-screen lg:overflow-hidden">
      <AdminNav/>
      <main className="flex-1 lg:overflow-auto p-4 pt-16 lg:pt-8 sm:px-6 lg:px-8 lg:py-8">
        <div className="max-w-6xl mx-auto">
          {!currentSection ? (
            <>
              <div className="flex items-center justify-between mb-6 animate-fade-in">
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">Recursos</h1>
                  <p className="text-slate-500 text-sm mt-1">Secciones de referencia para estudiantes</p>
                </div>
                <button onClick={() => setModal({type:'section'})} className="btn-primary flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4"/> Nueva sección
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-48"><div className="w-8 h-8 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin"/></div>
              ) : sections.length === 0 ? (
                <div className="card text-center py-20">
                  <FolderOpen className="w-12 h-12 text-slate-700 mx-auto mb-4"/>
                  <p className="text-slate-400 font-display font-semibold mb-1">Sin secciones todavía</p>
                  <p className="text-slate-600 text-sm mb-5">Crea la primera sección de recursos</p>
                  <button onClick={() => setModal({type:'section'})} className="btn-primary flex items-center gap-2 mx-auto text-sm">
                    <Plus className="w-4 h-4"/> Crear primera sección
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-slide-up">
                  {sections.map(sec => (
                    <div key={sec.id} className="card group cursor-pointer hover:bg-obsidian-700/60 transition-all"
                      onClick={() => setSelected(sec.id)}>
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-3xl">{sec.emoji}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e=>e.stopPropagation()}>
                          <button onClick={() => setModal({type:'editSection', section:sec})}
                            className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors">
                            <Pencil className="w-3.5 h-3.5"/>
                          </button>
                          <button onClick={() => handleDeleteSection(sec)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      </div>
                      <h3 className="font-display font-semibold text-white text-sm mb-1">{sec.name}</h3>
                      {sec.description && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{sec.description}</p>}
                      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
                        <Image className="w-3.5 h-3.5"/>
                        <span>{imageCounts[sec.id] || 0} imagen{(imageCounts[sec.id]||0)!==1?'es':''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <SectionDetail section={currentSection} onBack={() => setSelected(null)} onRefresh={load}/>
          )}
        </div>
      </main>

      {modal?.type==='section' && <SectionModal sections={sections} onClose={()=>setModal(null)} onSave={handleSaveSection}/>}
      {modal?.type==='editSection' && <SectionModal section={modal.section} sections={sections} onClose={()=>setModal(null)} onSave={handleSaveSection}/>}
    </div>
  );
}
