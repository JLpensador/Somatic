import sharp from "sharp";

const SUPPORTED_FORMATS = ["jpg", "jpeg", "png", "webp", "gif", "avif", "tiff"];

export function isImageFormat(format) {
  return SUPPORTED_FORMATS.includes(format.toLowerCase());
}

export function canConvertImage(mimeType) {
  return mimeType.startsWith("image/");
}

export async function convertImage(inputPath, outputPath, format) {
  const normalizedFormat =
    format.toLowerCase() === "jpg" ? "jpeg" : format.toLowerCase();

  await sharp(inputPath)
    .toFormat(normalizedFormat, { quality: 90, effort: 6 })
    .toFile(outputPath);

  console.log(`Imagem convertida: ${format.toUpperCase()}`);
  return outputPath;
}

export function getSupportedImageFormats() {
  return SUPPORTED_FORMATS;
}
