import { processImageData, recalculateClueColors } from '../imageProcessor';
import { PicrossBoardData, PicrossClueData } from '../picross-board-data.model';
import { indexToColor } from '../utils/pixelAnalysis';
import fs from 'fs';
import path from 'path';

function buildSpiralMask(size: number): number[][] {
  const mask = Array.from({ length: size }, () => Array(size).fill(0));
  let top = 0;
  let left = 0;
  let bottom = size - 1;
  let right = size - 1;

  while (left <= right && top <= bottom) {
    for (let col = left; col <= right; col++) {
      mask[top][col] = 1;
    }
    for (let row = top + 1; row <= bottom; row++) {
      mask[row][right] = 1;
    }
    if (top < bottom) {
      for (let col = right - 1; col >= left; col--) {
        mask[bottom][col] = 1;
      }
    }
    if (left < right) {
      for (let row = bottom - 1; row > top; row--) {
        mask[row][left] = 1;
      }
    }

    top += 2;
    left += 2;
    bottom -= 2;
    right -= 2;
  }

  return mask;
}

function buildSolidMask(size: number): number[][] {
  return Array.from({ length: size }, () => Array(size).fill(1));
}

function buildMonoBoard(mask: number[][]): number[][] {
  return mask.map((row) => row.map((cell) => (cell === 1 ? 255 : -1)));
}

function createImageDataFromMask(mask: number[][]): ImageData {
  const size = mask.length;
  const data = new Uint8ClampedArray(size * size * 4);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const index = (row * size + col) * 4;
      if (mask[row][col] === 1) {
        // Use varying colors to simulate a complex image while staying predictable.
        data[index] = (row * 13 + col * 7) % 256;
        data[index + 1] = (row * 5 + col * 11) % 256;
        data[index + 2] = (row * 17 + col * 3) % 256;
        data[index + 3] = 255;
      } else {
        data[index] = 0;
        data[index + 1] = 0;
        data[index + 2] = 0;
        data[index + 3] = 0;
      }
    }
  }

  return { data, width: size, height: size } as ImageData;
}

function colorIndexFromRowCol(row: number, col: number): number {
  const r = (row * 13 + col * 7) % 256;
  const g = (row * 5 + col * 11) % 256;
  const b = (row * 17 + col * 3) % 256;
  const r3 = r >> 5;
  const g3 = g >> 5;
  const b2 = b >> 6;
  const index = (r3 << 5) | (g3 << 2) | b2;

  return index;
}

function buildColorBoard(mask: number[][]): number[][] {
  return mask.map((row, rowIndex) =>
    row.map((cell, colIndex) =>
      cell === 1 ? colorIndexFromRowCol(rowIndex, colIndex) : -1
    )
  );
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

function buildColumnClues(board: number[][]): PicrossClueData[][] {
  const size = board.length;
  const clues: PicrossClueData[][] = [];

  for (let col = 0; col < size; col++) {
    const columnValues = board.map((row) => row[col]);
    clues.push(buildLineClues(columnValues));
  }

  return clues;
}

function buildCellColor(value: number, colorMode: boolean): string {
  if (value < 0) {
    return '#d3d3d3';
  }

  if (!colorMode) {
    return '#000000';
  }

  const { r, g, b } = indexToColor(value);
  return `rgb(${r}, ${g}, ${b})`;
}

function buildBoardData(board: number[][], colorMode: boolean): PicrossBoardData {
  return {
    rows: board.map((row) => ({
      cells: row.map((value) => ({
        color: buildCellColor(value, colorMode),
        enabled: true,
        pushed: false,
        correct: value >= 0,
      })),
    })),
    rowClues: board.map((row) => buildLineClues(row)),
    columnClues: buildColumnClues(board),
  };
}

type CanvasModule = {
  createCanvas: (width: number, height: number) => any;
};

function tryLoadCanvas(): CanvasModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('canvas');
  } catch (error) {
    return null;
  }
}

function rgbFromColorIndex(index: number): { r: number; g: number; b: number } {
  if (index < 0) {
    return { r: 255, g: 255, b: 255 };
  }

  const r3 = (index >> 5) & 0x07;
  const g3 = (index >> 2) & 0x07;
  const b2 = index & 0x03;

  return {
    r: Math.round((r3 / 7) * 255),
    g: Math.round((g3 / 7) * 255),
    b: Math.round((b2 / 3) * 255),
  };
}

function writeBoardPng(
  board: number[][],
  filePath: string,
  options?: { cellSize?: number; colorMode?: boolean }
): void {
  const canvasModule = tryLoadCanvas();
  if (!canvasModule) {
    return;
  }

  const cellSize = options?.cellSize ?? 16;
  const size = board.length;
  const width = size * cellSize;
  const height = size * cellSize;
  const canvas = canvasModule.createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const value = board[row][col];
      let fill = 'white';

          if (options?.colorMode) {
            const { r, g, b } = rgbFromColorIndex(value);
            fill = `rgb(${r}, ${g}, ${b})`;
          } else if (value >= 0) {
            fill = 'black';
          }

      ctx.fillStyle = fill;
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, canvas.toBuffer('image/png'));
}

