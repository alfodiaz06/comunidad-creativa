// Cloudinary upload service
const CLOUD_NAME = 'dr1q1gjva';
const UPLOAD_PRESET = 'recursos_comunidad'; // unsigned preset we'll create

export async function uploadToCloudinary(file, folder = 'recursos') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Error subiendo imagen');
  }

  const data = await res.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
  };
}

// Get optimized URL from Cloudinary
export function cloudinaryUrl(url, width = 800) {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
}

export function cloudinaryThumb(url, size = 400) {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${size},h_${size},c_fill,q_auto,f_auto/`);
}

// Get download URL with CORS headers enabled
export function cloudinaryDownload(url) {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/fl_attachment/');
}
