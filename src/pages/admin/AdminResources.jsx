import { useState, useEffect, useCallback } from 'react';
import AdminNav from '../../components/admin/AdminNav';
import {
  getSections, saveSection, deleteSection, getSectionImages, saveImage, deleteImage,
  getTextItems, saveTextItem, deleteTextItem,
  cloudinaryThumb, cloudinaryUrl
} from '../../lib/resources';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { Plus, Pencil, Trash2, X, Check, ChevronLeft, Image, FolderOpen, Upload, Loader, Type, Link, FileText } from 'lucide-react';

// ── TEXT ITEMS TAB
function TextsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', type: 'text' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await getTextItems()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    try {
      await saveTextItem({ ...modal, ...form, order: modal?.order ?? items.length });
      await load();
      setModal(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async (item) => {
    if (!confirm(`¿Eliminar "${item.title}"?`)) return;
    await deleteTextItem(item.id);
    await load();
  };

  const openNew = () => { setForm({ title: '', content: '', type: 'text' }); setModal({}); };
  const openEdit = (item) => { setForm({ title: item.title, content: item.content, type: item.type || 'text' }); setModal(item); };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-slate-500 text-sm">Textos, copies y URLs que los estudiantes pueden ver y copiar</p>
        <button onClick={openNew} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4"/> Agregar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-6 h-6 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin"/></div>
      ) : items.length === 0 ? (
        <div className="card text-center py-16">
          <Type className="w-10 h-10 text-slate-700 mx-auto mb-3"/>
          <p className="text-slate-500 text-sm">Sin contenido todavía</p>
          <button onClick={openNew} className="btn-primary mt-4 text-sm flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4"/> Agregar primero
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="card flex items-start gap-4 group">
              <div className="w-8 h-8 rounded-lg bg-accent-500/15 border border-accent-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.type === 'url' ? <Link className="w-4 h-4 text-accent-400"/> : <FileText className="w-4 h-4 text-accent-400"/>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-white text-sm mb-1">{item.title}</p>
                <p className="text-xs text-slate-400 font-mono break-all leading-relaxed">{item.content}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={() => openEdit(item)} className="p-1.5 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors">
                  <Pencil className="w-3.5 h-3.5"/>
                </button>
                <button onClick={() => handleDelete(item)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5"/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-strong rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-display font-semibold text-white">{modal.id ? '✏️ Editar' : '➕ Nuevo'} contenido</h3>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Tipo</label>
                <div className="flex gap-2">
                  {[{key:'text',label:'📝 Texto/Copy'},{key:'url',label:'🔗 URL/Link'}].map(t=>(
                    <button key={t.key} onClick={()=>setForm(f=>({...f,type:t.key}))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all
                        ${form.type===t.key?'bg-brand-500/15 text-brand-300 border border-brand-500/20':'text-slate-500 hover:bg-white/5 border border-transparent'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Título</label>
                <input className="input-field" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Ej: URL del grupo de WhatsApp"/>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">{form.type==='url'?'URL':'Texto / Copy'}</label>
                <textarea className="input-field resize-none" rows={4} value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))}
                  placeholder={form.type==='url'?'https://...':'Escribe el texto aquí...'}/>
              </div>
            </div>
            <div className="p-5 border-t border-white/5 flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="btn-ghost">Cancelar</button>
              <button onClick={handleSave} disabled={saving||!form.title||!form.content} className="btn-primary flex items-center gap-2">
                {saving?<div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>:<Check className="w-4 h-4"/>}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── UPLOAD ZONE
function UploadZone({ sectionId, onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState([]);

  const handleFiles = async (files) => {
    const list = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!list.length) return;
    setUploading(true);
    setProgress(list.map(f => ({ name: f.name, status: 'pending' })));
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      setProgress(p => p.map((x,j) => j===i?{...x,status:'uploading'}:x));
      try {
        const result = await uploadToCloudinary(file, `recursos/${sectionId}`);
        await saveImage(sectionId, { imgUrl: result.url, thumbUrl: cloudinaryThumb(result.url,400), title: file.name.replace(/\.[^/.]+$/,''), publicId: result.publicId });
        setProgress(p => p.map((x,j) => j===i?{...x,status:'done'}:x));
      } catch(e) { setProgress(p => p.map((x,j) => j===i?{...x,status:'error'}:x)); }
    }
    setUploading(false);
    onUploaded();
    setTimeout(() => setProgress([]), 3000);
  };

  return (
    <div className="mb-5">
      <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)}
        onDrop={e=>{e.preventDefault();setDragging(false);handleFiles(e.dataTransfer.files);}}
        onClick={()=>document.getElementById('img-upload').click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all
          ${dragging?'border-brand-500 bg-brand-500/10':'border-white/10 hover:border-brand-500/40 hover:bg-brand-500/5'}`}>
        <input id="img-upload" type="file" multiple accept="image/*" className="hidden" onChange={e=>handleFiles(e.target.files)}/>
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-brand-400">
            <Loader className="w-4 h-4 animate-spin"/><span className="text-sm">Subiendo...</span>
          </div>
        ) : (
          <>
            <Upload className="w-7 h-7 text-slate-600 mx-auto mb-2"/>
            <p className="text-slate-400 text-sm font-display font-semibold">Arrastra imágenes o haz clic</p>
            <p className="text-slate-600 text-xs mt-1">JPG, PNG, WEBP — múltiples a la vez</p>
          </>
        )}
      </div>
      {progress.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {progress.map((p,i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-obsidian-700 border border-white/5">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status==='done'?'bg-jade-400':p.status==='error'?'bg-red-400':p.status==='uploading'?'bg-brand-400 animate-pulse':'bg-slate-600'}`}/>
              <span className="text-xs font-mono text-slate-400 flex-1 truncate">{p.name}</span>
              <span className="text-xs font-mono text-slate-600">{p.status==='done'?'✓':p.status==='error'?'✗':p.status==='uploading'?'...':''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── IMAGES TAB (Referencia Landings)
function ImagesTab() {
  const [sections, setSections] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [images, setImages] = useState([]);
  const [imgsLoading, setImgsLoading] = useState(false);
  const [sectionModal, setSectionModal] = useState(null);
  const [sectionForm, setSectionForm] = useState({ name:'', emoji:'📁', description:'' });

  const EMOJIS = ['📁','🎯','⭐','🏆','💡','🔥','📸','✨','🎨','📊','💬','❓','🔑','🛠️','📋','💰','🔄','⚡'];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const secs = await getSections();
      setSections(secs);
      const c = {};
      await Promise.all(secs.map(async s => { c[s.id] = (await getSectionImages(s.id)).length; }));
      setCounts(c);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadImages = async (sec) => {
    setSelected(sec);
    setImgsLoading(true);
    try { setImages(await getSectionImages(sec.id)); } finally { setImgsLoading(false); }
  };

  const handleSaveSection = async () => {
    if (!sectionForm.name) return;
    await saveSection({ ...sectionModal, ...sectionForm, order: sectionModal?.order ?? sections.length });
    await load(); setSectionModal(null);
  };

  const handleDeleteSection = async (sec) => {
    if (!confirm(`¿Eliminar "${sec.name}" y todas sus imágenes?`)) return;
    await deleteSection(sec.id); await load();
  };

  const handleDeleteImage = async (img) => {
    if (!confirm('¿Eliminar imagen?')) return;
    await deleteImage(selected.id, img.id);
    setImages(imgs => imgs.filter(i => i.id !== img.id));
    setCounts(c => ({...c, [selected.id]: (c[selected.id]||1)-1}));
  };

  if (selected) return (
    <div>
      <button onClick={()=>setSelected(null)} className="flex items-center gap-2 text-slate-500 hover:text-white text-sm mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4"/> Volver
      </button>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-3xl">{selected.emoji}</span>
        <div>
          <h3 className="font-display font-bold text-white">{selected.name}</h3>
          <p className="text-xs font-mono text-slate-500">{images.length} imágenes</p>
        </div>
      </div>
      <UploadZone sectionId={selected.id} onUploaded={async()=>{setImages(await getSectionImages(selected.id));}}/>
      {imgsLoading ? (
        <div className="flex items-center justify-center h-24"><div className="w-6 h-6 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin"/></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {images.map(img => (
            <div key={img.id} className="card p-0 overflow-hidden group relative">
              <div className="aspect-square bg-obsidian-700">
                <img src={img.thumbUrl||cloudinaryThumb(img.imgUrl,400)} alt={img.title||''} className="w-full h-full object-cover"/>
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={()=>handleDeleteImage(img)} className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg">
                  <Trash2 className="w-4 h-4 text-red-400"/>
                </button>
              </div>
              {img.title && <div className="p-2"><p className="text-xs text-slate-400 truncate">{img.title}</p></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-slate-500 text-sm">Secciones de imágenes de referencia para landing pages</p>
        <button onClick={()=>{setSectionForm({name:'',emoji:'📁',description:''});setSectionModal({});}} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4"/> Nueva sección
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-8 h-8 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin"/></div>
      ) : sections.length === 0 ? (
        <div className="card text-center py-16">
          <FolderOpen className="w-10 h-10 text-slate-700 mx-auto mb-3"/>
          <p className="text-slate-500 text-sm">Sin secciones todavía</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sections.map(sec => (
            <div key={sec.id} className="card group cursor-pointer hover:bg-obsidian-700/60 transition-all" onClick={()=>loadImages(sec)}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{sec.emoji}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>{setSectionForm({name:sec.name,emoji:sec.emoji,description:sec.description||''});setSectionModal(sec);}} className="p-1.5 text-slate-500 hover:text-brand-400 rounded-lg"><Pencil className="w-3.5 h-3.5"/></button>
                  <button onClick={()=>handleDeleteSection(sec)} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
              <h3 className="font-display font-semibold text-white text-sm mb-1">{sec.name}</h3>
              {sec.description && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{sec.description}</p>}
              <div className="flex items-center gap-1 text-xs font-mono text-slate-500">
                <Image className="w-3.5 h-3.5"/><span>{counts[sec.id]||0} imágenes</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {sectionModal !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-strong rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-display font-semibold text-white">{sectionModal.id?'✏️ Editar':'➕ Nueva'} sección</h3>
              <button onClick={()=>setSectionModal(null)} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(e=>(
                    <button key={e} onClick={()=>setSectionForm(f=>({...f,emoji:e}))}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${sectionForm.emoji===e?'bg-brand-500/30 border border-brand-500':'bg-obsidian-700 border border-white/5 hover:border-white/20'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Nombre</label>
                <input className="input-field" value={sectionForm.name} onChange={e=>setSectionForm(f=>({...f,name:e.target.value}))} placeholder="Hero, Oferta..."/>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Descripción</label>
                <input className="input-field" value={sectionForm.description} onChange={e=>setSectionForm(f=>({...f,description:e.target.value}))} placeholder="Opcional"/>
              </div>
            </div>
            <div className="p-5 border-t border-white/5 flex gap-3 justify-end">
              <button onClick={()=>setSectionModal(null)} className="btn-ghost">Cancelar</button>
              <button onClick={handleSaveSection} disabled={!sectionForm.name} className="btn-primary flex items-center gap-2">
                <Check className="w-4 h-4"/> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN
export default function AdminResources() {
  const [tab, setTab] = useState('texts');

  return (
    <div className="flex min-h-screen lg:h-screen lg:overflow-hidden">
      <AdminNav/>
      <main className="flex-1 lg:overflow-auto p-4 pt-16 lg:pt-8 sm:px-6 lg:px-8 lg:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-white">Recursos</h1>
            <p className="text-slate-500 text-sm mt-1">Contenido de referencia para estudiantes</p>
          </div>

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
              <Image className="w-4 h-4"/> Referencia Landings
            </button>
          </div>

          {tab==='texts' ? <TextsTab/> : <ImagesTab/>}
        </div>
      </main>
    </div>
  );
}
