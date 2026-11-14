# Site01 frozen evidence version history

## v1.0.0

The original Phase 3 frozen package. It is preserved byte-for-byte at `docs/nasa-research/frozen/site01/v1/` and is not modified by this correction.

## v1.0.1

This corrected package fixes the documented pixel-center Y transform:

- Incorrect documented formula: `Y = -4000 - 5 * (row + 0.5)`.
- Verified formula: `Y = -4000 + 2.5 - 5 * row`.
- Equivalent formula: `Y = -3997.5 - 5 * row`.

The correction was verified against the actual GeoTIFF geotransform, PGDA's pixel-registration convention, the original Phase 2 analysis implementation, and the independent Phase 4 implementation. The ROI5_C1 projected coordinate, evidence classifications, source dataset hashes, and expected shadow result are unchanged.

This is a documentation and metadata correction. No full scientific recomputation was performed. The v1.0.1 package carries forward the original evidence and provenance and adds semantic validation that rejects the incorrect formula.
