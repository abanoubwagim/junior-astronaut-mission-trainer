# Site01 Terrain Shadow and Illumination Analysis

MoonBase Phase 2 research-only deliverable.  Analysis date: 2026-11-14 UTC.
Selected NASA region: **PGDA Site01 — Connecting Ridge**.  Product: Moon only.

This document validates a scientific scenario around a candidate point; it does
not connect NASA data to MoonBase, change mission rules, or claim NASA approval
of a habitat or solar-array coordinate.

## 1. Executive result

The actual Site01 DEM supports a defensible **local terrain-shadow example** at
one hypothetical research point in ROI 5:

- Candidate: `ROI5_C1`, projected X/Y `(-11152.5 m, -12052.5 m)`.
- Candidate surface elevation: `1951.2507 m` in the PGDA height field;
  `1.0199°` published slope; LDEC `2` returns/pixel; total Z RMS error
  `0.1381 m`.
- Exact example epoch: **2024-03-28 12:00:00 UTC**.
- Sun is above the idealized spherical-body horizon by approximately
  `0.10363°`, so the ideal reference body is illuminated.
- The local DEM horizon is higher than the Sun at both comparison heights:
  - 1 m above terrain: all four models (original plus clones 001/050/100) are
    shadowed; terrain-horizon elevation is `1.255–1.396°` and the obstruction
    margin is `1.151–1.293°`.
  - 5 m above terrain: all four models are still shadowed; horizon elevation is
    `0.158–0.300°` and margin is `0.054–0.196°`.
- The horizon obstruction is local: the blocking samples are approximately
  `150–225 m` from the candidate and the ray is not edge-truncated at this
  epoch.

A 15-minute refinement sweep found a stable **sampled** interval in which all
four DEM models were shadowed:

- at 1 m: every sampled epoch from `2024-03-27 00:00 UTC` through
  **`2024-03-30 12:30 UTC`**;
- at 5 m: every sampled epoch from `2024-03-27 20:00 UTC` through
  **`2024-03-29 16:15 UTC`**.

These are sequences of 15-minute computed samples, not mathematically exact
shadow-transition times.  The chosen exact epoch lies inside both intervals.

The result is classified **TEAM_DERIVED**, not DIRECT_MEASURED or NASA
validated.  It supports a child-facing statement such as “a nearby ridge can
block direct sunlight even when the open lunar horizon is lit.”  It does not
support watts, watt-hours, battery capacity, percentage power loss, panel
output, or a claim that all of Connecting Ridge is shadowed.

## 2. Inputs and reproducibility

The large source files remain outside Git under
`C:\Users\Abanoub\Desktop\moonbase-nasa-research`.  The Phase 1 review records
the full checksum table and the corrected LDEC retrieval.  Phase 2 generated
outputs are:

- `SITE01_CANDIDATE_LOCATIONS.csv`
- `SITE01_ILLUMINATION_SUMMARY.csv`
- `SITE01_SHADOW_ANALYSIS.geojson`
- `SITE01_SHADOW_PREVIEW.png`
- `SITE01_ANALYSIS_MANIFEST.json`
- `SITE01_TIME_SERIES_SUMMARY.csv`
- `SITE01_TRANSITION_SAMPLES.csv`
- `SITE01_TIME_SERIES_MANIFEST.json`

The main reproducible command is:

```text
python tools/nasa-research/site01/site01_shadow_analysis.py \
  --data-dir <external-research>/downloads/site01b \
  --roi-shapefile <external-research>/roi/Site01_ROIs.shp \
  --kernels-dir <external-research>/kernels/de421-site01 \
  --out-dir docs/nasa-research --max-range-m 8000 --step-m 5 --candidate-count 6
```

The dense comparison command used the same inputs and tested candidates
`ROI4_C1`, `ROI5_C1`, `ROI6_C1`, and `ROI6_C2` over the PGDA interval
`2024-01-01T00:00:00Z` to `2026-01-01T00:00:00Z` at 12-hour samples, followed
by a 15-minute local transition sweep.  Software versions recorded in the
manifests: Python 3.x, NumPy 2.5.4, and SpiceyPy 8.4.0 in the isolated
research-only environment.  No Maven or frontend dependency was installed or
changed.

## 3. Verified Site01 grid and reference frame

