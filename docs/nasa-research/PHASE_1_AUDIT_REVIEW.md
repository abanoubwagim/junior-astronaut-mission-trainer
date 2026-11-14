# MoonBase — Phase 1 Audit Review

Research-only review completed 2026-11-14 UTC for Phase 2.  This review checks
the Phase 1 audit and its small metadata artifacts against the files actually
available in the local research workspace.  It does not change the game or
promote any research result into a gameplay value.

## Review conclusion

Phase 1 was directionally correct about the scientific boundaries, the PGDA
product family, the DE421/MOON_ME context, and the need to preserve LDEC,
uncertainty layers, and clones.  It contained one material reproducibility
defect: the local `ldec.tif` recorded in Phase 1 was truncated.  Its TIFF
directory claimed a complete 3,200 × 3,200 uncompressed float raster, but the
file was 14,402,728 bytes and could not contain the advertised strip offsets.
The original file is preserved outside Git as
`C:\Users\Abanoub\Desktop\moonbase-nasa-research\downloads\site01b\ldec_phase1_incomplete.tif`.
A complete public copy was retrieved for this phase and has a different
checksum.  All Phase 2 candidate and shadow calculations use the complete
copy, not the truncated file.

The published PGDA description also says that approximately 90% of the 5 m
pixels are interpolated.  The `LDEC` raster is therefore evidence about the
number of LOLA returns in a pixel, not proof that every interpolated DEM cell
was directly measured.

## Inputs reviewed

The following project files were read before analysis:

- `docs/NASA_DATA_AUDIT.md`
- `docs/nasa-research/PGDA_SITE01_METADATA.json`
- `docs/nasa-research/OSDR_STUDY_METADATA.json`
- `docs/nasa-research/DONKI_SEP_SAMPLE_2016-01-02.json`
- `docs/SCIENCE_REFERENCES.md`
- `docs/SCIENTIFIC_ASSUMPTIONS_AND_EQUATIONS.md`
- `docs/API_AND_ARCHITECTURE.md`
- `docs/GAME_RULES.md`

The repository baseline was also checked: branch `main`, latest commit
`4b69003b16096336264b41c1e807664a3d0d8a84`, and the pre-existing staged
deletions were left untouched.  No application source, Maven file, frontend
file, application configuration, or API contract was changed.

## File existence and checksum review

The files below were verified in the external research workspace.  The paths
are deliberately outside the repository so large source products are not
committed.

| Product | Local file | Size | SHA-256 | Review result |
|---|---|---:|---|---|
| Site01 surface | `downloads/site01b/surf.tif` | 40,980,810 | `3BA7B97CB00A2BCF21189C3AEB535F65AFC21207154AB9F0D43C5BDC1F7E747E` | complete |
| Site01 slope | `downloads/site01b/slp.tif` | 40,980,776 | `3A90035A4946B4A04B7332C52F0B2B1CFF71648BD8C105E14D8A7E15C6BCFE8E` | complete |
| Site01 LDEC, Phase 1 copy | `downloads/site01b/ldec_phase1_incomplete.tif` | 14,402,728 | `5F9FE99A58320B15613D1D8DAAC191DC71025A4D2AD8CB7721DC7CCB4247A2A7` | **incomplete; not used** |
| Site01 LDEC, Phase 2 copy | `downloads/site01b/ldec.tif` | 40,980,744 | `16D6ED21020AD48FA71D94E7437492ACF5BF04118F52BCD292F57F22EAD4CD23` | complete; used |
| Site01 elevation uncertainty | `downloads/site01b/toterr.tif` | 40,980,810 | `CF2CF52F52D2AA51E60D058010D10B0EBFB1D3E920F5A2B9A46EB6C51054AB1C` | complete |
| Site01 slope uncertainty | `downloads/site01b/slperr.tif` | 40,980,810 | `52BC3B239F61605E6BB98BAB6D6B17ACD22389C59E57336862157F2FBD643A33` | complete |
| Site01 ROI archive | `downloads/site01/Site01_ROIs.tgz` | 2,934 | `40B961417A344CE0274AECBAB522E171A22F658507D82E8FB4D7BC97526FFC4F` | complete; extracted and inspected |
| ROI shapefile | `roi/Site01_ROIs.shp` | 10,204 | `7BECAD19A382DB4F14EC33DD652AE37E18CC58D9C9236AFA75679C70C1D7A099` | complete |
| DEM clone 001 | `downloads/site01b/clone001_err.tif` | 40,987,165 | `242DE9E3DA624A276864CC4FA7C499E96981C95FD27583565E68E92434FAF05B` | complete; used |
| DEM clone 050 | `downloads/site01b/clone050_err.tif` | 40,987,161 | `5819388022B1F32D50EAB7BDD1C8D8446A9DDFCF88BA4693D24116F86EA02E37` | complete; used |
| DEM clone 100 | `downloads/site01b/clone100_err.tif` | 40,987,165 | `596DCDF341B411893E2994571685BD54F911BFB476855CA6CE8D8F0F5F676698` | complete; used |

The complete LDEC response length was checked against the official PGDA HTTP
`Content-Length` of 40,980,744 bytes before analysis.  The Phase 1 metadata
artifact remains a historical record of the first retrieval; the Phase 2
manifest records the corrected input checksum.

## Verified raster metadata

All five primary rasters and all three available clones have the same grid:

- 3,200 columns × 3,200 rows.
- IEEE 32-bit floating-point samples, one band, uncompressed, contiguous
  strips with one row per strip.
