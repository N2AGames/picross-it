import { ProcessingConfig, ProcessingResult } from './types';
import { PicrossBoardData, PicrossCellData, PicrossClueData, PicrossRowData } from './picross-board-data.model';
import {
  colorToIndex,
  getPixelData,
  indexToColor,
  isOpaque,
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
  const boardMatrix: number[][] = Array.from({ length: boardSize }, () =>
    Array(boardSize).fill(-1)
  );

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const isOpaquePixel = isOpaque(scaledData, boardSize, row, col, alphaThreshold);

      if (isOpaquePixel) {
        if (colorMode) {
          const pixel = getPixelData(scaledData, boardSize, row, col);
          boardMatrix[row][col] = colorToIndex(pixel, alphaThreshold);
        } else {
          boardMatrix[row][col] = 255;
        }
      }
    }
  }

  return {
    board: buildPicrossBoardData(boardMatrix, colorMode),
    boardSize,
  };
}

function buildPicrossBoardData(boardMatrix: number[][], colorMode: boolean): PicrossBoardData {
  const rows: PicrossRowData[] = boardMatrix.map((row) => ({
    cells: row.map((value) => buildCellData(value, colorMode)),
  }));

  const rowClues = boardMatrix.map((row) => buildLineClues(row));
  const columnClues = buildColumnClues(boardMatrix);

  return {
    rows,
    rowClues,
    columnClues,
  };
}

function buildCellData(value: number, colorMode: boolean): PicrossCellData {
  const isFilled = value >= 0;

  return {
    color: getCellColor(value, colorMode),
    enabled: true,
    pushed: false,
    correct: isFilled,
  };
}

function getCellColor(value: number, colorMode: boolean): string {
  if (value < 0) {
    return '#d3d3d3'; // light gray
  }

  if (!colorMode) {
    return '#000000';
  }

  const { r, g, b } = indexToColor(value);
  return `rgb(${r}, ${g}, ${b})`;
}

function buildColumnClues(boardMatrix: number[][]): PicrossClueData[][] {
  const size = boardMatrix.length;
  const clues: PicrossClueData[][] = [];

  for (let col = 0; col < size; col++) {
    const columnValues = boardMatrix.map((row) => row[col]);
    clues.push(buildLineClues(columnValues));
  }

  return clues;
}

function buildLineClues(values: number[]): PicrossClueData[] {
  const clues: PicrossClueData[] = [];
  let run = { value: 0, completed: false };

  for (const value of values) {
    if (value >= 0) {
      run.value += 1;
      run.completed = false; // Placeholder, can be enhanced to track actual completion
    } else if (run.value > 0) {
      clues.push(run);
      run = { value: 0, completed: false };
    }
  }

  if (run.value > 0) {
    clues.push(run);
  }

  return clues.length > 0 ? clues : [{ value: 0, completed: false }];
}

type LineRunState = {
  length: number;
  solved: boolean;
};

function buildLineRunStates(cells: PicrossCellData[]): LineRunState[] {
  const runs: LineRunState[] = [];
  let runLength = 0;
  let runSolved = true;

  for (const cell of cells) {
    if (cell.correct) {
      runLength += 1;
      if (!(cell.pushed && cell.correct)) {
        runSolved = false;
      }
    } else if (runLength > 0) {
      runs.push({ length: runLength, solved: runSolved });
      runLength = 0;
      runSolved = true;
    }
  }

  if (runLength > 0) {
    runs.push({ length: runLength, solved: runSolved });
  }

  return runs;
}

function updateClueColorsForLine(
  cells: PicrossCellData[],
  clues: PicrossClueData[]
): void {
  const runs = buildLineRunStates(cells);
  const noRuns = runs.length === 0;

  clues.forEach((clue, index) => {
    let solved = false;

    if (clue.value === 0) {
      solved = noRuns;
    } else {
      const run = runs[index];
      solved = !!run && run.length === clue.value && run.solved;
    }

    clue.completed = solved;
  });
}

/**
 * Recalculate clue colors based on resolved cells.
 */
export function recalculateClueColors(board: PicrossBoardData): void {
  const rows = board.rows.map((row) => row.cells);
  rows.forEach((cells, rowIndex) => {
    const clues = board.rowClues[rowIndex];
    if (clues) {
      updateClueColorsForLine(cells, clues);
    }
  });

  const size = rows.length;
  for (let col = 0; col < size; col++) {
    const columnCells = rows.map((row) => row[col]).filter(Boolean) as PicrossCellData[];
    const clues = board.columnClues[col];
    if (columnCells.length > 0 && clues) {
      updateClueColorsForLine(columnCells, clues);
    }
  }
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
