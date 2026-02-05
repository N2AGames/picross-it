import { PixelData } from '../types';
/**
 * Get pixel data from ImageData at a specific row and column
 */
export declare function getPixelData(data: Uint8ClampedArray, boardSize: number, row: number, col: number): PixelData;
/**
 * Check if a pixel is opaque based on alpha threshold
 */
export declare function isOpaque(data: Uint8ClampedArray, boardSize: number, row: number, col: number, alphaThreshold?: number): boolean;
/**
 * Calculate color difference between two pixels using Euclidean distance
 */
export declare function colorDifference(pixel1: PixelData, pixel2: PixelData): number;
/**
 * Check if pixel has at least one transparent neighbor
 */
export declare function hasTransparentNeighbor(data: Uint8ClampedArray, boardSize: number, row: number, col: number, alphaThreshold?: number): boolean;
/**
 * Check if pixel has significant color change with neighbors
 */
export declare function hasSignificantColorChange(data: Uint8ClampedArray, boardSize: number, row: number, col: number, colorThreshold?: number, alphaThreshold?: number): boolean;
//# sourceMappingURL=pixelAnalysis.d.ts.map