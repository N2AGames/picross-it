import { PixelData } from '../types';

/**
 * Get pixel data from ImageData at a specific row and column
 */
export function getPixelData(
  data: Uint8ClampedArray,
  boardSize: number,
  row: number,
  col: number
): PixelData {
  if (row < 0 || row >= boardSize || col < 0 || col >= boardSize) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  const index = (row * boardSize + col) * 4;
  return {
    r: data[index],
    g: data[index + 1],
    b: data[index + 2],
    a: data[index + 3],
  };
}

/**
 * Check if a pixel is opaque based on alpha threshold
 */
export function isOpaque(
  data: Uint8ClampedArray,
  boardSize: number,
  row: number,
  col: number,
  alphaThreshold: number = 128
): boolean {
  const pixel = getPixelData(data, boardSize, row, col);
  return pixel.a > alphaThreshold;
}

/**
 * Calculate color difference between two pixels using Euclidean distance
 */
export function colorDifference(pixel1: PixelData, pixel2: PixelData): number {
  // If either pixel is transparent, return 0
  if (pixel1.a <= 128 || pixel2.a <= 128) {
    return 0;
  }

  const dr = pixel1.r - pixel2.r;
  const dg = pixel1.g - pixel2.g;
  const db = pixel1.b - pixel2.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Check if pixel has at least one transparent neighbor
 */
export function hasTransparentNeighbor(
  data: Uint8ClampedArray,
  boardSize: number,
  row: number,
  col: number,
  alphaThreshold: number = 128
): boolean {
  const neighbors = [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ];

  for (const [r, c] of neighbors) {
    if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) {
      // Edge of image counts as transparent neighbor
      return true;
    }
    if (!isOpaque(data, boardSize, r, c, alphaThreshold)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if pixel has significant color change with neighbors
 */
export function hasSignificantColorChange(
  data: Uint8ClampedArray,
  boardSize: number,
  row: number,
  col: number,
  colorThreshold: number = 80,
  alphaThreshold: number = 128
): boolean {
  if (!isOpaque(data, boardSize, row, col, alphaThreshold)) {
    return false;
  }

  const currentPixel = getPixelData(data, boardSize, row, col);

  const neighbors = [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ];

  for (const [r, c] of neighbors) {
    if (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
      const neighborPixel = getPixelData(data, boardSize, r, c);
      if (neighborPixel.a > alphaThreshold) {
        const diff = colorDifference(currentPixel, neighborPixel);
        if (diff > colorThreshold) {
          return true;
        }
      }
    }
  }

  return false;
}
