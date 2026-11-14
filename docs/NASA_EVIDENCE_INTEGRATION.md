# Offline NASA Evidence Integration

## Scope

MoonBase bundles the reviewed NASA PGDA Site01 evidence package `v1.0.1` as a
read-only classpath resource. The backend does not contact NASA, does not use
`NASA_API_KEY`, and does not copy raw GeoTIFFs, DEM clones, ROI archives, or
SPICE binary kernels into the application.

The integrated research example is NASA PGDA Site01 — Connecting Ridge,
candidate `ROI5_C1`, projected coordinates X `-11152.5 m`, Y `-12052.5 m`,
reference frame `MOON_ME_DE421`, and epoch `2024-03-28T12:00:00Z`.

## Bundle and loading behavior

The compact bundle is at:

`mission-trainer-backend/src/main/resources/nasa-evidence/site01/v1.0.1/`

It carries the manifest, evidence records, replay fixture, dataset and kernel
provenance, corrected methodology, limitations, schema, version history,
reproducibility report, README, and `SHA256SUMS.txt`. A small supplementary
review summary records the existing Phase 4 and Phase 4.1 statuses:
`CONFIRMED_WITH_LIMITATIONS`, `CLOSED_WITH_LIMITATIONS`, and
`READY_WITH_LIMITATIONS`.

`Site01EvidenceProvider` loads these resources through the classpath, so the
same code works from the repository and from the packaged JAR. At startup it
parses the JSON with the dependency-free local parser and rejects missing,
malformed, mismatched, or wrong-version evidence. It validates the candidate,
frame, epoch, corrected pixel-center transform, replay outcomes, complete
LDEC provenance hash, eight records, four tested DEM model IDs, and bundle
SHA-256 entries.

The runtime checksum check covers the compact files inside the application
bundle only. The original NASA dataset hashes remain provenance references;
the large original binaries are not present in the JAR and are not claimed to
be revalidated by runtime startup.

## API response shape

`POST /api/v1/missions/start` returns `event.scientificEvidence` for Day 1.
The typed response includes NASA source organization, title, source URL, and
data URL; frozen manifest version, evidence ID, `TEAM_DERIVED` classification,
dataset identifier; site, candidate, projected X/Y coordinates, projection
description, frame, epoch, analyzed heights, horizon results, and the four
tested model IDs; independent review and frame-review statuses; child-friendly
and scientific explanations; team interpretation; research limits; provenance;
and the unavailable electrical-power status.

Day 2–Day 4 events return `scientificEvidence: null`; Day 1 terrain evidence
is never inherited by unrelated chapters. The browser cannot submit or alter
this object. The existing ordered decision-history request and both existing
mission endpoints are unchanged.

## Scientific classification policy

The NASA source record is labelled `NASA_PUBLISHED`. The selected point,
terrain ray calculation, local obstruction result, and independent review are
labelled `TEAM_DERIVED`. The fictional `POWER DROP`, solar equipment, choices,
and qualitative game state remain `GAME_DESIGN` / game scenario values.

The package supports this explanation:

> Even though the Sun is above the Moon's horizon, a nearby ridge can block its
> light from reaching this location.

The result does not measure electrical power. The API deliberately reports
electrical power measurement status as `UNAVAILABLE`; it does not expose watts,
watt-hours, battery capacity, or a power-loss percentage. Only four DEM models
were tested, not all 100 listed PGDA clones. The 15-minute time-series limits
remain sampled timestamps rather than exact continuous transitions.

## Frontend presentation

The Day 1 inspection panel shows a compact **RESEARCH EVIDENCE** card with the
NASA attribution, team-derived classification, child-friendly explanation,
and an accessible official-source link. A native expandable technical section
contains coordinates, frame, epoch, heights, model IDs, review statuses,
reported obstruction margin, provenance, and limitations. It is rendered from
the backend response and is not a second frontend copy of the scientific data.

## Verification

The backend provider tests validate classpath loading, package version,
candidate, coordinates, epoch, frame, classification, horizon distinction,
model coverage, the complete LDEC hash, unavailable electrical measurements,
and bundled checksums. MockMvc tests verify Day 1 API exposure and that a Day 2
response does not inherit the evidence. Frontend Node tests verify the evidence
rendering contract, missing-evidence rejection, and the absence of live NASA
URLs or embedded scientific measurements.

No scientific calculation is rerun by the application. This is an offline
evidence presentation integration, not live NASA telemetry or scientific
approval beyond the recorded `READY_WITH_LIMITATIONS` status.