function writeImageDataPng(imageData: ImageData, filePath: string): void {
  const canvasModule = tryLoadCanvas();
  if (!canvasModule) {
    return;
  }

  const canvas = canvasModule.createCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d');
  const frame = ctx.createImageData(imageData.width, imageData.height);
  frame.data.set(imageData.data);
  ctx.putImageData(frame, 0, 0);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, canvas.toBuffer('image/png'));
}

describe('processImageData', () => {
  it('creates a picross matrix from a complex synthetic image', () => {
    const size = 16;
    const mask = buildSpiralMask(size);
    const imageData = createImageDataFromMask(mask);
    const expected = buildMonoBoard(mask);

    const result = processImageData(imageData, { boardSize: size });

    expect(result.boardSize).toBe(size);
    expect(result.board).toEqual(buildBoardData(expected, false));
  });

  it('creates a color picross matrix from a complex synthetic image', () => {
    const size = 16;
    const mask = buildSpiralMask(size);
    const imageData = createImageDataFromMask(mask);
    const expected = buildColorBoard(mask);

    const result = processImageData(imageData, {
      boardSize: size,
      colorMode: true,
    });

    expect(result.boardSize).toBe(size);
    expect(result.board).toEqual(buildBoardData(expected, true));
  });

  it('includes all opaque pixels for solid images', () => {
    const size = 12;
    const mask = buildSolidMask(size);
    const imageData = createImageDataFromMask(mask);
    const expected = buildMonoBoard(mask);

    const result = processImageData(imageData, { boardSize: size });

    expect(result.boardSize).toBe(size);
    expect(result.board).toEqual(buildBoardData(expected, false));
  });

  it('generates row and column hints for a custom pattern', () => {
    const mask = [
      [1, 1, 0, 1, 0],
      [0, 0, 0, 0, 0],
      [1, 1, 1, 0, 1],
      [0, 1, 0, 1, 1],
      [0, 0, 0, 1, 1],
    ];
    const imageData = createImageDataFromMask(mask);

    const result = processImageData(imageData, { boardSize: 5 });

    expect(result.board.rowClues).toEqual([
      [{value: 2, completed: false}, {value: 1, completed: false}],
      [{value: 0, completed: false}],
      [{value: 3, completed: false}, {value: 1, completed: false}],
      [{value: 1, completed: false}, {value: 2, completed: false}],
      [{value: 2, completed: false}],
    ]);
    expect(result.board.columnClues).toEqual([
      [{value: 1, completed: false}, {value: 1, completed: false}],
      [{value: 1, completed: false}, {value: 2, completed: false}],
      [{value: 1, completed: false}],
      [{value: 1, completed: false}, {value: 2, completed: false}],
      [{value: 3, completed: false}],
    ]);
  });

  it('writes a visual PNG artifact for inspection', () => {
    const size = 16;
    const mask = buildSpiralMask(size);
    const imageData = createImageDataFromMask(mask);
    const expected = buildMonoBoard(mask);

    const monoResult = processImageData(imageData, { boardSize: size });
    const colorResult = processImageData(imageData, {
      boardSize: size,
      colorMode: true,
    });

    expect(monoResult.board).toEqual(buildBoardData(expected, false));

    const artifactsDir = path.resolve(__dirname, 'artifacts');
    writeImageDataPng(
      imageData,
      path.join(artifactsDir, 'processImageData-spiral-source.png')
    );
    writeBoardPng(
      expected,
      path.join(artifactsDir, 'processImageData-spiral-mono.png')
    );
    writeBoardPng(
      buildColorBoard(mask),
      path.join(artifactsDir, 'processImageData-spiral-color.png'),
      { colorMode: true }
    );
  });

  it('check clue completion status based on a solved board', () => {
    const mask = [
      [1, 1, 0, 1, 0],
      [0, 0, 0, 0, 0],
      [1, 1, 1, 0, 1],
      [0, 1, 0, 1, 1],
      [0, 0, 0, 1, 1],
    ];
    const boardData = buildBoardData(buildMonoBoard(mask), false);
    const board: PicrossBoardData = {
      rows: boardData.rows.map((row) => ({
        cells: row.cells.map((cell) => ({
          ...cell,
          pushed: cell.correct,
        })),
      })),
      rowClues: boardData.rowClues,
      columnClues: boardData.columnClues,
    };
    expect(board.rows.every((row) => row.cells.every((cell) => cell.pushed === cell.correct))).toBe(true);
    recalculateClueColors(board);
    expect(board.rowClues).toEqual([
      [{value: 2, completed: true}, {value: 1, completed: true}],
      [{value: 0, completed: true}],
      [{value: 3, completed: true}, {value: 1, completed: true}],
      [{value: 1, completed: true}, {value: 2, completed: true}],
      [{value: 2, completed: true}],
    ]);
    expect(board.columnClues).toEqual([
      [{value: 1, completed: true}, {value: 1, completed: true}],
      [{value: 1, completed: true}, {value: 2, completed: true}],
      [{value: 1, completed: true}],
      [{value: 1, completed: true}, {value: 2, completed: true}],
      [{value: 3, completed: true}],
    ]);
  });
});
