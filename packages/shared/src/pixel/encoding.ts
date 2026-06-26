import {
  type Alignment,
  type PixelBuffer,
  type PixelChange,
  type SnapshotEncoding,
  TRANSPARENT,
  canvasDimensionsSchema
} from "./types";

export function createPixelBuffer(width: number, height: number, fill = TRANSPARENT): PixelBuffer {
  canvasDimensionsSchema.parse({ width, height });
  const pixels = new Uint32Array(width * height);

  if (fill !== TRANSPARENT) {
    pixels.fill(fill >>> 0);
  }

  return { width, height, pixels };
}

export function clonePixelBuffer(buffer: PixelBuffer): PixelBuffer {
  return {
    width: buffer.width,
    height: buffer.height,
    pixels: new Uint32Array(buffer.pixels)
  };
}

export function pixelIndex(width: number, x: number, y: number): number {
  return y * width + x;
}

export function isInsideCanvas(buffer: Pick<PixelBuffer, "width" | "height">, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < buffer.width && y < buffer.height;
}

export function getPixel(buffer: PixelBuffer, x: number, y: number): number {
  if (!isInsideCanvas(buffer, x, y)) {
    return TRANSPARENT;
  }

  return buffer.pixels[pixelIndex(buffer.width, x, y)] ?? TRANSPARENT;
}

export function setPixel(buffer: PixelBuffer, x: number, y: number, color: number): boolean {
  if (!isInsideCanvas(buffer, x, y)) {
    return false;
  }

  buffer.pixels[pixelIndex(buffer.width, x, y)] = color >>> 0;
  return true;
}

export function applyPixelChanges(buffer: PixelBuffer, changes: readonly PixelChange[]): number {
  let applied = 0;

  for (const change of changes) {
    if (setPixel(buffer, change.x, change.y, change.color)) {
      applied += 1;
    }
  }

  return applied;
}

export function typedArrayToImageData(buffer: PixelBuffer): ImageData {
  const data = new Uint8ClampedArray(buffer.width * buffer.height * 4);

  for (let i = 0; i < buffer.pixels.length; i += 1) {
    const color = buffer.pixels[i] ?? TRANSPARENT;
    const offset = i * 4;
    data[offset] = (color >>> 24) & 0xff;
    data[offset + 1] = (color >>> 16) & 0xff;
    data[offset + 2] = (color >>> 8) & 0xff;
    data[offset + 3] = color & 0xff;
  }

  return new ImageData(data, buffer.width, buffer.height);
}

export function imageDataToPixelBuffer(imageData: ImageData): PixelBuffer {
  const pixels = new Uint32Array(imageData.width * imageData.height);

  for (let i = 0; i < pixels.length; i += 1) {
    const offset = i * 4;
    const r = imageData.data[offset] ?? 0;
    const g = imageData.data[offset + 1] ?? 0;
    const b = imageData.data[offset + 2] ?? 0;
    const a = imageData.data[offset + 3] ?? 0;
    pixels[i] = (((r << 24) >>> 0) | (g << 16) | (b << 8) | a) >>> 0;
  }

  return { width: imageData.width, height: imageData.height, pixels };
}

export function encodeSnapshot(buffer: PixelBuffer): SnapshotEncoding {
  canvasDimensionsSchema.parse({ width: buffer.width, height: buffer.height });

  const bytes: number[] = [];
  let index = 0;

  while (index < buffer.pixels.length) {
    const color = buffer.pixels[index] ?? TRANSPARENT;
    let count = 1;

    while (
      index + count < buffer.pixels.length &&
      (buffer.pixels[index + count] ?? TRANSPARENT) === color &&
      count < 0xffffffff
    ) {
      count += 1;
    }

    pushUint32(bytes, color);
    pushUint32(bytes, count);
    index += count;
  }

  return {
    format: "rgba-rle-v1",
    width: buffer.width,
    height: buffer.height,
    data: bytesToBase64(Uint8Array.from(bytes))
  };
}

export function decodeSnapshot(snapshot: SnapshotEncoding): PixelBuffer {
  if (snapshot.format !== "rgba-rle-v1") {
    throw new Error("Unsupported snapshot format.");
  }

  canvasDimensionsSchema.parse({ width: snapshot.width, height: snapshot.height });

  const bytes = base64ToBytes(snapshot.data);
  if (bytes.byteLength % 8 !== 0) {
    throw new Error("Corrupt snapshot data.");
  }

  const pixels = new Uint32Array(snapshot.width * snapshot.height);
  let pixelOffset = 0;

  for (let byteOffset = 0; byteOffset < bytes.byteLength; byteOffset += 8) {
    const color = readUint32(bytes, byteOffset);
    const count = readUint32(bytes, byteOffset + 4);

    if (pixelOffset + count > pixels.length) {
      throw new Error("Snapshot run exceeds canvas dimensions.");
    }

    pixels.fill(color, pixelOffset, pixelOffset + count);
    pixelOffset += count;
  }

  if (pixelOffset !== pixels.length) {
    throw new Error("Snapshot data ended before the canvas was filled.");
  }

  return { width: snapshot.width, height: snapshot.height, pixels };
}

export function resizePixelBuffer(
  source: PixelBuffer,
  width: number,
  height: number,
  alignment: Alignment,
  fill = TRANSPARENT
): PixelBuffer {
  const target = createPixelBuffer(width, height, fill);
  const offsetX = alignmentOffset(source.width, width, alignment, "x");
  const offsetY = alignmentOffset(source.height, height, alignment, "y");

  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const targetX = x + offsetX;
      const targetY = y + offsetY;

      if (isInsideCanvas(target, targetX, targetY)) {
        setPixel(target, targetX, targetY, getPixel(source, x, y));
      }
    }
  }

  return target;
}

export function canvasMemoryBytes(buffer: Pick<PixelBuffer, "width" | "height">): number {
  return buffer.width * buffer.height * Uint32Array.BYTES_PER_ELEMENT;
}

function alignmentOffset(
  sourceSize: number,
  targetSize: number,
  alignment: Alignment,
  axis: "x" | "y"
): number {
  const isStart =
    axis === "x"
      ? alignment.endsWith("LEFT")
      : alignment.startsWith("TOP");
  const isEnd =
    axis === "x"
      ? alignment.endsWith("RIGHT")
      : alignment.startsWith("BOTTOM");

  if (isStart) {
    return 0;
  }

  if (isEnd) {
    return targetSize - sourceSize;
  }

  return Math.floor((targetSize - sourceSize) / 2);
}

function pushUint32(bytes: number[], value: number): void {
  bytes.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function readUint32(bytes: Uint8Array, offset: number): number {
  const b0 = bytes[offset] ?? 0;
  const b1 = bytes[offset + 1] ?? 0;
  const b2 = bytes[offset + 2] ?? 0;
  const b3 = bytes[offset + 3] ?? 0;
  return ((b0 | (b1 << 8) | (b2 << 16) | ((b3 << 24) >>> 0)) >>> 0);
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    const chunk = bytes.slice(i, i + 0x8000);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(base64, "base64"));
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}