| Property | Verified value |
|---|---|
| Dimensions | 3,200 × 3,200 pixels |
| Pixel scale | 5 m in X; −5 m in raster row Y |
| TIFF sample | IEEE float32, one band, uncompressed |
| Raw tie point | `(0,0,0,-19000,-4000,0)` |
| GeoTIFF raster type | `PixelIsArea` (`GTRasterTypeGeoKey=1`) |
| Pixel-center origin used | `(-18997.5,-3997.5) m` |
| Raster X range at centers | `−18997.5..−3002.5 m` |
| Raster Y range at centers | `−3997.5..−19992.5 m` |
| Nodata | `NaN` |
| Projection | Custom/unnamed south-polar stereographic, central meridian 0°, standard parallel −90° |
| Map unit | metre |
| Lunar shape used for transform | sphere, radius `1,737,400 m` |
| SPICE geometry frame | explicit `MOON_ME_DE421`, frame ID 31007 |

The unambiguous transform used in code is:

```text
x_center(column) = -19000 + 5*(column + 0.5)
y_center(row)    = -4000  - 5*(row    + 0.5)
```

Thus the verified center ranges are `−18997.5..−3002.5 m` in X and
`−3997.5..−19992.5 m` in Y.  No longitude label is inferred from this
projected grid.

The raster metadata is internally consistent with the PGDA README, which says
that the products use south-polar stereographic X/Y metres in the DE421
`MOON_ME` reference frame and use GMT pixel-registered centers.  The raw PRJ
still calls the datum and CRS “unknown”; it is not a terrestrial EPSG
coordinate system.

## 4. ROI analysis

The ROI archive contains seven polygon records.  This phase evaluated all
records for context and ranked six separated points in each ROI.  ROIs 4, 5,
and 6 were then used for the requested candidate comparison.

| ROI | Pixel-center count | Finite coverage across all five products | Elevation median (m) | Slope median / p95 (deg) | LDEC median / p95 | Z RMS median / p95 (m) | Slope RMS median (deg) |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 4 | 476 | 100% | 1956.322 | 2.297 / 4.944 | 0 / 1 | 0.356 / 0.618 | 1.911 |
| 5 | 345 | 100% | 1950.926 | 1.899 / 3.962 | 0 / 1 | 0.294 / 0.465 | 1.783 |
| 6 | 355 | 100% | 1947.829 | 2.695 / 5.022 | 0 / 1 | 0.308 / 0.531 | 1.816 |

The zero LDEC median is important: most ROI pixels have no LOLA return in the
5 m cell even though the surface DEM is finite.  LDEC is retained as a
measurement-density indicator, not silently turned into an observation flag.

### Candidate ranking

The ranking score is a transparent selection aid, not a NASA suitability
criterion.  It is the weighted sum of: slope (0.35), LDEC (0.30), elevation
RMS (0.25), and slope RMS (0.10), each clipped against the observed product
range.  A small tie-break preference is added when the point is finite,
slope ≤15°, LDEC ≥1, and Z RMS ≤2 m.  Points are separated by at least 25 m.

| ROI | Candidate | Projected X/Y (m) | Slope (deg) | LDEC | Z RMS (m) | Slope RMS (deg) | Score | Interpretation |
|---:|---|---|---:|---:|---:|---:|---:|---|
| 4 | `ROI4_C1` | `−11302.5, −12212.5` | 2.728 | 2 | 0.114 | 1.515 | 0.8066 | highest combined data-density/quality score in ROI 4 |
| 4 | `ROI4_C2` | `−11307.5, −12172.5` | 0.851 | 1 | 0.129 | 2.101 | 0.7578 | lower-slope alternative |
| 5 | `ROI5_C1` | `−11152.5, −12052.5` | 1.020 | 2 | 0.138 | 2.110 | 0.8161 | selected shadow research point |
| 5 | `ROI5_C2` | `−11127.5, −11992.5` | 1.619 | 2 | 0.136 | 1.640 | 0.8137 | habitat-style lower-risk alternative |
| 6 | `ROI6_C1` | `−10842.5, −11757.5` | 2.941 | 3 | 0.126 | 1.690 | 0.8636 | highest combined score in ROI 6 |
| 6 | `ROI6_C2` | `−10817.5, −11777.5` | 5.236 | 2 | 0.142 | 1.579 | 0.7856 | shadow-sensitive alternate; steeper terrain |

Roles are intentionally distinct:

