import { rgbaColorSchema } from "./types";

export type Rgba = {
  r: number;
  g: number;
  b: number;
  a: number;
};

export function packRgba({ r, g, b, a }: Rgba): number {
  for (const channel of [r, g, b, a]) {
    if (!Number.isInteger(channel) || channel < 0 || channel > 255) {
      throw new RangeError("RGBA channels must be integers from 0 to 255.");
    }
  }

  return (((r << 24) >>> 0) | (g << 16) | (b << 8) | a) >>> 0;
}

export function unpackRgba(color: number): Rgba {
  const parsed = rgbaColorSchema.parse(color);

  return {
    r: (parsed >>> 24) & 0xff,
    g: (parsed >>> 16) & 0xff,
    b: (parsed >>> 8) & 0xff,
    a: parsed & 0xff
  };
}

export function rgbaToCss(color: number): string {
  const { r, g, b, a } = unpackRgba(color);
  return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
}

export function colorToHex(color: number, includeAlpha = true): string {
  const { r, g, b, a } = unpackRgba(color);
  const parts = [r, g, b, ...(includeAlpha ? [a] : [])];
  return `#${parts.map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}

export function parseHexColor(input: string): number {
  const normalized = input.trim().replace(/^#/, "");
  const isValid = /^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(normalized);

  if (!isValid) {
    throw new Error("Expected a 6 or 8 character hex color.");
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  const a = normalized.length === 8 ? Number.parseInt(normalized.slice(6, 8), 16) : 255;

  return packRgba({ r, g, b, a });
}

export function rgbaToHsl({ r, g, b, a }: Rgba): { h: number; s: number; l: number; a: number } {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { h: 0, s: 0, l: lightness, a: a / 255 };
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue: number;

  if (max === red) {
    hue = 60 * (((green - blue) / delta) % 6);
  } else if (max === green) {
    hue = 60 * ((blue - red) / delta + 2);
  } else {
    hue = 60 * ((red - green) / delta + 4);
  }

  return { h: hue < 0 ? hue + 360 : hue, s: saturation, l: lightness, a: a / 255 };
}

export function hslToRgba({
  h,
  s,
  l,
  a
}: {
  h: number;
  s: number;
  l: number;
  a: number;
}): Rgba {
  const normalizedHue = ((h % 360) + 360) % 360;
  const clampedSaturation = Math.min(1, Math.max(0, s));
  const clampedLightness = Math.min(1, Math.max(0, l));
  const chroma = (1 - Math.abs(2 * clampedLightness - 1)) * clampedSaturation;
  const x = chroma * (1 - Math.abs(((normalizedHue / 60) % 2) - 1));
  const match = clampedLightness - chroma / 2;

  const [red, green, blue] =
    normalizedHue < 60
      ? [chroma, x, 0]
      : normalizedHue < 120
        ? [x, chroma, 0]
        : normalizedHue < 180
          ? [0, chroma, x]
          : normalizedHue < 240
            ? [0, x, chroma]
            : normalizedHue < 300
              ? [x, 0, chroma]
              : [chroma, 0, x];

  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255),
    a: Math.round(Math.min(1, Math.max(0, a)) * 255)
  };
}
