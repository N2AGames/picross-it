/**
 * Calculate bounding box of opaque pixels in image data
 */
export function calculateBoundingBox(data, width, height, alphaThreshold = 128) {
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const alpha = data[index + 3];
            if (alpha > alphaThreshold) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
    }
    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    return { minX, minY, maxX, maxY, width: cropWidth, height: cropHeight };
}
//# sourceMappingURL=imageAnalysis.js.map