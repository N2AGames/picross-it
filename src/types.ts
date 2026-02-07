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
  // 0 = empty, 1 = filled (monochrome) or 1..255 (color mode)
  board: number[][];
  boardSize: number;
}
