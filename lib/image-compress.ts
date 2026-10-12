// Compressão das fotos no navegador, antes do envio.
// Uma foto de celular (4–8 MB) vira um JPEG de ~200–350 KB com 1600 px no maior
// lado, mais uma versão pequena (640 px, ~40–70 KB) para cards e miniaturas.
// Tamanho pensado para caber muitas fotos no espaço grátis sem perder nitidez.

const MAX_SIDE = 1600;
const SMALL_SIDE = 640;
const QUALITY = 0.8;

export type CompressedImage = { blob: Blob; small: Blob; width: number; height: number };

function toJpeg(bitmap: ImageBitmap, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
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

  return new Promise<{ blob: Blob; width: number; height: number }>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve({ blob, width, height }) : reject(new Error("Não foi possível comprimir a imagem."))),
      "image/jpeg",
      QUALITY,
    ),
  );
}

export async function compressImage(file: File): Promise<CompressedImage> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Formato de imagem não suportado. Use JPG, PNG ou WebP.");
  }
  try {
    const large = await toJpeg(bitmap, MAX_SIDE);
    const small = await toJpeg(bitmap, SMALL_SIDE);
    return { blob: large.blob, small: small.blob, width: large.width, height: large.height };
  } finally {
    bitmap.close();
  }
}