- **Candidate research coordinate:** `ROI5_C1`, because it has a low slope,
  two LOLA returns/pixel, low Z RMS, and a stable local shadow result in the
  available clone sensitivity run.
- **Hypothetical habitat coordinate:** `ROI5_C2`, a separate lower-slope/data
  quality alternative.  It is not NASA selected or approved and no shadow
  result is assigned to it by analogy.
- **Hypothetical solar-array coordinate for the example:** `ROI5_C1`, used
  only as a geometric test point at 1 m and 5 m above terrain.  This is not a
  deployed array, and it is not a solar hardware specification.

## 5. SPICE kernel compatibility

The selected kernel set is internally consistent with the PGDA DE421 frame
context.  The analysis uses the DE-specific frame `MOON_ME_DE421`, not an
unqualified generic frame alias.

| File | Type and use | Official source URL | Verified coverage / metadata |
|---|---|---|---|
| `de421.bsp` | SPK planetary ephemeris; Sun/Moon positions | [NAIF DE421](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de421.bsp) | Sun and Moon object coverage `1899-07-28 23:59:18.817` to `2053-10-08 23:58:50.818` UTC-equivalent SPICE display |
| `moon_pa_de421_1900-2050.bpc` | binary PCK; lunar orientation relative to J2000, frame `MOON_PA_DE421` (31006) | [NAIF lunar DE421 PCK](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/moon_pa_de421_1900-2050.bpc) | `1899-12-31 23:59:18.816` to `2050-12-31 23:58:50.816` |
| `moon_080317.tf` | frame kernel; defines `MOON_ME_DE421` (31007) relative to `MOON_PA_DE421`; file revision 2008-03-21 and explicitly names the compatible DE421 PCK | [NAIF lunar FK directory](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/) | static frame definitions; no independent time coverage |
| `naif0012.tls` | leap-seconds/time conversion kernel | [NAIF LSK directory](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/lsk/) | loaded successfully; required for UTC↔ET conversion |
| `pck00010.tpc` | text planetary constants; Moon radii queried as `[1737.4,1737.4,1737.4] km` | [NAIF PCK directory](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/) | static constants; orientation comes from the DE421 binary PCK |

Local files and checksums are captured in `SITE01_ANALYSIS_MANIFEST.json` and
the Phase 1 review.  The 2024–2026 analysis interval is inside both the DE421
SPK and the lunar PCK coverage.  No DE440 or other incompatible ephemeris was
mixed into the calculation.

The Sun vector is obtained with SPICE as the geometric vector from the Moon
observer to the Sun in `MOON_ME_DE421` at the exact UTC epoch.  The surface
point is transformed from the projected X/Y coordinate using the documented
spherical inverse and the DEM height.  This is a local geometric transform;
the analysis does not pretend the GeoTIFF itself is a DSK.

## 6. DEM-based terrain-shadow algorithm

The implementation is isolated in
`tools/nasa-research/site01/site01_shadow_analysis.py`.

1. Read the uncompressed float GeoTIFF strips and verify grid equality across
   surface, slope, LDEC, both uncertainty layers, and clones.
2. Rasterize each ROI using pixel-center X/Y values.
3. Generate separated candidate points from finite products and the documented
   ranking aid.  The DEM elevation, LDEC, Z RMS, and slope RMS remain separate
   fields.
4. For each candidate, epoch, height, and DEM model, query the Sun position
   through SPICE and construct a body-fixed surface point.
5. Compute the idealized reference-body elevation as the angle between the
   Sun vector and the local spherical radial direction.  This is the
   **ideal-body** test only.
6. Compute local surface normal from centered 5 m finite differences of the
   DEM.  This supports a local incidence diagnostic; it is not converted to
   power.
7. Project the Sun direction into local map X/Y, march toward the Sun from 5 m
   to 8,000 m in 5 m steps, and bilinearly interpolate the actual DEM at each
   sample.
8. Convert each terrain sample back to a spherical body-fixed point and compare
   its angular elevation above the candidate's local tangent plane with the
   Sun elevation.  A terrain horizon higher than the Sun by more than 0.02°
   marks a terrain obstruction.  The margin threshold is a numerical
   tolerance, not a confidence level.
9. If the ray leaves the raster, the result is flagged `edge_truncated`; it is
   not silently treated as an unobstructed infinite horizon.  At the selected
   2024-03-28 12:00 UTC scenario, `edge_truncated=false` for all four DEM
   models and both heights.

