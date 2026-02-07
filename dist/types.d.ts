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
    board: number[][];
    boardSize: number;
}
//# sourceMappingURL=types.d.ts.map