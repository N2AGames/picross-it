import { ProcessingConfig, ProcessingResult } from './types';
/**
 * Process ImageData directly
 */
export declare function processImageData(imageData: ImageData, config?: ProcessingConfig): ProcessingResult;
/**
 * Process an image using Canvas API (browser compatible)
 */
export declare function processCanvasImage(image: HTMLImageElement | HTMLCanvasElement, config?: ProcessingConfig): Promise<ProcessingResult>;
/**
 * Process an image from a data URL (browser compatible)
 */
export declare function processImageUrl(imageUrl: string, config?: ProcessingConfig): Promise<ProcessingResult>;
/**
 * Process using canvas library (Node.js)
 * This will use the canvas package if available
 */
export declare function processImageFile(filePath: string, config?: ProcessingConfig): Promise<ProcessingResult>;
//# sourceMappingURL=imageProcessor.d.ts.map