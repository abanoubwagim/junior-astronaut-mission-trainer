# MoonBase — NASA Data Audit

Research Phase 1 | captured 2026-11-13 | Moon only | Site01 — Connecting Ridge | audience 7–12

## 1. Executive summary

This is a research-only deliverable. No gameplay logic, frontend behavior, backend API, DTO, controller, rule, configuration, dependency, or NASA runtime request was changed. No commit or push was made.

The research established four useful but differently scoped evidence families:

- **Day 1:** NASA PGDA Site01 high-resolution LOLA elevation, slope, LOLA-return counts, uncertainty layers, ROI polygons, and representative DEM clones are available. The products support terrain and uncertainty education. PGDA also publishes favorable aggregate illumination results, but a location-specific shadow result is still unavailable because no final point, epoch, height, horizon ray-cast, and validated SPICE run have been fixed.
- **Day 2:** NASA LRO LEND RDR products measure orbital neutron data and provide hydrogen-related evidence at regional/orbital spatial scales. They do not confirm accessible water ice at Site01. NASA ISS ECLSS sources explain recovery and quality verification; the 98% result is an ISS result, not a lunar-base rate.
- **Day 3:** NASA OSDR OSD-267/GLDS-267 and OSD-655/LSDS-63 are public ISS crop studies. They provide experiment conditions, assay outputs, and downloadable files, but not lunar crop yields or guaranteed food production.
- **Day 4:** NASA PDS CRaTER calibrated-energy and processed-LET products characterize the radiation environment at LRO orbit. CCMC DONKI provides SEP event chronology, instruments, linked events, and notifications. Neither source is a surface-shelter dose model.

The official challenge Resources tab was retrieved in full. **DONKI** and **OSDR** are explicitly listed there and are therefore the recommended eligibility anchors. PGDA, LEND, and CRaTER are official NASA supporting sources but were not presented as challenge-tab resources.

## 2. Project and execution baseline

The repository was inspected before research. At the start of this phase:

- Branch: `main`.
- Latest commit: `4b69003b16096336264b41c1e807664a3d0d8a84` (`add files`, 2026-11-12).
- The working tree already contained staged deletions of historical presentation/test artifacts. Those pre-existing deletions were preserved.
- Active architecture is Java 17, Spring Boot 4.1.2, static HTML/CSS/vanilla JavaScript, stateless backend-authoritative deterministic replay, and no database, account, session, cookie, or saved mission progress.
- `MissionController`, `MissionDtos`, `MissionRulesService`, and `application.properties` contain no NASA request, NASA DTO, NASA setting, or NASA endpoint.
- The frontend only calls the local mission start/decision endpoints. No browser NASA request exists.

The active README, `docs/GAME_RULES.md`, `docs/SCIENCE_REFERENCES.md`, and `docs/API_AND_ARCHITECTURE.md` were treated as authoritative over superseded numeric/history documents. The current game values remain qualitative and fictional where the rules say so.

## 3. Official challenge Resources inventory

Source checked: [Junior Astronaut Mission Trainer — official challenge page](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/?tab=resources), Resources tab, retrieved 2026-11-13. The complete visible tab was inspected, not only the challenge description.

