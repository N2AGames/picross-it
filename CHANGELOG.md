# Changelog

## 1.2.0 - 2026-02-09
- Updated processing to map all non-transparent pixels instead of only edges.
- Added a solid-image test to ensure full pixel coverage.

## 1.1.2 - 2026-02-09
- Added RGB332 helpers to convert pixel color to 0..255 index and back.
- Refactored picross color conversion to use the new helper.

## 1.1.1 - 2026-02-08
- Added visual test artifacts (PNG) for board outputs when canvas is available.
- Added saving of the synthetic source image used in visual tests.

## 1.1.0 - 2026-02-07
- Added `colorMode` to enable color output with 1..255 indices.
- Added color quantization helper for RGB332 indices.
- Updated README with color mode configuration and palette example.
