# Picross Image Processor

A TypeScript library to convert images to picross (nonogram) board representations by mapping all non-transparent pixels.

## Installation

```bash
npm install picross-image-processor
```

### Optional Canvas Support (Node.js only)

For Node.js file processing, optionally install canvas:

```bash
npm install canvas
```

## Usage

### Browser - From URL

```typescript
import { processImageUrl } from 'picross-image-processor';

async function createPicrossBoard() {
  const result = await processImageUrl('https://example.com/pokemon.png');
  console.log(result.board.rowClues);      // Row hints
  console.log(result.boardSize);  // 16
}
```

### Browser - From Canvas

```typescript
import { processImageData } from 'picross-image-processor';

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

const result = processImageData(imageData);
```

### Node.js - From File

```typescript
import { processImageFile } from 'picross-image-processor';

async function processLocalImage() {
  const result = await processImageFile('./pokemon.png');
  console.log(result.board.columnClues);
}
```

### With Custom Configuration

```typescript
import { processImageUrl, ProcessingConfig } from 'picross-image-processor';

const config: ProcessingConfig = {
  boardSize: 32,           // Default: 16
  colorThreshold: 100,     // Default: 80 (0-255, currently unused)
  alphaThreshold: 128,     // Default: 128 (0-255)
  colorMode: true          // Default: false
};

const result = await processImageUrl(imageUrl, config);
```

## Configuration

### `ProcessingConfig`

- **boardSize** (number, default: 16): The size of the output picross board (NxN)
- **colorThreshold** (number, default: 80): Reserved for future edge detection (currently unused)
- **alphaThreshold** (number, default: 128): The minimum alpha value to consider a pixel opaque (0-255)
- **colorMode** (boolean, default: false): When true, board values are 0..255 color indices instead of 255

## How It Works

1. **Bounding Box Detection**: Finds the smallest rectangle containing all opaque pixels
2. **Crop and Scale**: Crops the image to the bounding box and scales it to the board size
3. **Opaque Mapping**: Marks every non-transparent pixel as filled
4. **Board Values**: Creates a 2D array where -1 = transparent, 0..255 = opaque (255 in mono mode)

## API Reference

### `processImageData(imageData: ImageData, config?: ProcessingConfig): ProcessingResult`

Process ImageData directly (browser compatible).

### `processImageUrl(imageUrl: string, config?: ProcessingConfig): Promise<ProcessingResult>`

Process an image from a URL (browser compatible, requires CORS).

### `processCanvasImage(image: HTMLImageElement | HTMLCanvasElement, config?: ProcessingConfig): Promise<ProcessingResult>`

Process an HTML image element or canvas.

### `processImageFile(filePath: string, config?: ProcessingConfig): Promise<ProcessingResult>`

Process an image from a file path (Node.js only, requires canvas package).

## Result

The `ProcessingResult` contains:

```typescript
{
  board: PicrossBoardData;  // Rows + row/column clues
  boardSize: number;        // Size of the board
}
```

## Example: Drawing the Board

```typescript
function drawBoard(result: ProcessingResult) {
  const { board, boardSize } = result;
  const { rows } = board;
  const canvas = document.getElementById('board') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  
  const cellSize = 20;
  canvas.width = boardSize * cellSize;
  canvas.height = boardSize * cellSize;
  
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const x = col * cellSize;
      const y = row * cellSize;

      const cell = rows[row].cells[col];
      ctx.fillStyle = cell.enabled ? cell.color : '#fff';
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.strokeStyle = '#ccc';
      ctx.strokeRect(x, y, cellSize, cellSize);
    }
  }
}
```

## License

MIT

