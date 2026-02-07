/**
 * Get pixel data from ImageData at a specific row and column
 */
export function getPixelData(data, boardSize, row, col) {
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
export function isOpaque(data, boardSize, row, col, alphaThreshold = 128) {
    const pixel = getPixelData(data, boardSize, row, col);
    return pixel.a > alphaThreshold;
}
/**
 * Calculate color difference between two pixels using Euclidean distance
 */
export function colorDifference(pixel1, pixel2) {
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
 * Quantize a pixel color into a 1..255 index using RGB332
 */
export function getColorIndex(pixel, alphaThreshold = 128) {
    if (pixel.a <= alphaThreshold) {
        return 0;
    }
    const r3 = pixel.r >> 5;
    const g3 = pixel.g >> 5;
    const b2 = pixel.b >> 6;
    const index = (r3 << 5) | (g3 << 2) | b2;
    return index === 0 ? 1 : index;
}
/**
 * Check if pixel has at least one transparent neighbor
 */
export function hasTransparentNeighbor(data, boardSize, row, col, alphaThreshold = 128) {
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
export function hasSignificantColorChange(data, boardSize, row, col, colorThreshold = 80, alphaThreshold = 128) {
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
//# sourceMappingURL=pixelAnalysis.js.map