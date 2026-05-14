// Resources — RTDB REST API
const RTDB = 'https://registro-clientes-67d06-default-rtdb.firebaseio.com';

const rtdb = {
  async read(path) {
    const r = await fetch(`${RTDB}/${path}.json`);
    if (!r.ok) throw new Error('Error leyendo');
    return r.json();
  },
  async write(path, data) {
    const r = await fetch(`${RTDB}/${path}.json`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error('Error guardando');
    return r.json();
  },
  async del(path) { await fetch(`${RTDB}/${path}.json`, { method: 'DELETE' }); },
};

const uid = () => 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);

// ── IMAGE SECTIONS (Referencia Landings)
export const getSections = async () => {
  const d = await rtdb.read('resource_sections');
  if (!d) return [];
  return Object.values(d).sort((a,b) => (a.order||0)-(b.order||0));
};
export const saveSection = async (section) => {
  const id = section.id || uid();
  await rtdb.write(`resource_sections/${id}`, {...section, id});
  return id;
};
export const deleteSection = async (id) => {
  await rtdb.del(`resource_sections/${id}`);
  await rtdb.del(`resource_images/${id}`);
};
export const getSectionImages = async (sectionId) => {
  const d = await rtdb.read(`resource_images/${sectionId}`);
  if (!d) return [];
  return Object.values(d).sort((a,b) => (a.order||0)-(b.order||0));
};
export const saveImage = async (sectionId, image) => {
  const id = image.id || uid();
  await rtdb.write(`resource_images/${sectionId}/${id}`, {...image, id});
  return id;
};
export const deleteImage = async (sectionId, imageId) => {
  await rtdb.del(`resource_images/${sectionId}/${imageId}`);
};

// ── TEXT ITEMS (Copys & URLs)
export const getTextItems = async () => {
  const d = await rtdb.read('resource_texts');
  if (!d) return [];
  return Object.values(d).sort((a,b) => (a.order||0)-(b.order||0));
};
export const saveTextItem = async (item) => {
  const id = item.id || uid();
  await rtdb.write(`resource_texts/${id}`, {...item, id});
  return id;
};
export const deleteTextItem = async (id) => {
  await rtdb.del(`resource_texts/${id}`);
};

// Cloudinary helpers
export function cloudinaryThumb(url, size=400) {
  if (!url?.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${size},h_${size},c_fill,q_auto,f_auto/`);
}
export function cloudinaryUrl(url, width=800) {
  if (!url?.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
}
export function extractDriveId(url) {
  if (!url) return null;
  const patterns = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /id=([a-zA-Z0-9_-]+)/, /\/d\/([a-zA-Z0-9_-]+)/];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  return null;
}
export function driveToThumb(url, size=800) {
  if (url?.startsWith('/resources/')) return url;
  const id = extractDriveId(url);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${size}` : url;
}
export function driveToEmbed(url) {
  if (url?.startsWith('/resources/')) return url;
  const id = extractDriveId(url);
  return id ? `https://drive.google.com/file/d/${id}/preview` : url;
}
export function driveToImg(url) { return driveToThumb(url, 800); }
export function cloudinaryDownload(url) {
  if (!url?.includes('cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/fl_attachment/');
}
