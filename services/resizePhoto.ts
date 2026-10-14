// Shrinks a chosen photo on the phone before it is uploaded (long side 1600px, JPEG), so it travels fast and
// stays well under the size limit. Also drops the photo's hidden details (location, camera), as a fresh image.
export async function resizePhoto(file: File, maxSide = 1600): Promise<string> {
  if (!/^image\//.test(file.type)) throw new Error('Please choose a photo.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("That photo couldn't be opened. Please choose another."));
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("That photo couldn't be opened. Please choose another.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
