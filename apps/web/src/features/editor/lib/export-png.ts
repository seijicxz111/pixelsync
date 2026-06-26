import { typedArrayToImageData, type PixelBuffer } from "@pixelsync/shared";

export async function exportPixelBufferAsPng(buffer: PixelBuffer, scale: number): Promise<Blob> {
  const safeScale = Math.max(1, Math.min(32, Math.floor(scale)));
  const source = document.createElement("canvas");
  source.width = buffer.width;
  source.height = buffer.height;
  const sourceContext = source.getContext("2d");

  if (sourceContext === null) {
    throw new Error("Canvas rendering is unavailable.");
  }

  sourceContext.imageSmoothingEnabled = false;
  sourceContext.putImageData(typedArrayToImageData(buffer), 0, 0);

  const output = document.createElement("canvas");
  output.width = buffer.width * safeScale;
  output.height = buffer.height * safeScale;
  const outputContext = output.getContext("2d");

  if (outputContext === null) {
    throw new Error("Canvas rendering is unavailable.");
  }

  outputContext.imageSmoothingEnabled = false;
  outputContext.drawImage(source, 0, 0, output.width, output.height);

  return new Promise<Blob>((resolve, reject) => {
    output.toBlob((blob) => {
      if (blob === null) {
        reject(new Error("PNG export failed."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