The algorithm uses the actual DEM surface around the candidate and handles the
Moon's local curvature through the spherical point construction.  It is not a
SPICE DSK calculation, not a flat “solar elevation only” shortcut, and not a
measurement made by NASA at the candidate.

## 7. Candidate-specific illumination results

### Exact validation epoch: 2024-03-28 12:00:00 UTC

| DEM model | Height (m) | Ideal elevation (deg) | Terrain horizon (deg) | Obstruction margin (deg) | Blocking distance (m) | Direct visibility |
|---|---:|---:|---:|---:|---:|---|
| original | 1 | 0.103630 | 1.315269 | 1.211639 | 220.24 | shadowed |
| clone001 | 1 | 0.103630 | 1.254566 | 1.150936 | 205.23 | shadowed |
| clone050 | 1 | 0.103630 | 1.396162 | 1.292532 | 150.17 | shadowed |
| clone100 | 1 | 0.103630 | 1.269787 | 1.166156 | 200.22 | shadowed |
| original | 5 | 0.103629 | 0.287717 | 0.184088 | 225.25 | shadowed |
| clone001 | 5 | 0.103629 | 0.158114 | 0.054486 | 220.24 | shadowed |
| clone050 | 5 | 0.103629 | 0.299625 | 0.195997 | 220.24 | shadowed |
| clone100 | 5 | 0.103629 | 0.206331 | 0.102702 | 220.24 | shadowed |

This result is robust in the limited sense that all three available clones
retain the shadow classification at this exact epoch and at both comparison
heights.  It is not a statistical confidence interval because 97 of the
listed 100 clones were not present locally.

### Sampled intervals and height sensitivity

The dense transition run used 15-minute samples from 2024-03-27 through
2024-03-31.  It found the following common sampled sub-intervals across the
original DEM and clones 001, 050, and 100:

| Height above terrain | Common sampled shadow interval | Samples | Interpretation |
|---:|---|---:|---|
| 1 m | 2024-03-27 00:00 UTC through 2024-03-30 12:30 UTC | every 15 min | all four DEM models shadowed at every sampled epoch |
| 5 m | 2024-03-27 20:00 UTC through 2024-03-29 16:15 UTC | every 15 min | all four DEM models shadowed at every sampled epoch |

The 5 m interval is shorter and the margins are smaller, which is the expected
height sensitivity for a low-angle polar Sun.  A future engineering analysis
would need a denser transition search and an agreed time-continuity criterion
before publishing exact start/end times.

### Published-window comparison

The independent point sample run covered 2024-01-01 through 2026-01-01 at
12-hour samples.  For the original DEM:

| Candidate | Height | Ideal-body visible sample fraction | Direct terrain-visible sample fraction | Terrain-shadow samples | Edge-truncated samples |
|---|---:|---:|---:|---:|---:|
| `ROI4_C1` | 1 m | 0.3694 | 0.3687 | 1 | 239 |
| `ROI4_C1` | 5 m | 0.3694 | 0.3694 | 0 | 239 |
| `ROI5_C1` | 1 m | 0.3694 | 0.3269 | 62 | 149 |
| `ROI5_C1` | 5 m | 0.3694 | 0.3666 | 4 | 149 |
| `ROI6_C1` | 1 m | 0.3707 | 0.3639 | 10 | 207 |
| `ROI6_C1` | 5 m | 0.3707 | 0.3680 | 4 | 207 |
| `ROI6_C2` | 1 m | 0.3707 | 0.3187 | 76 | 205 |
| `ROI6_C2` | 5 m | 0.3707 | 0.3680 | 4 | 205 |

These local fractions are **not comparable as replacements** for PGDA's
published area-averaged illumination result: they are point samples at four
selected coordinates, with edge-truncated rays explicitly present.  They do
show why an aggregate favorable result can coexist with local terrain shadows.
The PGDA page reports that from 2024-01-01 through 2026-01-01 Site01 has the
most area with average illumination over 70% at 1 m, that ROIs 4–6 are
generally favorable, and that 5 m has longer continuous illumination.  This
analysis is consistent with that qualitative comparison but does not reproduce
PGDA's full area/time method.

## 8. Scientific classifications