- GeoTIFF pixel scale 5 m × 5 m; row direction is −5 m in Y.
- Tie point `(0, 0, 0, -19000, -4000, 0)`.
- GeoTIFF raster type `PixelIsArea` (`GTRasterTypeGeoKey=1`), so the pixel
  centers used by the analysis are `x=-18997.5+5*column` and
  `y=-3997.5-5*row`.  This is consistent with the PGDA README's statement
  that the GMT pixel-registered X/Y values represent pixel centers; the raw
  tie point itself is the grid corner.
- Nodata is the GDAL/GeoTIFF string `nan`.  All pixels in the inspected ROI
  masks were finite for all five products, but finite does not mean directly
  observed.
- The GeoTIFF GeoKeys identify projected metre units, angular units of degrees,
  south-polar stereographic projection code 15, central meridian 0°, standard
  parallel −90°, and a spherical ellipsoid radius of 1,737,400 m.  The PRJ
  text still names the CRS/datum as `unknown`; it is not a conventional Earth
  EPSG CRS.
- The PGDA README is the source for the scientific frame context: south-polar
  stereographic X/Y in metres, `MOON_ME` of DE421, and pixel-registered
  coordinates.

Observed full-raster ranges from the complete files are:

| Product | Unit | Minimum | Maximum | Median |
|---|---|---:|---:|---:|
| surface | m | −523.1834 | 1959.4962 | 1200.2488 |
| slope | degree | 0 | 64.5882 | 12.2903 |
| LDEC | LOLA returns/pixel | 0 | 5 | 0 |
| total Z uncertainty | m RMS | 0.0616 | 5.5828 | 0.3719 |
| slope uncertainty | degree RMS | 0.6137 | 21.5110 | 1.9009 |

## ROI and coordinate review

The extracted ESRI shapefile contains seven polygon records.  The overall
source bounds are X/Y `−11657.5..−10167.5 m` and
`−12637.5..−11492.5 m`.  ROIs 4, 5, and 6 were rasterized using pixel-center
coordinates, not arbitrary map clicks.  Their Phase 2 mask sizes are 476,
345, and 355 pixels respectively, with 100% finite coverage across the five
required products.

The Phase 1 statement that longitude direction was not explicit in the
GeoTIFF was appropriate.  Phase 2 resolves the local geometric transform only
by using the conventional spherical inverse of the south-polar stereographic
definition: `rho=2R tan(c/2)`, `latitude=-90°+c`,
`longitude=atan2(x,-y)`, with `x=east`, `y=north`, and `R=1,737,400 m`.  This
is used to construct local Moon-frame vectors and is not exposed as a claimed
player-facing selenographic longitude.  A future production adapter should
validate that convention against the official PGDA processing source or point
cloud before displaying longitude labels.

## Unsupported, incorrect, or incomplete Phase 1 statements

1. **Incorrectly complete LDEC input.**  The Phase 1 audit called the original
   `ldec.tif` downloaded and inspected, but it was a truncated file.  Its
   metadata directory was readable; its pixel strips were not complete.  The
   Phase 2 run corrected this with the complete public response and records
   both hashes.
2. **Longitude convention remained unresolved.**  The Phase 1 caution was not
   an error.  A local projection convention is now documented for the derived
   analysis, but no longitude value is asserted as an official PGDA coordinate
   until an independent point-cloud/processing cross-check is completed.
3. **The published aggregate illumination result was not a local validation.**
   The Phase 1 audit correctly called PGDA's `>70% at 1 m` result a published
   aggregate/modelled result.  It cannot be reused as a statement that a
   particular point is always lit or shadowed.
4. **No direct laser interpretation.**  The Phase 1 documentation correctly
   preserved LDEC, uncertainty, and the approximately 90% interpolation note.
   The Phase 2 candidate analysis uses LDEC as a data-density indicator and
   does not reclassify zero-count interpolated cells as direct measurements.
5. **LEND metadata caveat.**  The Phase 1 review observed a migrated LEND label
   in which `STN2_COUNTS` is declared with `km/s` while count fields otherwise
   use counts.  That label-level inconsistency remains unresolved and the
   inspected commissioning record contains negative invalid-count sentinels;
   no LEND number was used in this terrain analysis.

## Remaining blockers after review

- Only clones 001, 050, and 100 were available locally.  The PGDA page lists
  100 clones; the Phase 2 result is a three-clone sensitivity check, not a
  statistical confidence interval.
- The full XYZI point cloud was not downloaded; LDEC and the PGDA uncertainty
  products are used instead.
- The PGDA illumination products/method implementation were not downloaded as
  a point-by-point validation dataset.  The Phase 2 method is an independent
  local DEM ray trace.
- A 5 m DEM cell is an interpolated surface estimate in most cells, not a
  5 m direct LOLA observation.  Local horizon results inherit DEM resolution,
  interpolation, and uncertainty limitations.
- High-cadence results are sampled at 15-minute epochs.  They establish a
  reproducible sequence of shadowed samples; they do not mathematically prove
  the exact transition instant between samples.
- The custom PRJ does not itself serialize the complete SPICE frame
  association.  Phase 2 uses the explicitly loaded DE421 `MOON_ME_DE421`
  frame and records that choice in the manifest.

## Review status

`REVIEWED_WITH_CORRECTION`.  The complete LDEC input, explicit pixel-center
transform, explicit SPICE frame, and three-clone sensitivity run are now
recorded.  The original Phase 1 audit is not silently treated as infallible,
and no application code was changed.