| Exact published resource title | Organization/mission | Official source URL | Identifier/access method/authentication | What it actually provides | MoonBase day |
|---|---|---|---|---|---|
| NASA Open APIs | NASA | [api.nasa.gov](https://api.nasa.gov/) | NASA Open APIs portal; individual APIs document their own schemas; portal advertises a free API key | Central portal including APOD, Mars Rover Photos, DONKI and other public APIs | Day 4 context; not required for the selected CCMC DONKI endpoint |
| Space Weather Database Of Notifications, Knowledge, Information (DONKI) | NASA CCMC | [CCMC DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) | Current documented REST server is `https://ccmc.gsfc.nasa.gov/DONKI-API`; query uses `startDate`, `endDate`, `catalog`, `version`; current OpenAPI has no API-key parameter | Near-real-time/archived space-weather event context, linked events, instruments, notifications, and analysis metadata | Day 4 |
| NASA Open Science Data Repository (OSDR) | NASA | [OSDR](https://osdr.nasa.gov/bio/repo/) | Public search API and public study/file endpoints; no key used | Space-biology and astronaut-health studies, metadata, assays, and downloadable files | Day 3 |
| RadLab (OSDR Radiation Dosimetry Database) | NASA OSDR | [RadLab data API](https://visualization.osdr.nasa.gov/radlab/gui/data-api/) | Public OSDR visualization/data service; no key used | ISS dosimetry data; useful context, not a Site01 surface dose | Day 4 context |
| Mars Trek | NASA | [Mars Trek](https://trek.nasa.gov/mars/) | Interactive web geospatial reference | Mars terrain and mission/geospatial education; not MoonBase scientific input | Not applicable |
| Space resources for STEM and youth organizations | Canadian Space Agency, partner resource | [CSA resource page](https://www.asc-csa.gc.ca/eng/youth-educators/resources-stem-and-youth-organizations.asp) | Public educational web reference | STEM/youth activities and space education | Educational reference |
| Toolkit for educators and youth — Food production on the Moon and in remote areas | Canadian Space Agency, partner resource | [CSA food-production toolkit](https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/) | Public educational web reference | Food-production education, activities, and ISS/space-food context; not a NASA measurement | Day 3 educational reference |

The two CSA entries are explicitly partner resources, not NASA datasets. The challenge page also carries the applicable non-endorsement disclaimer.

## 4. Authentication and secret handling

`NASA_API_KEY` was checked for presence in the process, user, and machine environments and was not available. No key value was printed, logged, placed in a URL, written to source, placed in frontend JavaScript, or added to `.env`. The existing backend `.env` was not modified.

The exact owner/API for the unavailable key cannot be identified without the variable or its provider metadata. This audit did not need it:

- PGDA GeoTIFFs and ROI archive were public downloads.
- PDS LEND and CRaTER files were public archive products.
- OSDR study metadata/file listings and one small transformed file were public.
- The current CCMC DONKI OpenAPI server is `https://ccmc.gsfc.nasa.gov/DONKI-API` and its documented SEP operation does not declare an API-key parameter. No `api.nasa.gov` DONKI request was used.

For a future local-only session, configure the variable without sending the secret to chat: `$env:NASA_API_KEY = "<key>"` for the current PowerShell process, or `setx NASA_API_KEY "<key>"` for future processes. Neither command was executed here.

## 5. Day 1 — Site01 terrain, uncertainty, and illumination

### 5.1 Product inventory and downloads

Primary sources: [PGDA Site01 product](https://pgda.gsfc.nasa.gov/products/78), [LOLA 5 m/pixel data directory](https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/), and [PGDA README](https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/README).

Downloaded outside the repository to `C:\Users\Abanoub\Desktop\moonbase-nasa-research\downloads`:

| Product | Local file | Retrieval UTC | SHA-256 | Inspection result |
|---|---|---:|---|---|
| `Site01_final_adj_5mpp_surf.tif` | `downloads/site01b/surf.tif` | 2026-11-13 20:25:30Z | `3BA7B97CB00A2BCF21189C3AEB535F65AFC21207154AB9F0D43C5BDC1F7E747E` | 3200×3200, 32-bit float, metres, NaN nodata; metadata range −523.1834 to 1959.4962 m |
| `Site01_final_adj_5mpp_slp.tif` | `downloads/site01b/slp.tif` | 2026-11-13 20:27:10Z | `3A90035A4946B4A04B7332C52F0B2B1CFF71648BD8C105E14D8A7E15C6BCFE8E` | 3200×3200, 32-bit float, degrees, NaN nodata; metadata range 0 to 64.5882° |
| `Site01_final_adj_5mpp_ldec.tif` | `downloads/site01b/ldec.tif` | 2026-11-13 20:27:56Z | `5F9FE99A58320B15613D1D8DAAC191DC71025A4D2AD8CB7721DC7CCB4247A2A7` | 3200×3200, 32-bit float, LOLA returns/pixel, NaN nodata; metadata range 0 to 5 |
| `Site01_final_adj_5mpp_toterr.tif` | `downloads/site01b/toterr.tif` | 2026-11-13 20:29:32Z | `CF2CF52F52D2AA51E60D058010D10B0EBFB1D3E920F5A2B9A46EB6C51054AB1C` | 3200×3200, 32-bit float, elevation RMS error in metres; range 0.0616 to 5.5828 m |
| `Site01_final_adj_5mpp_slperr.tif` | `downloads/site01b/slperr.tif` | 2026-11-13 20:31:24Z | `52BC3B239F61605E6BB98BAB6D6B17ACD22389C59E57336862157F2FBD643A33` | 3200×3200, 32-bit float, slope RMS error in degrees; range 0.6137 to 21.5110° |
| `Site01_ROIs.tgz` | `downloads/site01/Site01_ROIs.tgz` | 2026-11-13 20:23:30Z | `40B961417A344CE0274AECBAB522E171A22F658507D82E8FB4D7BC97526FFC4F` | 2934-byte archive; extracted shapefile inspected |
| Clone 001 error DEM | `downloads/site01b/clone001_err.tif` | 2026-11-13 21:21:46Z | `242DE9E3DA624A276864CC4FA7C499E96981C95FD27583565E68E92434FAF05B` | 3200×3200 representative clone |
| Clone 050 error DEM | `downloads/site01b/clone050_err.tif` | 2026-11-13 21:23:22Z | `5819388022B1F32D50EAB7BDD1C8D8446A9DDFCF88BA4693D24116F86EA02E37` | 3200×3200 representative clone |
| Clone 100 error DEM | `downloads/site01b/clone100_err.tif` | 2026-11-13 21:25:03Z | `596DCDF341B411893E2994571685BD54F911BFB476855CA6CE8D8F0F5F676698` | 3200×3200 representative clone |

All five primary rasters have 5 m/pixel scale, uncompressed 32-bit IEEE floating-point samples, and the same source history/tiepoint structure. The local TIFF inspection was performed from TIFF tags and the PGDA README because GDAL/rasterio were not installed in the research environment.

The products are **not** terrestrial EPSG rasters. Their GeoTIFF keys and the extracted `.prj` identify a custom/unnamed south-polar stereographic definition; the PGDA README supplies the authoritative lunar context: `MOON_ME` reference frame of DE421, metre X/Y, and pixel-centre registration. The source raster does not carry a per-pixel longitude axis. The `.prj` has central meridian 0° and standard parallel −90°, but longitude handedness was not independently asserted from these files. A future reprojection must validate the lunar mapping convention before exposing longitude to players.

The LDEC layer and both uncertainty layers are retained. A nonzero LDEC count is a count of LOLA returns in that pixel; an interpolated surface value is not automatically a direct laser measurement. PGDA explicitly reports that roughly 90% of the 5 m surface product is interpolated. The clone products are preserved as uncertainty-analysis inputs, not gameplay random seeds.

### 5.2 ROI inspection

The archive contains an ESRI Polygon shapefile (`Site01_ROIs.shp`, shape type 5), DBF, SHX, PRJ, and a GMT companion file. The extracted shapefile has seven ROI records. Overall bounds are X/Y `−11657.5..−10167.5 m` and `−12637.5..−11492.5 m`.

| ROI | X/Y bounding box in source metres | polygon points |
|---:|---|---:|
| 1 | −11657.5..−11522.5 / −12517.5..−12407.5 | 74 |
| 2 | −11537.5..−11447.5 / −12637.5..−12477.5 | 81 |
| 3 | −11392.5..−11297.5 / −12542.5..−12467.5 | 54 |
| 4 | −11372.5..−11212.5 / −12267.5..−12052.5 | 111 |
| 5 | −11177.5..−11002.5 / −12052.5..−11857.5 | 118 |
| 6 | −10887.5..−10727.5 / −11787.5..−11682.5 | 87 |
| 7 | −10277.5..−10167.5 / −11607.5..−11492.5 | 82 |

ROIs 4–6 are the candidate group named by the PGDA analysis as generally favorable. Their boundaries were inspected, but no habitat or solar-array coordinate was selected.

### 5.3 Illumination result and method boundary

The [PGDA Site01 page](https://pgda.gsfc.nasa.gov/products/78) reports an average illumination greater than 70% for Site01 at 1 m over the published 2024-01-01 through 2026-01-01 analysis interval, identifies ROIs 4–6 as generally favorable, and reports longer continuous illumination in the 5 m analysis. This is an aggregate/published analysis result; it does not mean every point is continuously lit.

NASA [PGDA Lunar Polar Illumination](https://pgda.gsfc.nasa.gov/products/69) states that illumination can be modeled at a point and time and that products are normally long-period averages. NASA NAIF documents the needed SPICE method: [SPK/PCK requirements for sub-solar geometry](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/cspice/subsol_c.html), [illumination API `ilumin_c`](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/info/mostused.html), and [kernel selection/coverage checks](https://naif.jpl.nasa.gov/naif/kernel_selection.html).

The defensible future test is:

1. Select a documented point inside an inspected ROI, while retaining its source X/Y and DEM pixel centre.
2. Select the exact UTC epoch and array reference height above the local DEM.
3. Load validated lunar SPICE LSK, SPK, PCK/frame kernels and compute the Sun direction in the Moon body-fixed frame.
4. Build the local DEM horizon from the 5 m terrain, with a stated treatment of NaN pixels, interpolation, uncertainty clones, and array height.
5. Mark the point shadowed only when the terrain horizon elevation exceeds the Sun elevation at that exact epoch.

That run was **not** completed in Phase 1: `spiceypy`/SPICE tooling was not installed, and selecting a final point would have been premature before the ROI inspection. Therefore the audit cannot truthfully say that a specific candidate solar-array location is shadowed. It can support a future terrain-shadow educational scenario. It cannot convert illumination percentage into watts, watt-hours, battery capacity, or panel production because panel area/orientation, efficiency, degradation, incidence-angle response, electrical architecture, and operating schedule are unavailable. The current Day 1 POWER DROP remains a simulated game event.

## 6. Day 2 — Water-resource evidence and water recovery

### 6.1 LRO LEND RDR

Source: [PDS LRO-L-LEND-4/5-RDR-V1.0](https://pds.nasa.gov/ds-view/pds/viewDataset.jsp?dsid=LRO-L-LEND-4%2F5-RDR-V1.0), [PDS Geosciences LRO holdings](https://pds-geosciences.wustl.edu/missions/lro/default.htm), [LEND RDR catalog](https://pds-geosciences.wustl.edu/lro/lro-l-lend-2-edr-v1/lrolen_0xxx/catalog/rdr_ds.cat), [LEND processing documentation](https://pds-geosciences.wustl.edu/lro/lro-l-lend-2-edr-v1/lrolen_0xxx/document/lend_data_processing.htm).

The current PDS release index lists the LEND RDR/EDR dataset in Release 0067. A representative PDS3/PDS4 migrated product was retrieved and inspected:

- Product: `LEND_RDR_DLD_20090627_DAT`, dataset `LRO-L-LEND-4/5-RDR-V1.0`, instrument LEND on LRO, target Moon.
- Local label: `C:\Users\Abanoub\Desktop\moonbase-nasa-research\lend_rdr_dld_20090627.lbl`; retrieved 2026-11-13 21:32:47Z; SHA-256 `3E394BFE6FB13B2300E9D926AE388B0BDD0DBBDC5801C247E69DA26659435FBD`.
- Local PDS4 label: `lend_rdr_dld_20090627.xml`; retrieved 2026-11-13 21:32:48Z; SHA-256 `D0910C661540A6E2150000E1996335483F2BFE63C9E5BEB367AE837AC0089302`.
- The associated 46-record binary table was also downloaded outside Git to `C:\Users\Abanoub\Desktop\moonbase-nasa-research\lend_rdr_dld_20090627.dat`; retrieved 2026-11-13 21:45:22Z; 10,994 bytes; SHA-256 `D503EAE955F9B15F24C855D965AD1C24ECA4CB9B3DF945F7B277D980D030CDE6`. The first record has UTC `2009-06-27T11:34:06`, latitude `−86.5225296°`, east longitude `44.0267334°`, collection duration `1 s`, and `STN1_COUNTS = −1.0 counts`; the label defines negative counts as “should not be used,” so this value is preserved as an invalid sentinel rather than treated as zero.
- Observation coverage in the label: 2009-06-27 11:34:06 through 11:34:51 UTC. The PDS catalog says LEND collects a new spectrum approximately every second, while collection intervals can vary.
- Measurement: neutron spectra/flux-related detector counts and corrected/background-subtracted products. The inspected DLD label/XML includes UTC, lunar-centric latitude/longitude fields, collection duration in seconds, detector background and counts in counts, and quality/context flags including solar activity and nadir pointing.
- Instrument meaning: eight ³He sensors measure thermal/epithermal neutrons; SHEN measures higher-energy neutron interactions. The instrument is an orbital neutron telescope, not a drill or water sampler.
- Spatial scale: the instrument context describes collimated polar mapping at roughly 5–10 km class resolution/FWHM under nominal orbit conditions, while gridded/averaged mapping products use larger map pixels. The resolution is orbital footprint scale, not 5 m Site01 scale.
- Quality/uncertainty: counts are statistical; the processing documentation describes exclusion of solar-particle-event intervals and outliers, efficiency warm-up correction, cosmic-ray normalization, and variance weighting. The record is not a direct mass fraction of water at a Site01 pixel.

Scientific classification: **NASA_DERIVED** for the corrected DLD product, with the underlying instrument observations being **DIRECT_MEASURED** neutron counts. For MoonBase use this is **CONTEXT_ONLY**. Hydrogen-related neutron suppression can motivate a child-friendly explanation of “hydrogen clues,” but it does not prove water ice, accessibility, extractability, potability, local abundance, or a usable reservoir at the habitat.

### 6.2 ECLSS and the ISS 98% milestone

Sources: [NASA Environmental Control and Life Support Systems](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/) and [NASA Achieves Water Recovery Milestone on the ISS](https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/).

NASA describes the ISS Water Recovery System as reclaiming wastewater, humidity condensate, and suit water, then using multi-filtration beds, a catalytic oxidizer, conductivity sensing, reprocessing of unacceptable water, and storage of accepted water. The page states that the ISS system recovers about 90% in its general description. The 2023 NASA milestone describes an ISS demonstration reaching 98% overall recovery after the Brine Processor Assembly; it also explains that sensors check purity and unacceptable water is reprocessed.

The 98% value is an **ISS observed/demonstrated system result**, not a lunar-base recovery rate. It is not a contamination measurement, and it does not provide a lunar potable-water quality threshold. MoonBase’s Day 2 WATER QUALITY ALERT remains a fictional educational scenario; it must not be presented as a NASA lunar observation.

## 7. Day 3 — OSDR space-crop evidence

Sources: [OSDR](https://osdr.nasa.gov/bio/repo/), [OSD-267](https://osdr.nasa.gov/bio/repo/data/studies/OSD-267), [OSD-655](https://osdr.nasa.gov/bio/repo/data/studies/OSD-655). The search API responses, study metadata, file listings, and one small OSD-655 transformed CSV were retrieved. OSDR metadata endpoints returned JSON; the file-list endpoint was queried with the documented study/version payload and returned public file keys, IDs, versions, sizes, and categories.

### OSD-267 / GLDS-267 / VEG-01A

- **Research ID:** `OSDR-OSD267-VEG01A`; **question:** what microbiological, nutritional, and environmental measurements were made for ISS lettuce in VEG-01A?
- **Study:** “Microbiological and nutritional analysis of lettuce crops grown on the International Space Station-VEG01A”; project VEG-01; flight program ISS; mission SpaceX-3; metadata mission dates 2014-04-18 to 2014-05-18; protocol states VEG-01A grew 2014-05-08 to 2014-06-10 and was harvested after 33 days.
- **Organism/setup:** red romaine lettuce, *Lactuca sativa* cv. Outredgeous, in Veggie pillows with porous arcillite substrate and controlled-release fertilizer; approximately 200 micromole m−2 s−1 PAR at the centre, 16 h light/8 h dark, LED spectral mix, environmental logger, ground controls, and −80°C sample storage.
- **Measured variables/units:** microbial counts including log10 CFU/g, 16S/ITS sequencing, elemental composition, phenolics, anthocyanins, and ORAC. Exact assay files are available through the public listing; no lunar yield unit exists in the study.
- **Availability:** public metadata version 8, total listed file size 1,413,577,232 bytes; a metadata ZIP is listed (101,319 bytes). Full raw/processed data were not copied into the repository.
- **Limitations/use:** ISS microgravity and controlled ground comparison; crop safety and chemistry context only. Classification **CONTEXT_ONLY**, review status **INSPECTED — not a lunar production model**.

### OSD-655 / LSDS-63 / VEG-04A/VEG-04B

- **Research ID:** `OSDR-OSD655-VEG04`; **question:** how did ISS mizuna lighting, harvest design, and flight/ground conditions relate to elemental and antioxidant assays?
- **Study:** “Pick-and-eat space crop production flight testing on the International Space Station (Elemental Analysis, ORAC, Phenolic Content)”; project VEG-04; identifiers VEG-04A/VEG-04B; ISS protocol dates 2019-06-06 to 2019-07-11 and 2019-10-03 to 2019-11-30. The search index also contains mission-index dates for SpaceX-16/18; the protocol dates were retained as the experiment dates because they describe the actual study runs.
- **Organism/setup:** mizuna, *Brassica rapa* var. Japonica/nipposinica, in VEGGIE pillows with 250 mL porous ceramic substrate and controlled-release fertilizer; red-rich 90%R:10%B and blue-rich 50%R:50%B treatments; shade cloth, photo-guided watering, ISS and 48-hour-offset ground controls.
- **Experimental design:** VEG-04A terminal harvest at 35 days after initiation; VEG-04B outer-leaf harvests at 29 and 43 days and whole-plant harvest at 58 days. VEG-04A fertilizer was too strong and caused salt stress/plant death; T70 was reduced by 47% for VEG-04B.
- **Measured variables/units:** ICP-OES elemental values in the retrieved transformed CSV are micrograms per gram dry weight; ORAC is reported as micromole Trolox equivalents per gram dry weight; phenolics use gallic-acid-equivalent reporting. A representative transformed CSV was downloaded outside the repository to `C:\Users\Abanoub\Desktop\moonbase-nasa-research\osd655-icpoes-transformed.csv`, retrieved 2026-11-13 21:34:40Z, 4462 bytes, SHA-256 `DD4234E094741A06315F1C0D95F32F9BDEB881C02F408227715EF22BCC337CB4`.
- **Representative original value:** row `VEG04A_GC_leaf_pillow3_red` reports aluminium `31.31 microgram/g dry weight` and potassium `33380.06 microgram/g dry weight`; these are assay observations for that ISS sample only and are not MoonBase food-resource values.
- **Availability:** public metadata version 2, total listed file size 26,492,007 bytes; data dictionary, ICP-OES, ORAC, phenolic transformed files, metadata ZIP, and supplemental files are listed. Only the small ICP-OES CSV was copied for inspection.
- **Limitations/use:** ISS crop experiment, pooled assay considerations, microgravity and ground controls, no lunar regolith, no lunar radiation/thermal environment, and no lunar crop yield model. Classification **CONTEXT_ONLY**, review status **INSPECTED — no gameplay numeric conversion permitted**.

Day 3 can use these studies to explain that crop production involves lighting, water, nutrients, growth checks, contamination checks, and harvest trade-offs. It cannot import any assay value as MoonBase food units, calories, growth rates, harvest durations, or guaranteed supply.

## 8. Day 4 — CRaTER and DONKI

### 8.1 LRO CRaTER PDS products

Sources: [NASA PDS Release 0067](https://pds.nasa.gov/datasearch/subscription-service/SS-20260915.shtml), [calibrated-energy collection](https://pds-ppi.igpp.ucla.edu/data/LRO-L-CRAT-3-CDR-CALIBRATED-V1.0/), [processed-LET collection](https://pds-ppi.igpp.ucla.edu/data/LRO-L-CRAT-3_4-DDR-PROCESSED-V1.0/), and the PDS product documentation.

Release 0067 lists both required families:

- `LRO-L-CRAT-3-CDR-CALIBRATED-V1.0` — calibrated energy data, PDS3, LRO CRaTER, Moon target.
- `LRO-L-CRAT-3/4-DDR-PROCESSED-V1.0` — processed/calibrated LET data, PDS3, LRO CRaTER, Moon target.

Representative labels inspected:

- `CRAT_L1_PRI_2026181_V01.LBL`, retrieved 2026-11-13 21:33:36Z, SHA-256 `D5ABFA02CEA5FCE5D36ACD1339926F81CD2DAEAE657A81E9B13F909FBC9A601F`; data coverage 2026-06-30 00:00:00.28 to 23:59:59.26 UTC; Level 1 primary energy product; record bytes 117; instrument CRAT, LRO.
- `CRAT_L2_PRI_2026181_V01.LBL`, retrieved 2026-11-13 21:33:37Z, SHA-256 `2BB4DF8A0270D67608F978394B7C2D4582C42BA96FF462DBC5CA4461D094C8D2`; same observation day; Level 2 primary processed LET product; record bytes 240.
- The inspected `CRAT_L2_PRI.FMT` defines deposited `ENERGY` in kilo electron volts, `LET` in kilo electron volts per micron, a data-quality indicator, signal-near-saturation flags, and low-level-discriminator threshold flags. The Level 1 format defines calibrated deposited energy in kilo electron volts.

CRaTER is a stacked detector/absorber cosmic-ray telescope. Its measurements are made from LRO orbit and are geometry-dependent on the instrument/spacecraft and particle direction; the archive provides spacecraft position and pointing/supporting fields in the product families. The labels/documentation do not turn these orbital measurements into the dose behind MoonBase’s fictional shelter, nor do they provide habitat wall composition, occupancy, secondary-particle transport, or surface exposure time. Classification: **DIRECT_MEASURED** for detector measurements and **NASA_DERIVED** for processed LET; MoonBase applicability: **CONTEXT_ONLY**.

### 8.2 DONKI SEP API

Sources: [official CCMC DONKI page](https://ccmc.gsfc.nasa.gov/tools/DONKI/), [CCMC API overview](https://ccmc.gsfc.nasa.gov/tools/API/), [DONKI event field reference](https://ccmc.gsfc.nasa.gov/DONKI/guide/data-reference/), and [DONKI OpenAPI reference](https://ccmc.gsfc.nasa.gov/DONKI/api/openapi/).

The official documentation confirms the post-2026-09-30 CCMC migration. The current server is `https://ccmc.gsfc.nasa.gov/DONKI-API`; path names remain under the DONKI API. The SEP operation accepts `startDate`, `endDate` (maximum 60-day window), `catalog` default `M2M_CATALOG`, and `version` default `Latest`. The schema returned fields including `sepID`, `eventTime`, `instruments`, `submissionTime`, `versionId`, `link`, `linkedEvents`, and `sentNotifications`. No API-key field was declared in the inspected OpenAPI.

Two responses were preserved in [DONKI_SEP_SAMPLE_2016-01-02.json](nasa-research/DONKI_SEP_SAMPLE_2016-01-02.json):

- Representative non-empty query retrieved 2026-11-13 21:25:45Z. It returned two 2016-01-02 SEP records with SOHO COSTEP 15.8–39.8 MeV and GOES-13 SEM/EPS >10 MeV instrument descriptions, event times, linked flare/CME IDs, notification times, and submission/version metadata.
- Current-window query for 2026-11-01 through 2026-11-13 retrieved 2026-11-13 21:25:26Z and returned `[]`. An empty query response is not a radiation-free guarantee.

DONKI SEP is **NASA_DERIVED/CONTEXT_ONLY** for MoonBase: it supports chronology and event-awareness education, not local lunar fluence, absorbed dose, dose equivalent, shelter attenuation, exposure thresholds, or survival guarantees. No dose number was invented.

## 9. Scientific evidence register

The following compact register applies the required classification vocabulary. Retrieval times are UTC; original observation/publication times are kept separate.

| Research ID | Topic/question | Source/title/identifier | Original observation or publication date | Measurement/value/unit and coverage | Environment/instrument/method; quality/uncertainty | Proposed educational/game use | Classification; review |
|---|---|---|---|---|---|---|---|
| `PGDA-S01-SURF` | What terrain is available at Connecting Ridge? | NASA PGDA, High-Resolution LOLA Topography for Lunar South Pole Sites; `Site01_final_adj_5mpp_surf.tif`; retrieved 2026-11-13 20:25:30Z | Product page 2021-era product family; static DEM has no single observation epoch | Surface height, m; 5 m/pixel, 3200×3200; observed metadata range −523.1834..1959.4962 m | LOLA-derived/interpolated DEM; NaN nodata; PGDA reports ~90% interpolated pixels | Explain that a map is a model of terrain; support a future terrain choice | `NASA_DERIVED`; inspected |
| `PGDA-S01-SLP` | How steep is each terrain cell? | Same PGDA product; `..._slp.tif`; retrieved 2026-11-13 20:27:10Z | Static product | Slope, degrees; 5 m/pixel; range 0..64.5882° | Derived from DEM; slope uncertainty is separate | Explain safe/steep terrain choices without inventing walkability thresholds | `NASA_DERIVED`; inspected |
| `PGDA-S01-LDEC-ERR` | How directly and confidently is terrain known? | Same PGDA product; LDEC, total-error, slope-error rasters; retrieved 2026-11-13 20:27:56–20:31:24Z | Static product | LDEC returns/pixel; elevation RMS m; slope RMS degree; ranges recorded above | LDEC 0..5; uncertainty rasters preserved; interpolation means a pixel is not necessarily a laser shot | Explain evidence quality and uncertainty | `NASA_DERIVED`; inspected |
| `PGDA-S01-ROI` | Which candidate areas are actually inside Site01 ROIs? | `Site01_ROIs.tgz`, ESRI Polygon shapefile; retrieved 2026-11-13 20:23:30Z | Static ROI archive | Seven polygon records and source X/Y bounds; no final habitat point selected | South-polar stereographic X/Y in metres; custom/unnamed PRJ; longitude sign not asserted | Future map/selection education | `NASA_DERIVED`; inspected |
| `PGDA-S01-ILLUM` | Is Site01 generally favorable for light? | PGDA Site01 illumination report; audit capture 2026-11-13 21:35:18Z | Published interval 2024-01-01..2026-01-01; page retrieved 2026-11-13 | Published average illumination >70% at 1 m; ROIs 4–6 favorable; 5 m longer continuous illumination | Aggregate/modelled product; not every point continuously lit; not watts | Explain that light can vary by place/time; retain POWER DROP as game-only | `NASA_MODELLED`; reviewed with limits |
| `PGDA-S01-SHADOW` | Is a specific array point shadowed at a specified time? | DEM + horizon + Sun ephemeris/SPICE method; audit capture 2026-11-13 21:35:18Z | Exact epoch not selected | No defensible numeric result yet | Final X/Y, height, epoch, kernels, horizon ray-cast, and uncertainty run unavailable | Future candidate-specific scenario only | `UNAVAILABLE`; open |
| `LEND-RDR-DLD` | Does orbital neutron data show hydrogen-related regional evidence? | NASA PDS LRO LEND RDR; `LEND_RDR_DLD_20090627_DAT`; label retrieved 2026-11-13 21:32:47Z | 2009-06-27 11:34:06..11:34:51 UTC sample; mission mapping from 2009 onward | Detector counts/backgrounds, collection duration seconds, lunar coordinates, flags; orbital footprint scale ~5–10 km class for collimated mapping | Corrected/background-subtracted/derived product; SPE/outlier exclusion and statistical uncertainty; not a water assay | Explain “hydrogen clue” vs “confirmed usable water” | `NASA_DERIVED` / `CONTEXT_ONLY`; inspected |
| `ECLSS-ISS-WRS` | How is recovered water checked? | NASA ECLSS reference; audit capture 2026-11-13 21:35:18Z | Page updated 2025-04-04 | No lunar measurement; quality acceptance/reprocessing process | ISS Water Recovery System; conductivity sensing, filtration, catalytic oxidation | Explain quality checks; fictional alert remains fictional | `EDUCATIONAL_EXPLANATION`; reviewed |
| `ECLSS-ISS-98` | What does the 98% number mean? | NASA ISS water recovery milestone; audit capture 2026-11-13 21:35:18Z | Published 2023-06-20 | 98% overall ISS recovery demonstration; rate is unitless percentage | ISS/BPA result, not lunar-base performance | Context for recycling trade-offs only | `DIRECT_MEASURED`/`CONTEXT_ONLY`; reviewed |
| `OSDR-OSD267` | What did VEG-01A measure? | NASA OSDR OSD-267 / GLDS-267; metadata retrieved 2026-11-13 21:27:43Z; file listing 21:28:34Z | ISS experiment 2014-05-08..2014-06-10; release 2020-02-21 | Microbial, sequencing, elemental, phenolic, anthocyanin, ORAC outputs; assay-specific units | ISS Veggie, ground controls, −80°C samples; no lunar analogue | Food-system process and safety education | `CONTEXT_ONLY`; inspected |
| `OSDR-OSD655` | What did VEG-04A/B measure? | NASA OSDR OSD-655 / LSDS-63; metadata retrieved 2026-11-13 21:27:45Z; file listing 21:28:35Z; CSV retrieved 21:34:40Z | ISS protocol 2019-06-06..2019-07-11 and 2019-10-03..2019-11-30; release 2025-12-22 | ICP-OES microgram/g dry weight; ORAC micromole Trolox-equivalent/g dry weight; phenolics gallic-acid-equivalent reporting | ISS VEGGIE; light treatments, harvest designs, fertilizer stress; no lunar yield | Explain crop trade-offs and monitoring | `CONTEXT_ONLY`; inspected |
| `CRAT-L1` | What energy does the LRO detector record? | NASA PDS CRaTER Release 0067 calibrated-energy collection; label retrieved 2026-11-13 21:33:36Z | Sample day 2026-06-30 | Deposited energy, kilo electron volts; one day in inspected label | LRO orbit; calibrated Level 1; PDS flags/support data apply | Explain radiation instruments and energy | `DIRECT_MEASURED`; inspected |
| `CRAT-L2` | What LET product is available? | NASA PDS CRaTER Release 0067 processed LET collection; label retrieved 2026-11-13 21:33:37Z | Sample day 2026-06-30 | LET, kilo electron volts per micron; quality/saturation/threshold flags | Processed Level 2 orbital detector data; not interior shelter dose | Explain energy deposition/LET at a high level | `NASA_DERIVED` / `CONTEXT_ONLY`; inspected |
| `DONKI-SEP` | What SEP event chronology is available? | CCMC DONKI SEP API; sample retrieved 2026-11-13 21:25:45Z; current-window response 21:25:26Z | Sample events 2016-01-02; query retrieved 2026-11-13 | Event ID/time, instrument descriptions, linked events, notification/submission metadata; no local-dose unit | Event catalog and analysis context; no Site01 geometry or shelter transport | Event-awareness narrative only | `NASA_DERIVED` / `CONTEXT_ONLY`; inspected |

## 10. Evidence-to-gameplay matrix

NASA observations/model outputs and game-design values remain separate. `UNAVAILABLE` is not treated as zero.

| Day | Gameplay event | NASA source | Actual data | Applicability | Verified inference | Game mechanic | Limitations | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | POWER DROP | PGDA Site01 DEM/illumination | 5 m terrain, slope, LDEC, uncertainty, ROIs, clones; published Site01 aggregate illumination | Site01 terrain; illumination is point/time dependent | Terrain can create shadows and favorable regions can still have interruptions | Keep the existing qualitative Power Drop event; optionally explain terrain shadow after a reviewed location-specific run | No final point/epoch/height/horizon/SPICE result; no panel/electrical model; illumination is not watts | **Do not change gameplay; research-ready** |
| 2 | WATER QUALITY ALERT | LEND RDR + NASA ISS ECLSS | LEND orbital neutron/hydrogen evidence; ECLSS recovery and acceptance/reprocessing explanation; ISS 98% result | LEND is regional lunar-orbit context; ECLSS is ISS engineering context | Hydrogen clue is not confirmed accessible water; recovered water is only usable after quality acceptance | Keep fictional alert and teach “retest, isolate, reprocess” | No Site01 water abundance/accessibility/potability/contamination measurement; no lunar recovery rate | **Do not change gameplay; educational context only** |
| 3 | Food-production warning | OSDR OSD-267/655 | ISS crop conditions and assay files | ISS crops, not lunar surface | Food production has lighting, water, nutrients, harvest, and safety trade-offs | Keep qualitative crop decision event; present experiment as context | No lunar yield, calories, growth/harvest rate, regolith model, or guarantee | **Do not change gameplay; educational context only** |
| 4 | Solar radiation alert / Storm Shelter | DONKI SEP + CRaTER | SEP chronology/instruments/links; orbital calibrated energy and LET | DONKI is event context; CRaTER is LRO orbit | An SEP event can motivate a shelter decision and chronology lesson | Keep fictional alert and shelter choice; do not assign real dose or shielding value | No surface dose, habitat wall transport, exposure threshold, or survival guarantee | **Do not change gameplay; contextual event evidence only** |

For every row, the answer to “does this justify changing gameplay?” is **no in Phase 1**. The evidence supports explanations and future reviewed content, not silent conversion into resource numbers or rule thresholds.

## 11. Data limitations and unresolved questions

Scientific inputs still unavailable:

- A final Site01 habitat/array X/Y, a validated X/Y-to-latitude/longitude conversion, and an independently verified longitude direction.
- A location-specific shadow result at an exact epoch, including array height, horizon distance/algorithm, SPICE kernel versions/coverage, DEM uncertainty treatment, and NaN/interpolation policy.
- Solar irradiance at the selected lunar epoch/location, panel geometry/orientation, efficiency, temperature response, degradation, conversion losses, storage, and load schedule. No real power or battery number is available.
- LEND-derived hydrogen/water inference at the exact Site01 ROI with a validated local abundance/accessibility/extraction model. LEND is not a drill or water-quality instrument.
- Lunar water recovery and potable-water acceptance rates. NASA’s 98% is ISS context.
- Lunar crop yield, calories, growth rate, harvest duration, microbial safety, regolith nutrient availability, and life-support coupling. OSDR studies are ISS experiments.
- Surface crew dose, shelter dose attenuation, shielding mass, SEP fluence/dose conversion, exposure limits, and survival probabilities. DONKI and CRaTER do not supply them.
- A reviewed rule for when a real-data display may affect the game. Until that review, game values remain `GAME_DESIGN` or fictional scenario values.

Other limitations:

- Full large GeoTIFFs, archives, OSDR raw files, and PDS data tables were intentionally kept outside Git. Only small metadata/representative JSON artifacts are in the repository.
- Windows research environment did not have GDAL, rasterio, pyproj, or SPICE Python bindings; raster/shape/PDS inspection used source metadata and small standard-library parsers. A future reproducibility run should use a pinned geospatial/SPICE environment.
- The official challenge page was verified in a browser because direct text retrieval did not expose the dynamic Resources tab. The complete tab contents were visually/DOM inspected; no unlisted resource was substituted.

## 12. Recommended future API adapters

These are recommendations only; none was implemented in this phase.

1. **PGDA static-product adapter:** a server-side/offline manifest for exact product URLs, checksums, GeoTIFF tags, ROI archive, and clone set. Treat files as versioned research inputs, not live gameplay requests.
2. **PDS product adapter:** an archive reader for PDS4/PDS3 labels and selected LEND/CRaTER records. Preserve label, release, observation interval, units, quality flags, and source checksum before any derivation.
3. **OSDR adapter:** a public study metadata/file-list client keyed by accession and version. Download only selected small assay/metadata files into a research cache; do not expose signed object-store URLs to the browser.
4. **CCMC DONKI adapter:** a server-side client using the current `DONKI-API` OpenAPI schema, bounded date windows, response caching, retrieval timestamps, and explicit empty-response handling. Do not add a key unless current CCMC documentation later requires it.
5. **Reference-only ECLSS adapter:** static citation/content metadata, not a lunar telemetry API.

## 13. Recommended integration architecture after review

The next implementation phase should begin only after this audit is reviewed and accepted. Recommended sequence:

1. Pin a research manifest containing source URLs, dataset IDs, product labels, retrieval UTC, observation coverage, checksums, units, quality flags, and classification.
2. Add a separate research-ingestion module or job, outside the mission rules path, that reads public NASA/PDS/OSDR/CCMC sources and stores normalized evidence snapshots. It must be server-side and never put a NASA key in frontend JavaScript.
3. Keep `DIRECT_MEASURED`, `NASA_MODELLED`, `NASA_DERIVED`, and contextual evidence separate from `GAME_DESIGN`. Require a review decision before any value can be exposed to a gameplay DTO.
4. Add deterministic replay fixtures from frozen snapshots, not live NASA calls during mission replay. Preserve source version/retrieval metadata in the fixture.
5. For Day 1, implement the validated terrain-shadow derivation first, including exact point/epoch/height and uncertainty sensitivity. Do not implement power conversion until a separate panel/electrical model is approved.
6. For Days 2–4, initially expose citations and qualitative explanations only. Do not create lunar water-quality, crop-yield, dose, shielding, or survival numbers from these sources.

This preserves the existing stateless, backend-authoritative architecture and keeps live NASA availability separate from deterministic gameplay.

## 14. Source bibliography

- [Official challenge Resources tab](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/?tab=resources)
- [NASA PGDA Site01 / high-resolution LOLA products](https://pgda.gsfc.nasa.gov/products/78)
- [NASA PGDA LOLA 5 m/pixel data directory](https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/)
- [NASA PGDA Lunar Polar Illumination](https://pgda.gsfc.nasa.gov/products/69)
- [NASA NAIF SPICE `subsol_c` requirements](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/cspice/subsol_c.html)
- [NASA PDS LEND dataset record](https://pds.nasa.gov/ds-view/pds/viewDataset.jsp?dsid=LRO-L-LEND-4%2F5-RDR-V1.0)
- [NASA PDS LRO holdings](https://pds-geosciences.wustl.edu/missions/lro/default.htm)
- [NASA LEND RDR catalog](https://pds-geosciences.wustl.edu/lro/lro-l-lend-2-edr-v1/lrolen_0xxx/catalog/rdr_ds.cat)
- [NASA LEND processing documentation](https://pds-geosciences.wustl.edu/lro/lro-l-lend-2-edr-v1/lrolen_0xxx/document/lend_data_processing.htm)
- [NASA ECLSS reference](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/)
- [NASA ISS 98% water recovery milestone](https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/)
- [NASA OSDR](https://osdr.nasa.gov/bio/repo/)
- [OSD-267 study](https://osdr.nasa.gov/bio/repo/data/studies/OSD-267)
- [OSD-655 study](https://osdr.nasa.gov/bio/repo/data/studies/OSD-655)
- [NASA PDS Release 0067](https://pds.nasa.gov/datasearch/subscription-service/SS-20260915.shtml)
- [NASA PDS CRaTER calibrated-energy collection](https://pds-ppi.igpp.ucla.edu/data/LRO-L-CRAT-3-CDR-CALIBRATED-V1.0/)
- [NASA PDS CRaTER processed-LET collection](https://pds-ppi.igpp.ucla.edu/data/LRO-L-CRAT-3_4-DDR-PROCESSED-V1.0/)
- [CCMC DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/)
- [CCMC API overview](https://ccmc.gsfc.nasa.gov/tools/API/)
- [DONKI OpenAPI reference](https://ccmc.gsfc.nasa.gov/DONKI/api/openapi/)
- [DONKI data reference](https://ccmc.gsfc.nasa.gov/DONKI/guide/data-reference/)
- [CSA space resources for STEM and youth organizations](https://www.asc-csa.gc.ca/eng/youth-educators/resources-stem-and-youth-organizations.asp)
- [CSA food-production toolkit](https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/)

## 15. Phase-1 verification checklist

- [x] Official challenge Resources tab retrieved and at least one explicitly listed NASA resource identified: DONKI and OSDR.
- [x] PGDA product URLs verified; Site01 files downloaded; raster metadata and ROI geometry inspected.
- [x] LDEC, elevation uncertainty, slope uncertainty, and representative clones preserved.
- [x] Interpolated DEM pixels not treated as direct laser measurements.
- [x] LEND PDS metadata and a representative RDR label inspected.
- [x] ISS ECLSS recovery/quality distinction recorded; 98% kept as ISS context.
- [x] OSDR study metadata/file listings retrieved; OSDR-655 transformed CSV inspected.
- [x] CRaTER Release 0067 calibrated-energy and processed-LET labels inspected.
- [x] Current CCMC DONKI endpoint/schema verified; representative SEP response preserved with retrieval time.
- [x] Retrieval times kept separate from observation/publication times.
- [x] No scientific value invented; missing values remain `UNAVAILABLE`.
- [x] `NASA_API_KEY` was not exposed or used; no `.env` edit.
- [x] No application source code was changed; no commit or push.

## 16. Phase-2 review addendum

The Phase 2 audit review found that the Phase 1 local `ldec.tif` copy was
truncated even though its TIFF directory was readable.  The incomplete copy is
preserved outside Git and a complete public PGDA response is now used by the
Phase 2 analysis.  See
[`docs/nasa-research/PHASE_1_AUDIT_REVIEW.md`](nasa-research/PHASE_1_AUDIT_REVIEW.md)
for both checksums and the correction.  A candidate-specific DEM/SPICE shadow
result is documented separately in
[`docs/nasa-research/SITE01_ILLUMINATION_ANALYSIS.md`](nasa-research/SITE01_ILLUMINATION_ANALYSIS.md);
it is a TEAM_DERIVED research result, not a NASA validation or an electrical
power measurement.