| Conclusion or field | Classification | Reason |
|---|---|---|
| GeoTIFF surface heights, slopes, LDEC, uncertainty rasters | NASA_DERIVED | NASA PGDA products derived from LOLA tracks and interpolation |
| ROI polygon boundaries | NASA_DERIVED | NASA PGDA ROI archive |
| PGDA aggregate illumination statement | NASA_MODELLED | published modeled/aggregate result over a time window and heights |
| SPICE Sun vector at an exact epoch | NASA_DERIVED | computed from official NAIF kernels using a verified SPICE call |
| ROI statistics and candidate ranking | TEAM_DERIVED | computed from source rasters with stated selection score |
| Terrain horizon and direct-visibility flags | TEAM_DERIVED | DEM ray trace using source data and stated algorithm |
| Exact local shadow scenario | TEAM_DERIVED | stable across the three available clones at the selected sample, not NASA validation |
| Lunar surface solar-array power | UNAVAILABLE | no panel, orientation, efficiency, degradation, thermal, or operating model |
| Exact continuous transition time | UNAVAILABLE | high-cadence sample sequence does not prove an exact boundary |
| NASA-selected MoonBase habitat coordinate | UNAVAILABLE | NASA did not select or approve a MoonBase coordinate |

## 9. Day 1 scenario decision

The science supports retaining a **fictional educational terrain-shadow
scenario** only if its wording is narrowed:

> “At a hypothetical point in Site01, a nearby ridge blocks direct sunlight at
> the selected time.  The open lunar horizon is lit, but the local terrain is
> not.  Raising the comparison height changes the margin, so planners check
> the local horizon instead of assuming every nearby point gets the same light.”

The event must remain a game design abstraction.  The analysis does not justify
the fictional array's power drop as a measured power failure, and it does not
justify any numeric resource effect.  The current qualitative `POWER DROP`
event may remain unchanged pending scientific review; no application code was
modified in this phase.

For children aged 7–12, the safe explanation is “the ridge is in the way of the
Sun from this spot,” not “NASA measured that our base lost X% power.”

## 10. Limitations and unresolved questions

- The local projection-to-body transform is conventional and explicit, but the
  PGDA files do not expose a longitude axis.  Validate it against official
  PGDA point-cloud/processing material before presenting longitude.
- The actual source GeoTIFF is an interpolated DEM.  LDEC and RMS uncertainty
  are preserved; they are not a guarantee of per-pixel laser measurement.
- Only clones 001, 050, and 100 were available.  No confidence percentage or
  uncertainty interval is claimed.
- Ray tracing is limited to 8 km and stops at the raster edge.  Edge-truncated
  samples are reported; the selected exact epoch is not edge-truncated.
- The implementation is spherical for the map-to-body transform using the
  documented lunar radius.  It does not use a DSK or an independently
  generated high-order ellipsoid/terrain shape model.
- Sun vectors use geometric `NONE` aberration correction.  This is explicit;
  no hidden light-time or stellar-aberration assumption is used.
- The analysis did not reproduce every detail of PGDA's full area/time
  illumination pipeline, so the local fractions are comparison evidence, not
  a replacement dataset.
- No electrical power model was authorized.  Watts, watt-hours, battery
  capacity, solar-array output, degradation, and percentage power reduction
  remain unavailable.

## 11. Source bibliography

- [NASA PGDA — High-Resolution LOLA Topography for Lunar South Pole Sites](https://pgda.gsfc.nasa.gov/products/78)
- [NASA PGDA — Site01/LOLA 5 m data directory](https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/)
- [NASA PGDA — LOLA 5 m README](https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/README)
- Barker et al. (2021), [Improved LOLA Elevation Maps for South Pole Landing Sites](https://doi.org/10.1016/j.pss.2020.105119)
- Mazarico et al. (2011), [Illumination conditions of the lunar polar regions using LOLA topography](https://doi.org/10.1016/j.icarus.2010.10.030)
- [NAIF/JPL SPICE](https://naif.jpl.nasa.gov/)
- [NAIF DE421 SPK](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de421.bsp)
- [NAIF lunar DE421 binary PCK](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/moon_pa_de421_1900-2050.bpc)
- [NAIF satellite frame-kernel directory](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/)
- [NAIF lunar/Earth SPK-PCK frame guidance](https://naif.jpl.nasa.gov/pub/naif/self_training/individual_docs/A6_lunar-earth_pck-fk.pdf)

## 12. Phase boundary

This is the end of the research validation phase.  The next implementation
decision must wait for review and approval of this evidence.  No NASA runtime
client, gameplay mapping, API contract, or application behavior is changed by
these files.
