"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImageFile = exports.processImageUrl = exports.processCanvasImage = exports.processImageData = void 0;
// Main entry point
__exportStar(require("./types"), exports);
var imageProcessor_1 = require("./imageProcessor");
Object.defineProperty(exports, "processImageData", { enumerable: true, get: function () { return imageProcessor_1.processImageData; } });
Object.defineProperty(exports, "processCanvasImage", { enumerable: true, get: function () { return imageProcessor_1.processCanvasImage; } });
Object.defineProperty(exports, "processImageUrl", { enumerable: true, get: function () { return imageProcessor_1.processImageUrl; } });
Object.defineProperty(exports, "processImageFile", { enumerable: true, get: function () { return imageProcessor_1.processImageFile; } });
__exportStar(require("./utils/pixelAnalysis"), exports);
__exportStar(require("./utils/imageAnalysis"), exports);
//# sourceMappingURL=index.js.map