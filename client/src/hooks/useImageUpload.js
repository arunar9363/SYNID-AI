import { useState, useCallback } from 'react';

export function useImageUpload() {
  const [images, setImages] = useState([]); // [{file, preview, base64}]

  const addImages = useCallback(async (files) => {
    const newImgs = await Promise.all(
      Array.from(files).slice(0, 4).map(async (file) => {
        const preview = URL.createObjectURL(file);
        const base64 = await toBase64(file);
        return { file, preview, base64, id: Math.random().toString(36).slice(2) };
      })
    );
    setImages(prev => [...prev, ...newImgs].slice(0, 4));
  }, []);

  const removeImage = useCallback((id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  }, []);

  const clearImages = useCallback(() => setImages([]), []);

  return { images, addImages, removeImage, clearImages };
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
