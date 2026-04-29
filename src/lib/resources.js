// Resources — images served from /public/resources/ (no CORS issues)
// Sections are stored in RTDB, images are local files

const RTDB = 'https://registro-clientes-67d06-default-rtdb.firebaseio.com';

const rtdb = {
  async read(path) {
    const r = await fetch(`${RTDB}/${path}.json`);
    if (!r.ok) throw new Error('Error leyendo');
    return r.json();
  },
  async write(path, data) {
    const r = await fetch(`${RTDB}/${path}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error('Error guardando');
    return r.json();
  },
  async del(path) {
    await fetch(`${RTDB}/${path}.json`, { method: 'DELETE' });
  },
};

const uid = () => 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// Convert folder name to URL path
export function folderToPath(folder) {
  return `/resources/${folder}/`;
}

// Build full image URL from folder + filename
export function imageUrl(folder, filename) {
  return `/resources/${folder}/${filename}`;
}

// For Drive URLs (legacy support)
export function extractDriveId(url) {
  if (!url) return null;
  const patterns = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /id=([a-zA-Z0-9_-]+)/, /\/d\/([a-zA-Z0-9_-]+)/];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  if (/^[a-zA-Z0-9_-]{25,}$/.test(url.trim())) return url.trim();
  return null;
}

export function driveToThumb(url, size = 800) {
  // If it's a local path already, return as is
  if (url?.startsWith('/resources/')) return url;
  const id = extractDriveId(url);
  if (!id) return url;
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`;
}

export function driveToEmbed(url) {
  if (url?.startsWith('/resources/')) return url;
  const id = extractDriveId(url);
  if (!id) return url;
  return `https://drive.google.com/file/d/${id}/preview`;
}

export function driveToImg(url) { return driveToThumb(url, 800); }

// ── SECTIONS
export const getSections = async () => {
  const d = await rtdb.read('resource_sections');
  if (!d) return [];
  return Object.values(d).sort((a, b) => (a.order || 0) - (b.order || 0));
};

export const saveSection = async (section) => {
  const id = section.id || uid();
  await rtdb.write(`resource_sections/${id}`, { ...section, id });
  return id;
};

export const deleteSection = async (id) => {
  await rtdb.del(`resource_sections/${id}`);
  await rtdb.del(`resource_images/${id}`);
};

// ── IMAGES
export const getSectionImages = async (sectionId) => {
  const d = await rtdb.read(`resource_images/${sectionId}`);
  if (!d) return [];
  return Object.values(d).sort((a, b) => (a.order || 0) - (b.order || 0));
};

export const saveImage = async (sectionId, image) => {
  const id = image.id || uid();
  await rtdb.write(`resource_images/${sectionId}/${id}`, { ...image, id });
  return id;
};

export const deleteImage = async (sectionId, imageId) => {
  await rtdb.del(`resource_images/${sectionId}/${imageId}`);
};

export const getAllImages = async (sections) => {
  const all = {};
  await Promise.all(sections.map(async s => { all[s.id] = await getSectionImages(s.id); }));
  return all;
};

// ── DEFAULT SECTIONS (pre-loaded from local files)
export const DEFAULT_SECTIONS = [
  { slug: 'hero',                name: 'Hero',                emoji: '🎯', description: 'Imágenes de referencia para sección Hero' },
  { slug: 'oferta',              name: 'Oferta',              emoji: '💰', description: 'Imágenes de referencia para sección Oferta' },
  { slug: 'antes-y-despues',     name: 'Antes y después',     emoji: '🔄', description: 'Imágenes de referencia para Antes y Después' },
  { slug: 'modo-de-uso',         name: 'Modo de uso',         emoji: '📋', description: 'Imágenes de referencia para Modo de Uso' },
  { slug: 'tabla-comparativa',   name: 'Tabla comparativa',   emoji: '📊', description: 'Imágenes de referencia para Tabla Comparativa' },
  { slug: 'autoridad',           name: 'Autoridad',           emoji: '🏆', description: 'Imágenes de referencia para Autoridad' },
  { slug: 'testimonios',         name: 'Testimonios',         emoji: '💬', description: 'Imágenes de referencia para Testimonios' },
  { slug: 'mecanismo-unico',     name: 'Mecanismo único',     emoji: '⚡', description: 'Imágenes de referencia para Mecanismo Único' },
  { slug: 'beneficios-claves',   name: 'Beneficios claves',   emoji: '✨', description: 'Imágenes de referencia para Beneficios Claves' },
  { slug: 'preguntas-frecuentes',name: 'Preguntas frecuentes',emoji: '❓', description: 'Imágenes de referencia para Preguntas Frecuentes' },
];

// Get images from local public folder by scanning known filenames
// Since we can't scan the filesystem from the browser, we try loading images 1-20
export async function getLocalImages(slug) {
  const extensions = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'PNG'];
  const images = [];
  
  // Try numbered filenames 1-20
  for (let i = 1; i <= 20; i++) {
    for (const ext of extensions) {
      const url = `/resources/${slug}/${i}.${ext}`;
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok) {
          images.push({ id: `local_${slug}_${i}`, imgUrl: url, title: `${i}`, isLocal: true });
          break; // found this number, move to next
        }
      } catch { /* not found */ }
    }
  }
  return images;
}
