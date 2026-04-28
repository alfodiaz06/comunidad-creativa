// Resources DB — Firebase Realtime Database
const RTDB = 'https://registro-clientes-67d06-default-rtdb.firebaseio.com';

const rtdb = {
  async read(path) {
    const r = await fetch(`${RTDB}/${path}.json`);
    if (!r.ok && r.status !== 404) throw new Error('Error leyendo datos');
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

// Convert Drive URL to direct image URL
export function driveToImg(url) {
  if (!url) return '';
  // Extract ID from various Drive URL formats
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
  }
  // If already a direct ID
  if (/^[a-zA-Z0-9_-]{25,}$/.test(url.trim())) {
    return `https://drive.google.com/uc?export=view&id=${url.trim()}`;
  }
  return url;
}

// ── SECTIONS (carpetas)
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
  // Also delete all images in this section
  await rtdb.del(`resource_images/${id}`);
};

// ── IMAGES (dentro de cada sección)
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
  await Promise.all(sections.map(async s => {
    all[s.id] = await getSectionImages(s.id);
  }));
  return all;
};
