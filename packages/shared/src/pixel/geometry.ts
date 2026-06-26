import { type Coordinate } from "./types";

export type ViewTransform = {
  offsetX: number;
  offsetY: number;
  zoom: number;
};

export type Size = {
  width: number;
  height: number;
};

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 64;

export function screenToCanvasCoordinate(
  pointer: Coordinate,
  transform: ViewTransform,
  pixelSize = 1
): Coordinate {
  return {
    x: Math.floor((pointer.x - transform.offsetX) / (transform.zoom * pixelSize)),
    y: Math.floor((pointer.y - transform.offsetY) / (transform.zoom * pixelSize))
  };
}

export function canvasToScreenCoordinate(
  coordinate: Coordinate,
  transform: ViewTransform,
  pixelSize = 1
): Coordinate {
  return {
    x: Math.round(coordinate.x * transform.zoom * pixelSize + transform.offsetX),
    y: Math.round(coordinate.y * transform.zoom * pixelSize + transform.offsetY)
  };
}

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function calculateFitZoom(container: Size, canvas: Size, padding = 48): number {
  const availableWidth = Math.max(1, container.width - padding);
  const availableHeight = Math.max(1, container.height - padding);
  return clampZoom(Math.floor(Math.min(availableWidth / canvas.width, availableHeight / canvas.height)));
}

export function zoomAroundPointer(
  current: ViewTransform,
  pointer: Coordinate,
  nextZoom: number
): ViewTransform {
  const zoom = clampZoom(nextZoom);
  const canvasX = (pointer.x - current.offsetX) / current.zoom;
  const canvasY = (pointer.y - current.offsetY) / current.zoom;

  return {
    zoom,
    offsetX: pointer.x - canvasX * zoom,
    offsetY: pointer.y - canvasY * zoom
  };
}
