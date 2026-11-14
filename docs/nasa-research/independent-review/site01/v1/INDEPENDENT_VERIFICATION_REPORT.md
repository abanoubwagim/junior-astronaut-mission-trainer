# Independent Site01 ROI5_C1 Verification

## Decision

**CONFIRMED_WITH_LIMITATIONS**

The independent calculation agrees with the frozen Phase 2/Phase 3 case: at `ROI5_C1`, projected X `-11152.5 m`, Y `-12052.5 m`, epoch `2024-03-28T12:00:00Z`, the Sun is above the idealized lunar horizon, while the sampled local terrain horizon blocks the direct solar ray at both 1 m and 5 m for `ORIGINAL`, `CLONE_001`, `CLONE_050`, and `CLONE_100`.

This is a team-derived independent verification using NASA-sourced inputs. It is not NASA approval, a NASA telemetry record, an installed solar-array result, or an electrical-power measurement.

## Independence and frozen-input integrity

- The frozen v1.0.0 package was treated as immutable.
- All package checksums, used PGDA files, and SPICE kernel hashes were verified before calculation.
- The complete LDEC hash was verified as `16D6ED21020AD48FA71D94E7437492ACF5BF04118F52BCD292F57F22EAD4CD23`; the incomplete Phase 1 copy was not used.
- The independent verifier does not import or call the Phase 2 scripts.
- It uses a separate TIFF reader, a separate south-polar inverse, independent local-frame construction, independent 3-D terrain-ray sampling, synthetic geometry tests, and a separate PNG writer.

## Coordinate and frame verification

The PGDA source identifies 5 m GeoTIFFs with south-polar stereographic X/Y coordinates in metres and the `MOON_ME` frame of DE421. The independent implementation used central meridian 0°, standard parallel/latitude of origin −90°, spherical radius `1737400.0 m`, pixel-center transform `x=-19000+5*(column+0.5)`, `y=-4000-5*(row+0.5)`, X east, and raster-row Y decreasing.

The frozen and independently used projected coordinate is identical: X/Y discrepancy `0.0 m`. The independently derived internal map unit vector in `MOON_ME_DE421` is `[np.float64(0.006936934989), np.float64(-0.006418931132), np.float64(-0.999955337131)]`. The candidate map scale factor is `1.000022331933`, or `0.002233%` from unit scale. The frozen package does not contain an asserted Cartesian surface point, so the Cartesian value is recorded as an independent output rather than compared to an unavailable frozen value.

The map inverse uses internal longitude `atan2(X, -Y)` only to construct the body-fixed unit vector; no player-facing longitude or latitude is introduced.

## Independent solar geometry

- UTC-to-ET result: `764899269.185648 s`; frozen ET difference: `0 s`.
- SPICE query: `spkpos("SUN", ET, "MOON_ME_DE421", "NONE", "MOON")`.
- Independent Sun position from the Moon: `[113619453.90224, -97404660.434797, -596634.083468] m`.
- Maximum difference from the frozen stored Sun position: `1.16415321827e-10 m`.
- The independent solar elevation is positive for every tested model and height.

## Independent 3-D terrain result

The method maps DEM samples to 3-D spherical surface points, derives a local tangent frame and outward surface normal from independent finite differences, projects the Sun direction into the tangent plane, and samples the actual DEM along that azimuth. For each terrain sample it evaluates the angular terrain horizon using the 3-D relative vector from the elevated observer. It reports the controlling sample, obstruction margin, obstacle height, and local line-of-sight clearance.

| Model | Height | Ideal elevation | Terrain horizon | Margin | Obstacle distance | LOS clearance | Result |
|---|---:|---:|---:|---:|---:|---:|---|
| ORIGINAL | 1 m | 0.103630° | 1.315269° | 1.211639° | 220.243 m | -4.658 m | SHADOWED |
| ORIGINAL | 5 m | 0.103629° | 0.287717° | 0.184088° | 225.248 m | -0.724 m | SHADOWED |
| CLONE_001 | 1 m | 0.103630° | 1.254566° | 1.150936° | 205.226 m | -4.123 m | SHADOWED |
| CLONE_001 | 5 m | 0.103629° | 0.158114° | 0.054486° | 220.243 m | -0.209 m | SHADOWED |
| CLONE_050 | 1 m | 0.103630° | 1.396162° | 1.292532° | 150.165 m | -3.388 m | SHADOWED |
| CLONE_050 | 5 m | 0.103629° | 0.299626° | 0.195997° | 220.243 m | -0.753 m | SHADOWED |
| CLONE_100 | 1 m | 0.103630° | 1.269787° | 1.166156° | 200.221 m | -4.076 m | SHADOWED |
| CLONE_100 | 5 m | 0.103629° | 0.206331° | 0.102702° | 220.243 m | -0.395 m | SHADOWED |

The margins are positive in every independent case. The smallest frozen-case margin is the 5 m `CLONE_001` result; it remains positive. The independent physical classification used positive angular obstruction margin, not the Phase 2 helper function or its hidden threshold.

## Curvature, projection, and sensitivity

The result was evaluated with spherical 3-D surface points. The report records the difference between the independent spherical terrain horizon and a local planar diagnostic. Projection scale at the candidate differs from unit scale by only about `0.002233%`; this is a local scale diagnostic, not a claim that projection distortion is globally negligible. Bilinear ray steps of 2.5 m, 5 m, and 10 m and nearest-neighbour 5 m sampling were also evaluated. Their classifications are preserved in `independent-shadow-results.json`.

Synthetic tests passed for flat/open, below-horizon, blocking ridge, non-blocking ridge, height-dependent obstruction, zero obstruction, and missing DEM data.

## Additional PGDA clone coverage

The official PGDA page lists 100 Site01 clone links. The research workspace already contained and independently verified clones 001, 050, and 100. No additional large clone files were downloaded in Phase 4. The four-model conclusion therefore remains separate from any complete 100-clone statistical statement.

The authoritative sources are the [PGDA product page](https://pgda.gsfc.nasa.gov/products/78) and the [PGDA LOLA DEM directory](https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/). A bulk 100-file request attempt was not used as evidence after the public server timed out repeated requests; the official page's 100-link inventory and the three locally verified clone files are reported separately.

## Time-series cross-validation

The independent CSV contains `2068` rows at the requested 15-minute sample spacing. It compares against the Phase 2 transition artifact at `2068` matching timestamps. There are `20` raw boolean-field differences across `10` unique transition samples; all are explained by the Phase 2 `0.02°` shadow threshold: the independent physical test reports a positive but sub-threshold obstruction margin, while Phase 2 reports that sample as open. Unexplained mismatches: `0`. Maximum numeric differences are recorded in `independent-shadow-results.json`.

These timestamps are sampled observations, not exact continuous astronomical transition boundaries. The independent result does not convert them into continuous intervals.

## Scientific confidence limitations

`CONFIRMED_WITH_LIMITATIONS` is warranted because the independent calculation agrees with the frozen classification and the sampled time-series booleans. Limitations remain: the PGDA projected CRS is custom/unnamed in the raster metadata; the body-frame inverse follows the documented PGDA convention; only three of the 100 listed clones were available locally; and no electrical-power model exists.

Day 1 is **not yet ready for final scientific approval**. It is ready for independent-review sign-off as a defensible educational sunlight-obstruction example, subject to review of the map-to-body transformation and optional expansion to the full clone set.

Generated artifacts:

- `independent-shadow-results.json`
- `independent-time-series.csv`
- `independent-verification-preview.png`
