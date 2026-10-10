// Compressão das fotos no navegador, antes do envio.
// Uma foto de celular (4–8 MB) vira um JPEG de ~300–600 KB com 2000 px no maior lado.

const MAX_SIDE = 2000;
const QUALITY = 0.82;

export type CompressedImage = { blob: Blob; width: number; height: number };

export async function compressImage(file: File): Promise<CompressedImage> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Formato de imagem não suportado. Use JPG, PNG ou WebP.");
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem neste navegador.");

  // Fundo branco para PNG com transparência não virar preto no JPEG
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
  if (!blob) throw new Error("Não foi possível comprimir a imagem.");

  return { blob, width, height };
}
