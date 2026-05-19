export const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const originalDataUrl = event.target?.result as string;
      const img = new Image();
      img.src = originalDataUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(originalDataUrl); // Fallback
          return;
        }

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // JPEG olarak %60 kalite ile sıkıştırıyoruz (localStorage limitine takılmamak için)
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };
      img.onerror = () => resolve(originalDataUrl); // Hata olursa orijinali dön
    };
    reader.onerror = () => reject(new Error("Dosya okuma hatası"));
  });
};
