import { ProcessingConfig, ProcessingResult } from './types';
import {
  getColorIndex,
  getPixelData,
  isOpaque,
  hasTransparentNeighbor,
  hasSignificantColorChange,
} from './utils/pixelAnalysis';
import { calculateBoundingBox } from './utils/imageAnalysis';

/**
 * Process ImageData directly
 */
export function processImageData(
  imageData: ImageData,
  config?: ProcessingConfig
): ProcessingResult {
  const boardSize = config?.boardSize || 16;
  const colorThreshold = config?.colorThreshold || 80;
  const alphaThreshold = config?.alphaThreshold || 128;
  const colorMode = config?.colorMode || false;

  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  // Step 1: Find bounding box
  const bbox = calculateBoundingBox(data, width, height, alphaThreshold);

  // Step 2: Create scaled image data
  const scaledData = scaleImageData(data, width, height, bbox, boardSize);

  // Step 3: Convert to binary matrix
  const board: number[][] = Array.from({ length: boardSize }, () =>
    Array(boardSize).fill(0)
  );

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const isOpaquePixel = isOpaque(scaledData, boardSize, row, col, alphaThreshold);
      const hasTransparent = hasTransparentNeighbor(
        scaledData,
        boardSize,
        row,
        col,
        alphaThreshold
      );
      const hasColorChange = hasSignificantColorChange(
        scaledData,
        boardSize,
        row,
        col,
        colorThreshold,
        alphaThreshold
      );

      if (isOpaquePixel && (hasTransparent || hasColorChange)) {
        if (colorMode) {
          const pixel = getPixelData(scaledData, boardSize, row, col);
          board[row][col] = getColorIndex(pixel, alphaThreshold);
        } else {
          board[row][col] = 1;
        }
      }
    }
  }

  return {
    board,
    boardSize,
  };
}

/**
 * Scale image data from source bbox to target board size
 */
function scaleImageData(
  sourceData: Uint8ClampedArray | Uint8Array,
  sourceWidth: number,
  sourceHeight: number,
  bbox: any,
  boardSize: number
): Uint8ClampedArray {
  const scaledData = new Uint8ClampedArray(boardSize * boardSize * 4);

  const { minX, minY, width: bboxWidth, height: bboxHeight } = bbox;

  for (let targetRow = 0; targetRow < boardSize; targetRow++) {
    for (let targetCol = 0; targetCol < boardSize; targetCol++) {
      // Map target pixel to source pixel
      const sourceCol = Math.floor((targetCol / boardSize) * bboxWidth) + minX;
      const sourceRow = Math.floor((targetRow / boardSize) * bboxHeight) + minY;

      const sourceIndex = (sourceRow * sourceWidth + sourceCol) * 4;
      const targetIndex = (targetRow * boardSize + targetCol) * 4;

      if (sourceCol >= 0 && sourceCol < sourceWidth && sourceRow >= 0 && sourceRow < sourceHeight) {
        scaledData[targetIndex] = sourceData[sourceIndex];
        scaledData[targetIndex + 1] = sourceData[sourceIndex + 1];
        scaledData[targetIndex + 2] = sourceData[sourceIndex + 2];
        scaledData[targetIndex + 3] = sourceData[sourceIndex + 3];
      } else {
        scaledData[targetIndex] = 0;
        scaledData[targetIndex + 1] = 0;
        scaledData[targetIndex + 2] = 0;
        scaledData[targetIndex + 3] = 0;
      }
    }
  }

  return scaledData;
}

/**
 * Process an image using Canvas API (browser compatible)
 */
export async function processCanvasImage(
  image: HTMLImageElement | HTMLCanvasElement,
  config?: ProcessingConfig
): Promise<ProcessingResult> {
  const canvas = new OffscreenCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);

  return processImageData(imageData, config);
}

/**
 * Process an image from a data URL (browser compatible)
 */
export async function processImageUrl(
  imageUrl: string,
  config?: ProcessingConfig
): Promise<ProcessingResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = async () => {
      try {
        const result = await processCanvasImage(img, config);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    img.src = imageUrl;
  });
}

/**
 * Process using canvas library (Node.js)
 * This will use the canvas package if available
 */
export async function processImageFile(
  filePath: string,
  config?: ProcessingConfig
): Promise<ProcessingResult> {
  try {
    // Try to use canvas library if available
    const canvas = require('canvas');
    const image = await canvas.loadImage(filePath);
    
    const processCanvas = canvas.createCanvas(image.width, image.height);
    const ctx = processCanvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    return processImageData(imageData, config);
  } catch (error) {
    throw new Error(
      'Canvas library not available. Install canvas package for Node.js support: npm install canvas'
    );
  }
}
