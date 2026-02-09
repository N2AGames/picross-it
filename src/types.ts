/**
 * Represents pixel data with RGBA values
 */
export interface PixelData {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Configuration options for image processing
 */
export interface ProcessingConfig {
  boardSize?: number;
  colorThreshold?: number;
  alphaThreshold?: number;
  colorMode?: boolean;
}

/**
 * Result of image processing containing the picross board
 */
export interface ProcessingResult {
  // -1 = transparent, 0..255 = opaque (255 used for mono mode)
  board: number[][];
  boardSize: number;
}
