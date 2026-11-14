# MoonBase Site01 frozen evidence package v1.0.1

This package is the corrected successor to the first versioned scientific record for NASA PGDA Site01 — Connecting Ridge. The original v1.0.0 package remains byte-for-byte unchanged at `docs/nasa-research/frozen/site01/v1/`.

Package version: `1.0.1`  
Status: `PRELIMINARY_RESEARCH_REVIEWED`  
Classification of the evidence result: `TEAM_DERIVED`  
Candidate: `ROI5_C1` at projected X `-11152.5 m`, Y `-12052.5 m`  
Reference frame: `MOON_ME_DE421`  
Reference epoch: `2024-03-28T12:00:00Z`  
SPICE ET: `764899269.185648 s`

The frozen result is:

> At the selected Site01 reference point and epoch, the idealized lunar horizon is illuminated, but local terrain obstructs direct sunlight.

At both 1 m and 5 m above terrain, the original DEM and the explicitly selected clone models `CLONE_001`, `CLONE_050`, and `CLONE_100` classify the point as `SHADOWED_BY_LOCAL_TERRAIN`. This is a reproducible educational research example, not a NASA-approved habitat coordinate, installed solar array, telemetry record, or electrical-power result.

## Documentation correction in v1.0.1

The v1.0.0 methodology documented the Y pixel-center formula as:

`Y = -4000 - 5 * (row + 0.5)`

That expression was inconsistent with the actual GeoTIFF geotransform (`origin Y = -4000 m`, `pixel height = -5 m`), PGDA's GMT pixel-registered center convention, and the Phase 2 and Phase 4 implementations. The corrected formula is:

`Y = -4000 + 2.5 - 5 * row`  
Equivalent: `Y = -3997.5 - 5 * row`

For ROI5_C1, the stored Y coordinate remains `-12052.5 m`. This is a documentation and metadata correction only. The evidence values, classifications, source hashes, and scientific result were carried forward; no full astronomical recomputation was performed for v1.0.1.

## Contents

- `manifest.json` — package identity, provenance, hashes, coordinates, epoch, and review state.
- `manifest.schema.json` — versioned structural JSON Schema for the manifest.
- `datasets.json` — PGDA input provenance and the exact complete LDEC correction.
- `kernels.json` — NAIF kernel provenance, coverage, and frame transformation chain.
- `methodology.json` — DEM ray-trace algorithm, map transform, parameters, and replay scope.
- `evidence.json` — eight normalized records: four DEM models at two heights, plus sampled time-series provenance.
- `day1-shadow-replay.json` — deterministic expected-result fixture with no live NASA request.
- `limitations.json` — scientific boundaries and unavailable inputs.
- `SHA256SUMS.txt` — checksums for package files except itself.
- `reproducibility-report.json` — output from the standard-library validator.
- `VERSION_HISTORY.md` — explicit v1.0.0 to v1.0.1 change record.

The large raw GeoTIFFs, ROI archive, and SPICE kernels remain in the external research workspace. Their absolute local paths, sizes, retrieval notes, and SHA-256 values are recorded in the package. They are intentionally not copied into this repository.

## Validate the freeze

From the repository root, using the isolated research Python environment:

```powershell
& C:\Users\Abanoub\Desktop\moonbase-nasa-research\site01-venv\Scripts\python.exe `
  tools\nasa-research\site01\validate_frozen_manifest_v1_0_1.py `
  --package docs\nasa-research\frozen\site01\v1.0.1 `
  --research-root C:\Users\Abanoub\Desktop\moonbase-nasa-research `
  --report docs\nasa-research\frozen\site01\v1.0.1\reproducibility-report.json `
  --write-sums
```

The validator performs three explicit checks:

1. Snapshot integrity: package JSON, source references, local input files, kernels, Phase 2 artifact hashes, and processing-script hashes.
2. Replay-fixture integrity: manifest/version references, evidence IDs, classifications, expected outcomes, source IDs, and dataset hashes.
3. Full scientific calculation reproduction: **not performed by this validator**. It does not call SPICE or rerun the DEM ray trace.

The `PASS` result therefore means that the corrected frozen snapshot is internally consistent, its semantic coordinate contract is valid, and the deterministic explanation can be reconstructed without live NASA access. It is not a fresh astronomical calculation.

## Scientific boundaries

- X/Y values are projected lunar map coordinates in metres, not latitude/longitude.
- Raster coordinates use pixel centers. The verified Y formula is `Y = -4000 + 2.5 - 5 * row`, equivalent to `Y = -3997.5 - 5 * row`.
- The complete corrected LDEC file is the only LDEC input. Its required SHA-256 is `16D6ED21020AD48FA71D94E7437492ACF5BF04118F52BCD292F57F22EAD4CD23`.
- The incomplete Phase 1 LDEC copy is recorded as excluded and is never used.
- `CLONE_001`, `CLONE_050`, and `CLONE_100` are three selected clone surfaces. They must not be described as a complete 100-clone uncertainty analysis.
- The 15-minute time series in `docs/nasa-research/SITE01_TRANSITION_SAMPLES.csv` is preserved by exact hash and source reference. Its first and last sampled shadow timestamps are not exact continuous astronomical transitions.
- Illumination is not electrical power. This package contains no panel, orientation, efficiency, degradation, demand, battery, or telemetry model.
- The fictional MoonBase POWER DROP event remains outside this package. No gameplay code or rule was changed.

## Human-readable wording prepared for review

Scientific explanation:

> At the selected Site01 reference point and epoch, the idealized lunar horizon is illuminated, but local terrain obstructs direct sunlight.

Child-friendly explanation:

> Even though the Sun is above the Moon's horizon, a nearby ridge can block its light from reaching this location.

Required limitation:

> The analysis demonstrates sunlight obstruction, not a measured electrical power reduction.

## Provenance categories

`NASA_PUBLISHED` is reserved for PGDA products, published PGDA metadata, and NASA/JPL kernel provenance. `TEAM_DERIVED` is used for ROI5_C1 selection, the local ray trace, the specific shadow result, sampled time-series outputs, and clone comparison. Game events, fictional equipment, and player resources remain `GAME_DESIGN` and are not part of this scientific freeze.

## Version history

- `v1.0.0` — original Phase 3 frozen package, preserved unchanged and not rewritten.
- `v1.0.1` — corrected the documented Y pixel-center transformation. No scientific result changed; full scientific recomputation was not performed.
