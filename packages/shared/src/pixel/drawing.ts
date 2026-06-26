import { type Coordinate, type PixelBuffer, type PixelChange, TRANSPARENT } from "./types";
import { getPixel, isInsideCanvas } from "./encoding";

export function pencilStroke(points: readonly Coordinate[], color: number): PixelChange[] {
  const changes = new Map<string, PixelChange>();

  for (const point of points) {
    changes.set(`${point.x}:${point.y}`, { x: point.x, y: point.y, color: color >>> 0 });
  }

  return [...changes.values()];
}

export function eraserStroke(points: readonly Coordinate[]): PixelChange[] {
  return pencilStroke(points, TRANSPARENT);
}

export function linePoints(start: Coordinate, end: Coordinate): Coordinate[] {
  const points: Coordinate[] = [];
  let x0 = start.x;
  let y0 = start.y;
  const x1 = end.x;
  const y1 = end.y;
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;

  while (true) {
    points.push({ x: x0, y: y0 });

    if (x0 === x1 && y0 === y1) {
      break;
    }

    const doubledError = 2 * error;

    if (doubledError >= dy) {
      error += dy;
      x0 += sx;
    }

    if (doubledError <= dx) {
      error += dx;
      y0 += sy;
    }
  }

  return points;
}

export function rectanglePoints(start: Coordinate, end: Coordinate, filled: boolean): Coordinate[] {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);
  const points: Coordinate[] = [];

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (filled || y === minY || y === maxY || x === minX || x === maxX) {
        points.push({ x, y });
      }
    }
  }

  return points;
}

export function floodFill(buffer: PixelBuffer, start: Coordinate, color: number): PixelChange[] {
  if (!isInsideCanvas(buffer, start.x, start.y)) {
    return [];
  }

  const targetColor = getPixel(buffer, start.x, start.y);
  const replacement = color >>> 0;

  if (targetColor === replacement) {
    return [];
  }

  const changes: PixelChange[] = [];
  const visited = new Uint8Array(buffer.width * buffer.height);
  const stack: Coordinate[] = [start];

  while (stack.length > 0) {
    const point = stack.pop();
    if (point === undefined || !isInsideCanvas(buffer, point.x, point.y)) {
      continue;
    }

    const index = point.y * buffer.width + point.x;
    if ((visited[index] ?? 0) === 1 || getPixel(buffer, point.x, point.y) !== targetColor) {
      continue;
    }

    visited[index] = 1;
    changes.push({ x: point.x, y: point.y, color: replacement });

    stack.push(
      { x: point.x + 1, y: point.y },
      { x: point.x - 1, y: point.y },
      { x: point.x, y: point.y + 1 },
      { x: point.x, y: point.y - 1 }
    );
  }

  return changes;
}

export function extractPalette(buffer: PixelBuffer, limit = 32): number[] {
  const counts = new Map<number, number>();

  for (const color of buffer.pixels) {
    if (color === TRANSPARENT) {
      continue;
    }

    counts.set(color, (counts.get(color) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([color]) => color);
}
