# NASA Tools, Datasets, and Integration Status

## Bottom line

MoonBase does not currently integrate a NASA API or NASA dataset at runtime. The application has no NASA HTTP client, no scheduled data retrieval, no API key, no NASA JSON parsing, and no NASA data-to-game transformation. The only browser network calls are to the local MoonBase backend in [`mission-trainer-frontend/js/app.js`](../mission-trainer-frontend/js/app.js#L47-L75). The backend embeds source titles and URLs as constants in [`MissionRulesService.java`](../mission-trainer-backend/src/main/java/org/juniorastronaut/missiontrainer/game/MissionRulesService.java#L43-L61) and returns them as part of event data.

This is a positive scientific boundary: the project does not falsely present fictional values as live NASA measurements. It also means the project should answer “Which NASA API did you use?” with “None in the running application; we use cited NASA references to explain the themes, while the deterministic resource model is ours.”

## Classification

- **A — Actually integrated and used by the running application:** none found.
- **B — Used as static scientific references:** six NASA links are embedded in the rules service and surfaced in event responses; the frontend renders the returned links. They are not fetched as data.
- **C — Researched or discussed but not used by the running application:** DONKI, NASA Open APIs, OSDR, communication-delay sources, NASA Weather on the Moon, NTRS 19890004839, TechPort 10516, and TechPort 32946.
- **D — Potential future integration:** carefully scoped contextual data or teacher-facing links, only if a clear educational purpose and an explicit transformation are added. No future integration is required to make the current prototype honest.

## Repository evidence

| Evidence | Finding |
|---|---|
| `MissionRulesService.java:43-61` | Six URL constants: lunar dust NTRS 20240003496, TechPort 116295, ISS water recovery, NASA ECLSS, Advanced Plant Habitat, and NASA lunar radiation article. |
| `MissionRulesService.java:388-442` | Day events return those URLs as `ScienceSource` metadata. |
| `app.js:47-75` | `fetch` calls use the configured local `API_BASE`; no NASA host is called. |
| `app.js:77-92` | Frontend validates the MoonBase response structure, not a NASA payload. |
| `MissionRulesService.java:134-229` | All calculations use fixed in-code constants and selected choice IDs. |
| `README.md:33-39` | The project explicitly says resource values and outcomes are simplified game values, not engineering measurements. |
| `docs/SCIENCE_REFERENCES.md:3` | The project says NASA has not endorsed or validated it and game values are not NASA measurements. |
| `docs/moonbase-api.apidog.json` | API documentation includes MoonBase response source links, not an external NASA API contract. |

## Tools and sources actually surfaced by the application (classification B)

### 1. NASA/TM-20240003496 — lunar dust and vertical solar arrays

- **Official name:** *Lunar Dust Considerations for Vertical Solar Arrays Volume 1: Lunar Environment and Dust Interactions*.
- **Authors:** Christopher J. Wohl, James K. Burgess, Scott P. Belbin, Richard S. Pappa, Chuck B. Taylor, Meghan E. Bush, Phillip B. Abel, Christopher J. Wright, Thomas W. Kerslake, and Joseph R. Blandino.
- **Publication:** 1 October 2024; NASA/TM-20240003496; NTRS document ID 20240003496.
- **Official URL:** [NASA NTRS record](https://ntrs.nasa.gov/citations/20240003496); [technical memorandum PDF](https://ntrs.nasa.gov/api/citations/20240003496/downloads/TM-20240003496.pdf).
- **What it provides:** a technical discussion of lunar dust properties, environmental interactions, exposed-surface risks, and vertical solar-array efficiency challenges. It is a report, not an operational API.
- **MoonBase usage:** static citation in the Day 1 event; it supports the qualitative dust/power story.
- **Gameplay mechanic:** Day 1 offers a fictional array-maintenance choice with an immediate Power cost and delayed Power bonus.
- **Data status:** archived/static reference; no retrieval or parsing by MoonBase.
- **Attribution:** visible to players through the Day 1 returned science-source links.
- **Limitation:** it does not validate the game’s `+1 Power`, the three-turn duration, or manual brushing. The PDF warns that manually brushing arrays is not recommended because it can damage arrays; the game should describe the choice as fictional.

### 2. NASA TechPort project 116295 — DMFlex-ACO

- **Official name:** *Dust Mitigation for Flexible Solar Arrays (DMFlex-ACO)*.
- **Official URL:** [NASA TechPort project 116295](https://techport.nasa.gov/projects/116295).
- **What it provides:** project-level technology-development context for lunar-dust mitigation and flexible solar arrays.
- **MoonBase usage:** static citation in the Day 1 event.
- **Gameplay mechanic:** contextual support for treating exposed power hardware as a planning concern.
- **Data status:** project page/reference, not a dataset and not runtime data.
- **Attribution:** visible in the Day 1 science links.
- **Limitation:** TechPort project information does not establish the game’s fictional cleaning action or energy recovery.

### 3. NASA ISS water-recovery milestone

- **Official name:** *NASA Achieves Water Recovery Milestone on International Space Station*.
- **Author/team and date:** Melissa L. Gaskill, International Space Station Research Communications Team; 20 June 2023.
- **Official URL:** [NASA article](https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/).
- **What it provides:** an ISS report on the Water Processor Assembly, Urine Processor Assembly, Brine Processor Assembly, and the 98% total water-recovery goal demonstrated on the U.S. segment.
- **MoonBase usage:** static citation for the Day 2 recycler concept.
- **Gameplay mechanic:** `service_water_recycler` returns one immediate Water game unit and schedules one unit on each of Days 3–4.
- **Data status:** archived/static reference; no values are loaded into the game.
- **Attribution:** visible to players in Day 2 source links.
- **Limitation:** the 98% result is not lunar, not a game conversion, and not a claim about a MoonBase habitat. The game does not use a percentage.

### 4. NASA ECLSS reference

- **Official name:** *Environmental Control and Life Support Systems (ECLSS)*.
- **Institution:** NASA Marshall Space Flight Center / NASA reference page; page updated 4 April 2025.
- **Official URL:** [NASA ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/).
- **What it provides:** a system-level explanation of water recovery, air revitalization, CO₂ removal by molecular sieves, oxygen generation by electrolysis, and Sabatier processing.
- **MoonBase usage:** static citation in the Day 2 event.
- **Gameplay mechanic:** the `inspect_co2_removal_loop` choice changes only the simplified later Power upkeep; it produces no Oxygen and no Water.
- **Data status:** static engineering reference, not an API.
- **Attribution:** visible to players in Day 2 source links.
- **Limitation:** the game does not model actual ECLSS architecture, pressure, gas composition, electrolysis, CO₂ partial pressure, purity, or energy consumption.

### 5. NASA Advanced Plant Habitat

- **Official name:** *Advanced Plant Habitat*.
- **Institution:** NASA Science / International Space Station experiment.
- **Official URL:** [NASA Advanced Plant Habitat](https://science.nasa.gov/mission/advanced-plant-habitat/).
- **What it provides:** a description of a controlled plant-growth facility using LED lights, a porous clay substrate, controlled-release fertilizer, water, nutrients, and oxygen at roots; the page describes experiments lasting up to 135 days.
- **MoonBase usage:** static citation in the Day 3 event.
- **Gameplay mechanic:** `start_grow_light_tray` spends Power and Water and schedules a Day 4 Food harvest. The backend applies +2 Food when Water after Day 4 upkeep and scheduled recovery is 5 or lower, otherwise +4.
- **Data status:** static mission/experiment reference, not data consumed by the game.
- **Attribution:** visible to players in Day 3 source links.
- **Limitation:** no APH crop yield, duration, or energy data is mapped to the game values. The one-turn harvest is a time-compression rule.

### 6. NASA lunar radiation-protection article

- **Official name:** *How NASA Will Protect Astronauts From Space Radiation at the Moon*.
- **Institution/date:** NASA Science; 7 August 2019 as recorded in the repository’s reference table.
- **Official URL:** [NASA Science article](https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/).
- **What it provides:** qualitative context on solar energetic particle events, monitoring, and a representative Orion plan using stowage bags to make a denser shelter.
- **MoonBase usage:** static citation in the Day 4 event.
- **Gameplay mechanic:** Day 4 fictional alert; full and passive shelter choices; qualitative `protectionReady` state.
- **Data status:** static science reference, not a forecast or radiation dataset.
- **Attribution:** visible to players in Day 4 source links.
- **Limitation:** it does not support the 0–12 readiness scale, threshold 6, `−2` event effect, or any dose claim.

## Tools researched but not used by MoonBase (classification C)

### NASA Open APIs

- **Official name:** NASA Open APIs catalog.
- **Official URL:** [api.nasa.gov](https://api.nasa.gov/).
- **What it provides:** a catalog and documentation for NASA APIs, including image, Earth-observation, and other services; the catalog also links to programmatic OSDR interfaces.
- **Format/type:** varies by service; the catalog documents HTTP/JSON APIs.
- **Repository status:** not used. No `api.nasa.gov`, `images-api.nasa.gov`, or NASA API host appears in application fetch code.
- **Suitable future use:** only for a clearly scoped educational panel or curated image, not for inventing resource values. A live endpoint would add availability, attribution, caching, and reproducibility concerns.
- **Limitation:** an API’s existence does not make its data relevant to lunar habitat resource balance.

### CCMC DONKI

- **Official name:** Space Weather Database Of Notifications, Knowledge, Information (DONKI), operated by NASA’s Community Coordinated Modeling Center.
- **Official URLs:** [DONKI system](https://ccmc.gsfc.nasa.gov/tools/DONKI/); [CCMC public APIs](https://ccmc.gsfc.nasa.gov/tools/API/); [DONKI data reference](https://ccmc.gsfc.nasa.gov/DONKI/guide/data-reference/); [event guide](https://ccmc.gsfc.nasa.gov/DONKI/guide/events/).
- **What it provides:** near-real-time analyses, notifications, models, and linked space-weather events such as solar flares (FLR), solar energetic particles (SEP), coronal mass ejections (CME), interplanetary shocks, geomagnetic storms, radiation-belt enhancements, and high-speed streams.
- **Format/type:** public REST/OpenAPI web services; event records and analyses are queried by date and event type.
- **Repository status:** used as an attributed source context only. The backend returns the DONKI catalog URL, a visible `CURATED NASA DONKI SCENARIO` label, and a statement that the prototype does not claim to be a live measurement. No API key, live request, cache, or dose transformation is used.
- **MoonBase usage:** the Day 1–4 event payloads expose the hazard level and NASA source context; the Day 4 solar-particle event uses DONKI as a traceable space-weather reference while keeping all resource effects as game-only rules.
- **Limitation:** a DONKI SEP event record is not a local lunar-habitat radiation-dose measurement. It may describe event observations, analyses, forecasts, or links between events, but habitat dose requires particle spectra/fluence at the location, shielding geometry and materials, transport calculations, instrumentation, and crew/habitat context. A DONKI event must not be converted directly to a `Shelter readiness` value without a defensible scientific model.
- **Data quality note:** CCMC says DONKI information and simulations are provided in a prototyping/research context and should be used with relevant forecasters, model developers, or researchers for validation studies.

### NASA Open Science Data Repository (OSDR)

- **Official name:** NASA Open Science Data Repository.
- **Official URLs:** [OSDR overview](https://science.nasa.gov/biological-physical/data/osdr/); [OSDR FAQ](https://science.nasa.gov/reference/osdr-faq/); [data portal](https://osdr.nasa.gov/).
- **What it provides:** multimodal space-life-science data and metadata: omics, physiological, phenotypic, behavioral, bioimaging, environmental telemetry, hardware, text, code, images, video, and related study information from humans, animals, plants, microbes, and other models.
- **Format/type:** downloadable datasets/metadata and programmatic interfaces; the NASA Open APIs page lists OSDR REST endpoints for experiments, missions, payloads, hardware, vehicles, subjects, and biospecimens.
- **Repository status:** not used. No OSDR endpoint or dataset identifier appears in the running application.
- **Suitable future use:** a teacher-facing “real NASA research” reading/activity link about plant biology or human adaptation could be useful. It is not a direct source for four-day food yields or habitat Power costs.
- **Limitation:** OSDR is primarily space biology and related life-science data, not a ready-made lunar habitat resource-balance simulator. Using an OSDR experiment to set game values would require careful study selection and scientific justification.

### NTRS 19890004839 — lunar regolith shielding

- **Official name:** *Solar-flare shielding with Regolith at a lunar-base site*.
- **Authors:** John E. Nealy, John W. Wilson, and Lawrence W. Townsend, NASA Langley Research Center.
- **Publication:** 1 December 1988; NASA-TP-2869; NTRS document ID 19890004839.
- **Official URL:** [NTRS record](https://ntrs.nasa.gov/citations/19890004839).
- **What it provides:** predicted time-integrated radiation dose for candidate lunar habitat configurations and regolith slab thicknesses under analyzed solar-proton events.
- **Repository status:** not linked by the running application; it was researched for design/audit work.
- **Suitable future use:** scientific background for a later, separately validated shielding lesson.
- **Limitation:** it cannot support turning the current abstract readiness meter into a real dose or percentage without importing geometry, event spectra, transport calculations, and units.

### Communication sources

- [NASA Webb explainer](https://science.nasa.gov/mission/webb/science-overview/science-explainers/how-does-webb-see-back-in-time/) supports the 1.3-second one-way light-travel fact.
- [NTRS 20250000703](https://ntrs.nasa.gov/citations/20250000703), *Assessment of the State of Communication Delay Research in Preparation for Missions Beyond Low Earth Orbit*, is a 2025 NASA Human Research Program Investigators’ Workshop presentation. It discusses operational lunar one-way latencies of 3–14 seconds and human/operations effects.
- TechPort project pages [10516](https://techport.nasa.gov/projects/10516) and [32946](https://techport.nasa.gov/projects/32946) were supplied as research references in prior design work, but their JavaScript-rendered project content was not verifiable in the present browser extraction and neither is referenced by current application code.
- **Repository status:** the optional frontend text is present, but the running UI does not provide a clickable NASA communication source link. This is a documentation/attribution gap, not a NASA API integration.
- **Limitation:** the sources do not justify a next-day response or any artificial lunar network outage. MoonBase correctly keeps communication outside gameplay state.

### NASA Weather on the Moon

- **Official URL:** [Weather on the Moon](https://science.nasa.gov/moon/weather-on-the-moon/).
- **What it provides:** qualitative context about the Moon’s exosphere, solar wind, galactic cosmic rays, CMEs, and micrometeoroids.
- **Repository status:** referenced in presentation notes/build artifacts, not embedded in the current backend event-source list and not used by runtime calculations.
- **Suitable future use:** a source link near the fictional Day 4 alert could help explain why “weather” on the Moon is space-environment activity rather than Earth-like atmospheric weather.
- **Limitation:** it is not a live alert feed and does not provide the game’s fictional event effect.

## Future integration opportunities (classification D)

No future integration is required for the current prototype. If the team chooses one, the safest options are:

1. **Historical DONKI context card:** select a fixed, archived event at build time, show the source record and event type, and ask the child what preparation would be sensible. Do not map it to dose or automatically change game state.
2. **Teacher-facing OSDR reading link:** link a specific plant or human-spaceflight study with a plain-language question; do not convert study results into game units.
3. **NASA image or mission context:** use a fixed, attributed NASA asset with a documented license/usage check. It should improve orientation or science explanation, not drive balance.
4. **Communication source link:** the gameplay now surfaces the 1.3-second one-way lunar light-time context and exposes the NASA source alongside the event. The delay is used as an educational trade-off, not as a fake network simulator.

Any live data feature would need a visible “live/archived/simulated” label, a fallback when the NASA service is unavailable, reproducible tests with fixed fixtures, a source timestamp, and a clear statement of what the data does **not** measure.

## Statements the team must not make

- “MoonBase uses a live NASA API.” It does not.
- “DONKI tells us the radiation dose inside our lunar shelter.” It does not.
- “Our Water values represent NASA’s 90% or 98% recovery.” They do not.
- “The Power costs come from NASA engineering tables.” They do not.
- “CO₂ removal creates oxygen.” The cited ECLSS source separates those functions.
- “Shelter readiness is a radiation dose or shielding percentage.” It is not.
- “The array-brushing effect is a NASA-recommended maintenance method.” It is not.
- “The game is a validated lunar-habitat simulator.” It is a compact educational game.

