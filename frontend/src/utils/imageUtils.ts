/**
 * Image processing utilities for GreenGrow.
 * Automatically compresses high-resolution smartphone camera photos
 * before sending to the Gemini AI backend to guarantee fast upload
 * and smooth performance even on rural mobile connections.
 */

export interface ProcessedImage {
  base64: string;
  dataUrl: string;
  mimeType: string;
  width: number;
  height: number;
}

export async function processAndCompressImage(
  fileOrBlob: File | Blob,
  maxWidth = 960,
  maxHeight = 960,
  quality = 0.78
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file.'));

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image data.'));

      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect-ratio preserved dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context not available.'));
          return;
        }

        // Draw image onto canvas with smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed JPEG data URL
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const base64 = dataUrl.split(',')[1] || '';

        resolve({
          base64,
          dataUrl,
          mimeType,
          width,
          height,
        });
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(fileOrBlob);
  });
}
