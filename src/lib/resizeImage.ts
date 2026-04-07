/**
 * Redimensiona uma imagem no cliente usando Canvas para garantir
 * que ela fique dentro do limite de tamanho especificado.
 *
 * @param file O arquivo de imagem original
 * @param maxSizeBytes Tamanho máximo em bytes (padrão: 5MB)
 * @param maxDimension Dimensão máxima em pixels para largura/altura (padrão: 1920)
 * @returns Um novo File redimensionado, ou o original se já estiver dentro do limite
 */
export async function resizeImageIfNeeded(
  file: File,
  maxSizeBytes = 5 * 1024 * 1024,
  maxDimension = 1920,
): Promise<File> {
  // Se não for imagem ou já estiver dentro do limite, retorna sem alterar
  if (!file.type.startsWith("image/") || file.size <= maxSizeBytes) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calcula escala para não ultrapassar a dimensão máxima
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Não foi possível criar contexto canvas"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Tenta compressão progressiva até caber no limite
      const tryQuality = (quality: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Falha ao converter canvas para blob"));
              return;
            }

            if (blob.size <= maxSizeBytes || quality <= 0.3) {
              // Dentro do limite ou atingiu qualidade mínima
              const resizedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              // Tenta novamente com qualidade menor
              tryQuality(quality - 0.1);
            }
          },
          "image/jpeg",
          quality,
        );
      };

      tryQuality(0.85);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Falha ao carregar imagem para redimensionamento"));
    };

    img.src = url;
  });
}
