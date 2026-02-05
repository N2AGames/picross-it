/**
 * Find the bounding box of all opaque pixels in the image
 */
export interface BoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
}
/**
 * Calculate bounding box of opaque pixels in image data
 */
export declare function calculateBoundingBox(data: Uint8ClampedArray | Uint8Array, width: number, height: number, alphaThreshold?: number): BoundingBox;
//# sourceMappingURL=imageAnalysis.d.ts.map