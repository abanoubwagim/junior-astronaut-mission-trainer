# MoonBase — Project Constitution & Implementation Guide

> **Document status:** Working specification for the rebuild  
> **Prepared:** 10 November 2026  
> **NASA challenge:** 2026 — *Build a Junior Astronaut Mission Trainer*  
> **Target audience:** Children aged 7–12  
> **Frontend:** HTML, CSS, Vanilla JavaScript  
> **Backend:** Java 17 / Spring Boot  
> **NASA resources release date supplied by the project owner:** Friday, 13 November 2026  
> **Hackathon duration:** Two days exact start/end hours have not been supplied.

---

## 0. How to use this document

This file is the primary product, science, architecture, and implementation specification for the new MoonBase build. Read it before changing game rules, data adapters, APIs, snapshot signing, or user-facing science explanations.

The labels below are binding:

- **`[READY BEFORE 13 NOV]`** — can be implemented now without NASA resource-pack values.
- **`[WAITING FOR NASA RESOURCES — 13 NOV]`** — do not invent, estimate, seed, or hardcode a value. Implement only the interface/contract around it until the official material is available.
- **`[OPEN DECISION]`** — the project owner must choose. The recommended path is stated, but it is not silently treated as an approved decision.
- **`[NASA VERIFIED]`** — may be used only after the exact NASA record, unit, timestamp, applicability, and source URL have been checked and recorded in the source registry.
- **`[BLOCKED]`** — do not expose the feature as playable until the missing source or parameter is verified.

A missing scientific value is represented internally as `null` / `UNAVAILABLE`, never as `0`, a guessed number, a random number, or a temporary balancing value. The UI must say that the NASA reading or engineering parameter is not available yet.

This is an implementation specification, not a claim that the code described here has already been built. Do not mark a task complete until its code and tests exist.

## 0.1 Owner decisions confirmed on 10 November 2026

These decisions are approved and override earlier recommendations or open-decision entries in this file.

| Decision                   | Confirmed choice            | Implementation consequence                                                                                                                                                                                                                                                                        |
|----------------------------|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Persistence / database     | **Stateless — no database** | No PostgreSQL, JPA, Flyway, player accounts, server sessions, or saved mission progress. The server recalculates a mission from the submitted decisions and a verified NASA data snapshot.                                                                                                        |
| Science versus game values | **Separated layers**        | NASA observations and NASA-derived measurements remain authentic, unit-bearing, and source-linked. Team-authored game meters/action budgets may exist only as a separate, explicitly labelled game abstraction; they must never be described as NASA measurements or blended into physical units. |
| Environments               | **Moon only for the active slice** | The current product implements the Moon Day 1 mission only. Keep future-world ideas out of the active UI and API until a separate scope decision enables them. |

### Binding interpretation of “separated”

The earlier absolute ban on every team-designed gameplay number is now superseded **only for the game-abstraction layer**. We may design abstract game points or a challenge budget to make a child-facing decision understandable. Such values must be visibly labelled `GAME VALUE` / `SIMULATION POINTS`, have no physical unit, and be kept in a separate DTO/model from NASA measurements. Do not present them as watts, watt-hours, litres, kilograms, calories, sieverts, grays, dose rates, or real habitat operating limits. If a player-facing mechanic claims a physical effect (for example, “this action reduces radiation dose”), that physical effect still requires NASA evidence and a valid transformation.

### Stateless interpretation

“No database” means no durable application database and no persisted player/game state. For reproducible decisions, the backend will create a **server-signed NASA snapshot envelope** containing only the NASA records/normalized observations needed for that mission, their provenance, and snapshot hash. The frontend keeps this envelope in JavaScript memory only and returns it with the ordered decision IDs. Spring validates the HMAC signature, snapshot age/status, source lineage, and scenario version before replaying the mission. This is a signed data snapshot, **not** an account token, authentication token, player-progress token, or saved session. Its signing secret belongs in `.env`. If implementing signed snapshots proves too expensive, fall back to a source-record ID plus exact content-hash re-fetch; never accept client-supplied measurements without verification.

### Dual-world scope rule

The active product slice is Moon-only. Do not expose another destination, preview, blocked card, or world-selection path in the UI or gameplay API. Future world work requires a separate product decision and implementation task.

---

## 1. Product objective

### 1.1 One-sentence concept

MoonBase is a child-friendly lunar outpost decision game. Players explore the Moon, inspect traceable NASA-published engineering context, make mission decisions, and learn how terrain and illumination affect power planning.

### 1.2 What the NASA challenge is asking for

The challenge is not asking for a space-themed quiz or a beautiful lunar background. It asks for an interactive learning experience where children manage a lunar or Martian outpost and encounter genuine mission constraints such as:

- Life support and the conditions required to keep a crew alive.
- Power generation, storage, and allocation.
- Radiation risk and shelter/shielding decisions.
- Food production and the resources required to grow food.
- Communication delay and the need for local decision-making.
- Trade-offs whose effects may appear later rather than immediately.

The educational result is that a player understands a real engineering constraint, not merely that they have completed a level.

### 1.3 Product principles

1. **Separate the science layer from the game layer:** NASA facts and measurements must be authentic; clearly labelled game abstractions may be designed by the team.
2. **Traceability:** every displayed scientific reading and every scientific parameter used by the simulator has an identifiable NASA source record.
3. **Honest uncertainty:** distinguish measured, modelled, forecast, derived, stale, unavailable, and educational-only information.
4. **Meaningful trade-offs:** each choice must explain whether its consequence is (a) a NASA-supported physical relationship, (b) a transparent transformation of NASA data, or (c) a game-only abstract cost. Do not blur these categories.
5. **One calculation authority:** Spring Boot owns validation, scenario eligibility, calculations, and outcomes. The browser renders server results.
6. **Child-first communication:** simple words, short explanations, visible cause and effect, and no punishment without an explanation.
7. **No false NASA affiliation:** MoonBase is an independent educational project for the NASA Space Apps Challenge. It is not an official NASA product and must not imply NASA endorsement.
8. **Small scope for a two-day build:** ship one scientifically defensible playable vertical slice rather than many incomplete systems.

### 1.4 Audience and accessibility

- Primary audience: children aged 7–12.
- Secondary audience: parents, teachers, judges, and older siblings.
- Use simple English by default because the current project is English-language. **[OPEN DECISION]** Decide whether the hackathon version must also support Arabic. Do not translate technical labels inconsistently.
- Explain a scientific term when it first appears. Example: “Radiation is energy and particles travelling through space.”
- Avoid dense dashboards. Show only the few measurements needed for the current decision; keep detailed source information available in a clearly labelled “Science behind this” panel.
- Support keyboard use, screen readers, visible focus, sufficient contrast, reduced motion, and touch-friendly controls.

---

## 2. NASA data integrity and separated game mechanics policy

This section overrides older game rules and existing hardcoded numerical state. It implements the owner-approved separation between scientific data and game abstractions.

### 2.1 Allowed sources

A value can enter the scientific simulation only when its origin is an official NASA source or an official NASA-operated data service/repository. Candidate source families include:

- `api.nasa.gov` and its documented services, including DONKI.
- NASA Science, NASA mission pages, and NASA technical publications.
- NASA Technical Reports Server (`ntrs.nasa.gov`).
- NASA-operated science/data repositories such as OSDR and the Planetary Data System, when the exact dataset is relevant.
- NASA centres' official data portals and technical documents, where the resource pack identifies them or the team verifies them.

A third-party article, unofficial API wrapper, generated summary, search snippet, or community dataset is not an authoritative source for a gameplay value.

### 2.2 What may be team-designed, and what may not

The following separation is mandatory:

**A. NASA science layer — evidence, not game balancing**

- Actual observations, instrument readings, published engineering parameters, model outputs, forecasts, requirements, and experimental results from official NASA sources may be shown with their original context.
- NASA-derived calculations are allowed only when the inputs, units, formula, and assumptions are recorded.
- Scientific values cannot be invented, randomized, rounded into a new unit, or changed to make the game easier.
- A Moon measurement cannot be used as a Mars measurement, nor an orbital measurement as a surface measurement, unless an explicit NASA-supported transfer model justifies it.

**B. Game abstraction layer — authored by the team and visibly separate**

- The team may create non-physical game values such as `Mission Points`, `Action Budget`, `Preparation Level`, or abstract `Operations Units` to create a playable decision structure.
- Every such item must carry `valueOrigin = GAME_DESIGN`, `unit = GAME_POINTS` (or another clearly non-physical label), and a visible `GAME SIMULATION` badge in the UI.
- Do not assign a scientific unit to a game value. Do not imply that one game point equals a watt-hour, litre, kilogram, calorie, gray, sievert, or measured operational threshold.
- Game abstractions may change only the game's own state. They must not alter a NASA observation or claim a real-world radiation, health, power, water, or crop outcome.
- A player may see a NASA observation beside a game choice, but the UI must show the evidence and the abstract game consequence in separate visual blocks.

**Forbidden blending examples:** presenting “2 Power” as a NASA measured power cost; turning a DONKI SEP record directly into a lunar/Martian dose; treating ISS water recovery as an outpost water rate; treating a plant experiment as a guaranteed crop yield; or displaying a 0–100 game score as a radiation-protection percentage.

A missing NASA value must remain `UNAVAILABLE`. It must not be replaced by a game number inside the science layer. The team may still offer a separate abstract choice if its effect is limited to the explicitly labelled game layer and the player is not told it predicts a real engineering result.

### 2.3 What counts as a verified value

Before a value is allowed into a scenario, its source record must provide enough context to answer:

- What is being measured or described?
- What is the original numeric value and unit, if numeric?
- When was it observed, measured, modelled, or published?
- Where does it apply (Moon/Mars, orbit/surface, site, instrument, mission, organism, or experimental setup)?
- Is it a measurement, a model output, a forecast, a target, a requirement, or a result from a controlled experiment?
- What uncertainty, quality flag, caveat, or applicability limit is stated by NASA?
- What exact NASA record or document supports it?

If the source does not supply a field, preserve it as unknown. Do not fill it from intuition.

### 2.4 Direct values versus derived values

- **Direct NASA value:** copied from a NASA record without changing its scientific meaning; preserve the original unit and timestamp.
- **NASA-derived value:** calculated from one or more NASA values using a documented formula. Store the formula identifier/version, all input record IDs, unit conversions, and assumptions. Label it “Derived from NASA data”, not “direct NASA measurement”.
- **Game-designed value:** authored by the team for the abstract game layer only. Label it `GAME VALUE`, identify its origin as `GAME_DESIGN`, and never treat it as a scientific measurement or engineering parameter.
- **Educational explanation:** plain-language text that explains a verified fact. It may simplify wording, but it may not create new numeric facts or imply unsupported physical causality.
- **Game mechanic:** a rule that changes the game state. It may change a team-designed abstract game meter, but only a NASA-supported parameter/formula may change or predict a physical/scientific quantity.

### 2.5 No-data rule

When a required source is unavailable, incomplete, outside the required environment, or scientifically unsuitable:

1. Mark the parameter `UNAVAILABLE` or `NOT_APPLICABLE` with a reason.
2. Do not replace it with a default.
3. Disable any action whose effect depends on that parameter.
4. Explain the missing evidence to the player in child-friendly wording.
5. Record the gap in the data coverage matrix.

A scenario's **science layer** may become active only when every required NASA input is verified. Its separate game-abstraction layer may be authored by the team, but may not replace missing physical evidence. A partially populated or stale dataset must not silently fall back to an older hardcoded scientific value.

---

## 3. Existing MoonBase baseline and rebuild assessment

### 3.1 What exists in the inspected project

The current public repository is `abanoubwagim/junior-astronaut-mission-trainer`. Its README and project documentation describe:

- `mission-trainer-frontend/`: static HTML, CSS, and Vanilla JavaScript.
- `mission-trainer-backend/`: Java 17, Maven, Spring Boot 4.1.2, Spring MVC, and tests.
- An existing backend-authoritative, deterministic decision replay model.
- A browser flow with welcome, briefing, mission/event choices, decision feedback, and results.
- Four mission rounds and the resources Power, Water, Food, and Shelter readiness.
- No account, no player database, and no saved progress.
- NASA source links used as science references, but no actual NASA API-backed game data in the documented design.

### 3.2 What must not be carried over as science

The existing `docs/GAME_RULES.md` documents manually selected game values, daily changes, decision costs, delayed bonuses, shelter readiness values, resource bounds, and terminal thresholds. These were explicitly described as game-only balancing values in the old version.

Under the new requirement, these values are **not reusable** as NASA measurements or as the new game's scientific calculation inputs. Remove or replace them when the new simulation becomes active. Do not copy old arithmetic into the new engine.

The existing science reference document is useful as a starting bibliography, but a science citation beside an invented game number does not make that number a NASA value. For example:

- An ISS water-recovery result is not automatically a lunar-base water-recovery rate.
- A plant habitat experiment is not automatically a lunar crop yield or a harvest schedule.
- A NASA article about radiation shelters is not a measured dose-reduction factor for the shelter in this game.
- A DONKI solar event is not automatically a measured radiation dose at a particular lunar surface site.

### 3.3 What may be reusable

Subject to code inspection and tests, the following patterns can be reused:

- Backend owns the game rules and calculations.
- The frontend submits choices; it does not calculate resource results.
- Deterministic replay of the ordered decision history.
- Safe JSON error handling and request validation.
- Accessible semantic HTML, focus management, responsive CSS, and concise child-friendly copy.
- Separation between event content and the rendering code.

### 3.4 What must be reworked

| Existing area | Required change |
|---|---|
| Static resource start values and daily rates | Delete from active game rules; load only verified NASA-backed parameters. |
| `Shelter readiness` as a pseudo-radiation measure | Do not present it as radiation dose, shield thickness, or protection percentage. Replace it with a NASA-supported measurement/model or a clearly categorical decision if the evidence permits. |
| Four fixed days and hardcoded event schedule | Reconsider. Four levels may remain as a narrative structure, but they must not be represented as four real lunar days. |
| Fixed choice costs and delayed bonuses | Separate NASA-supported physical effects from game-only action points; retire old values and labels that imply engineering units. |
| In-code scenario facts | Move to a source registry/content structure containing a NASA source reference and applicability note. |
| No NASA API integration | Add backend-only NASA data adapters, validation, snapshots, provenance, and failure states. |
| No database | Keep the application database-free. Use a signed, client-held NASA snapshot envelope for deterministic replay; never persist player progress. |
| UI fallback values | Remove numeric fallbacks such as `value ?? 0` for scientific data. Show “Not available” and block affected interactions instead. |
| Optional communication demo | Integrate it into a decision only if actual NASA-sourced delay data and a valid learning consequence are available; otherwise keep it labelled as an educational explainer. |

**Important audit limit:** this baseline is based on the current repository README and committed documentation inspected for this specification. A line-by-line audit of the latest local working tree has not been performed in this environment. Before deleting or replacing code, inspect the actual checkout and preserve unrelated work.

---

## 4. Game concept, flow, rules, and levels

### 4.1 Recommended setting

**[ACTIVE BUILD: MOON ONLY]** Support the lunar outpost Day 1 mission. The player does not select or preview another world in this build. Keep future-world concepts outside the active gameplay contract until a separate task enables them.

The game represents a fictional training outpost, but its scientific readings and engineering parameters must come from NASA. Fictional framing (for example, a mission-control narrator or a named guide character) is acceptable; fictional measurements and fabricated NASA events are not.

### 4.2 Player journey

1. **Welcome:** explain that the player is helping a crew operate an outpost beyond Earth.
2. **World selection:** choose the Moon; show its lunar context card and launch Day 1.
3. **Mission briefing:** introduce the systems needed for the selected world's first scenario.
4. **NASA data briefing:** show the actual NASA observation/parameter, units, date, source, and any limitations in simple language.
5. **Situation:** present a real source-backed condition or an explicitly labelled educational scenario based on one or more NASA records.
6. **Decision:** offer choices whose physical claims are NASA-supported; any game-only consequence must be labelled as an abstract game rule.
7. **Simulation result:** show NASA values and derived calculations separately from game-point changes.
8. **Learning feedback and debrief:** explain the trade-off, what the player should notice, and list the NASA sources used.

### 4.3 Core learning loop

`Observe NASA evidence → Understand the problem → Compare supported options → Choose → Recalculate from verified inputs → Explain the result`

Do not add a choice that is merely cosmetic. Do not let the client invent the result. Repeating the same valid decision history against the same immutable NASA snapshot and the same rules version must produce the same logical result.

### 4.4 Systems and the recommended scope

The challenge mentions multiple systems, but the player should not have to monitor every system at once. The recommended presentation is **up to three numeric primary resources**, with other systems represented as event constraints or categorical states until enough data exists.

| System | Intended role | Data needed before it can affect gameplay |
|---|---|---|
| Power | Primary resource candidate | NASA source for generation/storage/available power and the applicable load or demand relationship. |
| Water / life support | Primary resource candidate | NASA source for water availability, use, recovery, or a valid engineering relationship; identify the actual system and context. |
| Food / food production | Primary resource candidate or one focused production scenario | NASA source for crop/plant performance, inputs, environmental conditions, and the meaning of the measurement. |
| Radiation / shielding | Hazard and protection decision | NASA source for a relevant radiation measurement/model and defensible shielding or shelter effect. A solar event alone is not a surface dose. |
| Communications | Delayed information constraint | NASA one-way light-time or mission-distance data with the correct timestamp and endpoints. Do not invent a fixed Moon/Mars delay. |
| Thermal environment | Optional environmental constraint | NASA measurement for the selected site/time and a verified system relationship showing how it affects the scenario. |

**Do not force all six systems into the first playable slice.** Choose only the systems for which the released NASA resources provide applicable evidence. An unavailable system can appear in the educational “systems map” as a known engineering concern. It cannot receive invented physical costs/effects; it may use a separate game-only point cost only when clearly labelled and not presented as a real engineering consequence.

### 4.5 Proposed level progression

These are learning chapters, not claims about real mission duration. They can be renamed or reordered after the data pack is inspected.

| Level | Learning focus | Intended player question | Activation condition |
|---|---|---|---|
| 1 — Read the Environment | Inspect a NASA observation relevant to the selected world (for example, Moon surface thermal data or Mars surface radiation observations). | “What did NASA actually measure, and where?” | A verified record for the selected world with units, time, instrument, and applicability. |
| 2 — Manage Operations | Use a separate game-only action budget to reason about prioritisation; show any real NASA engineering evidence alongside it. | “Which operation should the crew prioritise?” | NASA evidence card plus clearly labelled game abstraction. No claim that game points equal a real power demand. |
| 3 — Support the Crew | Explain a life-support, water, or plant-science concept using the best matching NASA study or dataset. | “What does this system need, and what does the study actually show?” | A relevant NASA study with experimental context; no invented crop yield or consumption rate. |
| 4 — Respond to a Hazard | Use a verified radiation/event/communication record where available; keep limitations visible. | “What information is available, and what can the crew decide locally?” | World-appropriate NASA record/model and explicit applicability. If unavailable, present an explainer rather than a simulation. |

A level is not marked “playable” simply because its text and illustration are ready. The activation condition is a science/data gate.

### 4.6 Rules of play

- Each mission is bound to a frozen, verified NASA data snapshot for the selected world.
- Every NASA science value retains its original unit, timestamp, provenance, and context. Every team-designed point is typed/labeled as a game abstraction with no physical unit.
- A player may choose only an option returned by the backend for the active scenario.
- The backend calculates science-derived values from verified input records and documented transformations; it calculates game points in a separate model.
- A physical effect (for example, a change in dose, temperature, water mass, or power) may be applied only when NASA evidence supports that relationship. A game-only effect may change only the abstract game state.
- Delayed effects must identify whether they are physical NASA-derived consequences or game-only narrative effects.
- A result outside the source's supported range is not extrapolated unless NASA documentation supports the extrapolation method.
- Do not invent or randomize NASA observations. A live/archived event must map to a real NASA record; a fictional teaching scenario must be clearly labelled as a scenario and must not claim to be an actual event.
- The player may restart and replay. The same snapshot and decisions yield the same result.
- If a source is unavailable, expired, malformed, or scientifically inapplicable, the related action and scenario are disabled with a clear explanation.

### 4.7 Victory, failure, and critical states

**[WAITING FOR NASA RESOURCES — 13 NOV]** No physical safety/failure thresholds are defined until the chosen source provides them. A separate game-only win condition may be designed later, but it must be explicitly labelled as a game challenge and not a real mission-safety judgement.

The engine may define these general states:

- `ACTIVE`: all required NASA inputs are verified and the player can make a valid decision.
- `WARNING`: a source-backed physical constraint is approaching or has entered a NASA-defined warning band, or a separately labelled game meter has entered its game warning state.
- `FAILED`: a NASA-defined physical constraint has been breached, or the player has lost the abstract game challenge; the result must identify which kind of failure occurred.
- `SUCCEEDED`: the player completed the game challenge. State clearly whether scientific constraints were also met; do not imply real mission safety unless the evidence supports it.
- `DATA_BLOCKED`: the scenario cannot continue because a required NASA value or source is missing, stale, or invalid.

`DATA_BLOCKED` is not a player failure. Never punish a child because an API or dataset is unavailable.

If NASA materials do not define a defensible physical threshold for a selected parameter, do not invent one. The team may still define an abstract game-level challenge boundary, but it must not be described as a physical safe/unsafe line. Otherwise choose a different scenario or present the information as an educational explainer rather than a simulator.

---

## 5. NASA data requirements and candidate sources

### 5.1 Data registry — required fields

Every NASA dataset or document used by the application must have a registry entry with the following metadata where available:

| Field | Purpose |
|---|---|
| `sourceId` | Internal stable ID for the source entry. |
| `provider` | NASA service, mission, centre, or repository. |
| `datasetTitle` | Original NASA dataset or document title. |
| `datasetId` | NASA accession, event ID, product ID, or record identifier when supplied. |
| `endpointOrRecordUrl` | Exact source record URL without credentials or API-key query parameters. |
| `documentationUrl` | NASA documentation for the API/schema. |
| `retrievedAt` | Time the backend retrieved the record. |
| `observedAt` / `publishedAt` | Original observation/model/publication time, if supplied. Do not substitute retrieval time. |
| `targetAndContext` | Moon/Mars/Earth orbit/ISS, site, instrument, organism, mission, or experiment context. |
| `measurementName` | What the value means. |
| `value` and `unit` | Original numeric value and original unit. Do not silently convert or relabel. |
| `uncertaintyOrQuality` | NASA uncertainty, quality flag, confidence, or `NOT_PROVIDED`. |
| `dataType` | `OBSERVATION`, `MODEL`, `FORECAST`, `REQUIREMENT`, `EXPERIMENT_RESULT`, or `DOCUMENTED_FACT`. |
| `limitations` | What this record cannot support. |
| `attribution` | NASA title/organization and citation wording. |
| `payloadHash` | Hash of the stored original response/document metadata for auditability. |

The source registry may contain a candidate source marked `PENDING_REVIEW`, but its values cannot enter the science layer before the reviewer changes the status to `VERIFIED`. A `GAME_DESIGN` value is not part of that registry and must remain isolated in the game abstraction layer.

### 5.2 Candidate NASA sources — not yet approved for gameplay

The challenge resource pack has not yet been inspected. The list below is a research starting point only. It does **not** mean that every source is suitable, that every source has a usable API, or that the game can calculate a physical trade-off from it.

| Candidate | What it may help investigate | Important limitation / validation needed | Status |
|---|---|---|---|
| NASA DONKI (`api.nasa.gov`) | Solar/space-weather events and their NASA event records. Potential candidate for an event briefing. | A CME/GST/SEP notification is not automatically a measured radiation dose at the lunar surface. Do not turn an event into a dose, crew risk value, or shelter effect without a NASA-supported model/measurement. | `PENDING_REVIEW` |
| LRO CRaTER / NASA PDS (Moon) | Calibrated and derived charged-particle measurements from the CRaTER instrument aboard Lunar Reconnaissance Orbiter. The PDS bundle lists lunar target coverage and calibrated/derived products. | CRaTER is an orbiter instrument. Its data must not be labelled as a crew dose measured on the lunar surface or inside a habitat. Review geometry, instrument product, units, quality and version before use. | `PENDING_REVIEW` |
| LRO Diviner / NASA PDS (Moon) | Measured lunar surface thermal-radiation/temperature data for selected locations and observation times. | A surface temperature is not an interior habitat temperature or heater energy demand. Preserve location, local time, calibration level, resolution and instrument product semantics. | `PENDING_REVIEW` |
| Mars Science Laboratory RAD / NASA data archive (Mars) | Curiosity RAD surface radiation observations, including dose-rate products and quality flags. NASA describes RAD as monitoring the natural radiation environment at the Mars surface. | Measurements are from the rover/instrument at its Mars surface context and time, not a universal Mars value or a future habitat dose. Preserve detector/product, quality flags, units, timestamp and location. | `PENDING_REVIEW` |
| Mars surface environment instruments / NASA PDS (Mars) | Candidate environmental measurements such as atmospheric/thermal conditions from a rover instrument. | Select an exact instrument/data product after the resource pack is available; do not assume a public endpoint or a ready-to-use API without verifying the PDS collection. | `PENDING_REVIEW` |
| NASA OSDR | Space-life-science datasets, including human/animal/plant/microbe studies and biological/physiological data. | A study result is specific to its organism, experiment, conditions, and measurement. It is not automatically a lunar habitat consumption rate, crop yield, or human safety threshold. | `PENDING_REVIEW` |
| Lunar Reconnaissance Orbiter / Diviner data | Lunar surface temperature and local thermal environment. | A surface measurement is not a habitat internal temperature or a heater power requirement. Site, local time, instrument, and surface context must be preserved. | `PENDING_REVIEW` |
| Lunar radiation data such as CRaTER records / relevant NASA technical datasets | Radiation environment and dose-related evidence. | Confirm exact accessible dataset, measurement geometry, energy range, units, time range, and whether it represents the chosen surface/outpost context. | `PENDING_REVIEW` |
| NASA Moon Base Systems / Lunar Surface Technology publications | NASA descriptions of power-generation, storage, distribution, and surface infrastructure concepts. | A concept page is useful background but is not automatically a numerical API feed or a measured output/load profile. Extract numeric parameters only from an exact NASA source record and preserve its status as a design target, test result, or estimate. | `PENDING_REVIEW` |
| NASA Advanced Plant Habitat / relevant space-crop studies | Plant growth systems, lighting, nutrient/water delivery, and plant experiment findings. | Do not convert a controlled experiment to a lunar farm production rate without an explicitly justified, NASA-supported transfer method. | `PENDING_REVIEW` |
| NASA communications / mission geometry data | One-way light-time and communication delay concepts. | Use timestamp-matched mission distance or a NASA-provided light-time value. Do not use a universal hardcoded Moon or Mars delay for every scenario. | `PENDING_REVIEW` |
| Additional datasets supplied on 13 November | Whatever data the challenge resource pack identifies. | Inspect the source, schema, license/usage notes, and scientific applicability before building against it. | `WAITING_FOR_RESOURCE_PACK` |

### 5.3 Current authoritative documentation links

**DONKI endpoint caution (important as of 10 November 2026):** NASA CCMC announced that the DONKI web application/API migrated to new official URLs effective 30 September 2026. The current official CCMC DONKI page points to the new `ccmc.gsfc.nasa.gov` host and states that paths following `/DONKI/` remain unchanged. The NASA Open APIs catalog still lists DONKI examples under `api.nasa.gov`. Do not assume that the user's `api.nasa.gov` key is accepted by every current DONKI endpoint. On 13 November, follow the latest official API documentation and the challenge resource pack to select the exact base URL and authentication method. Keep the API key server-side regardless.


These sources are linked for research and schema discovery. They are not preloaded into the game as measurements.

- [NASA Open APIs portal](https://api.nasa.gov/) — official NASA API catalog and authentication/rate-limit guidance.
- [NASA API authentication and rate limits](https://api.nasa.gov/assets/html/authentication.html) — key usage and rate-limit headers.
- [NASA OSDR API information](https://www.nasa.gov/osdr-api/) — OSDR REST API overview.
- [NASA OSDR repository](https://osdr.nasa.gov/bio/repo/) — search and inspect space-life-science studies.
- [NASA About OSDR](https://science.nasa.gov/biological-physical/data/osdr/) — what kinds of data the repository contains.
- [NASA Weather on the Moon](https://science.nasa.gov/moon/weather-on-the-moon/) — educational background on lunar surface conditions; not an API measurement for this game.
- [NASA Moon Base Systems](https://www.nasa.gov/moonbase-systems/) — power-system development context.
- [NASA Lunar Surface Technology](https://www.nasa.gov/lunar-surface-technology/) — lunar surface technologies and power context.
- [NASA communications with missions](https://www.nasa.gov/communicating-with-missions/) — communications concepts and references.
- [NASA reference systems / one-way light time](https://science.nasa.gov/learn/basics-of-space-flight/chapter2-3/) — definition of one-way light time.
- [NASA Advanced Plant Habitat](https://science.nasa.gov/mission/advanced-plant-habitat/) — plant-growth-system context.
- [NASA Technical Reports Server](https://ntrs.nasa.gov/) — technical documents and reports.
- [NASA Planetary Data System](https://pds.nasa.gov/) — planetary mission data archive.
- [LRO CRaTER PDS bundle](https://pds.nasa.gov/ds-view/pds/viewBundle.jsp?identifier=urn%3Anasa%3Apds%3Alro-crater&version=2.4) — calibrated and derived lunar-orbiter instrument data; not a surface-habitat dose.
- [NASA Open Data: LRO CRaTER calibrated LET dataset](https://catalog.data.gov/dataset/lro-moon-crater-3-4-calibrated-let-data-v1-0) — candidate Moon dataset; inspect individual products before using.
- [NASA Open Data: Mars Science Laboratory RAD Level 2 dosimetry dataset](https://data.nasa.gov/dataset/mars-science-laboratory-msl-radiation-assessment-detector-rad-level-2-observation-dosimetr) — candidate Mars surface dataset with dose-rate products and quality flags.
- [NASA Science: Radiation Measurements on Mars](https://science.nasa.gov/resource/radiation-measurements-on-mars/) — explains Curiosity RAD surface measurements; the published graph's numbers apply to its stated historical period, not as a current universal value.
- [NASA Diviner data archive information](https://www.diviner.ucla.edu/data) — LRO Diviner data are archived through the NASA PDS Geosciences Node.

### 5.4 DONKI-specific integration notes

NASA's Open APIs catalog describes DONKI as a space-weather knowledge base containing interpretations of observations, analyses, models, forecasts, and notifications. Its catalog includes services such as CME, CMEAnalysis, and GST, with additional event services documented by NASA.

Implementation rules:

- Do not select a DONKI endpoint solely because it is easy to call. Select it only if its response fields support the exact player-facing claim.
- Preserve the original event identifier, event time, linked records, model/analysis metadata, and source URL when present.
- Distinguish an observation from an analysis or forecast in the UI.
- Never infer a lunar surface dose from a solar-event notification without a NASA-published model/data product that supports the inference.
- If the resource pack names a different radiation data source, prefer the source that directly matches the game scenario.

### 5.5 OSDR-specific integration notes

NASA describes OSDR as a repository for space-life-science data and provides REST API capabilities for search, metadata, and data-file retrieval.

Implementation rules:

- Search for studies only after the resource pack reveals which biology/plant/human-health learning objective is in scope.
- Preserve study accession/version, organism or subject type, experimental conditions, assay/measurement type, and linked publication metadata when available.
- Do not compare two studies as if they were the same experiment unless their methods and contexts justify it.
- OSDR may supply evidence for a science explanation without supplying a numeric game parameter. That is a valid use; do not force every source into the simulation engine.

### 5.6 Data coverage matrix — fill after 13 November

Do not fill the `NASA value`, `unit`, or `rate` columns until a real record is reviewed.

| Game requirement | NASA dataset / record | Required source fields | Required unit | Transformation / formula | Validation | Status |
|---|---|---|---|---|---|---|
| Power availability / generation | `[WAITING FOR NASA RESOURCES]` | `[WAITING]` | `[WAITING]` | `[WAITING]` | `[WAITING]` | `BLOCKED` |
| Power demand / allocation | `[WAITING FOR NASA RESOURCES]` | `[WAITING]` | `[WAITING]` | `[WAITING]` | `[WAITING]` | `BLOCKED` |
| Water availability / use / recovery | `[WAITING FOR NASA RESOURCES]` | `[WAITING]` | `[WAITING]` | `[WAITING]` | `[WAITING]` | `BLOCKED` |
| Life-support constraint | `[WAITING FOR NASA RESOURCES]` | `[WAITING]` | `[WAITING]` | `[WAITING]` | `[WAITING]` | `BLOCKED` |
| Food / plant production | `[WAITING FOR NASA RESOURCES]` | `[WAITING]` | `[WAITING]` | `[WAITING]` | `[WAITING]` | `BLOCKED` |
| Radiation observation / model | `[WAITING FOR NASA RESOURCES]` | `[WAITING]` | `[WAITING]` | `[WAITING]` | `[WAITING]` | `BLOCKED` |
| Shielding / shelter effect | `[WAITING FOR NASA RESOURCES]` | `[WAITING]` | `[WAITING]` | `[WAITING]` | `[WAITING]` | `BLOCKED` |
| Communication delay | `[WAITING FOR NASA RESOURCES]` | `[WAITING]` | `[WAITING]` | `[WAITING]` | `[WAITING]` | `BLOCKED` |

---

## 6. Backend architecture — Java 17 / Spring Boot

### 6.1 Architecture target

Use a modular monolith. Do not introduce microservices for a two-day hackathon.

```text
mission-trainer-backend/
  src/main/java/.../
    config/              # NASA configuration, CORS, HTTP client, HMAC snapshot signer
    nasa/
      client/            # NASA HTTP clients; one adapter per source family
      dto/               # External NASA response DTOs; never expose directly to frontend
      mapping/            # Map NASA records into canonical internal records
      validation/         # Units, required metadata, source applicability, quality checks
      service/            # Fetch, validate, build immutable snapshot envelope, provenance
    science/
      model/              # VerifiedMeasurement, SourceReference, ScientificParameter
      service/            # Derived-parameter calculations with formula/version provenance
    scenario/
      model/              # Scenario, Level, Action, LearningObjective
      service/            # Scenario catalog and data-coverage eligibility
    game/
      model/              # MissionState, Decision, Outcome, Effect
      service/            # MissionService, DecisionValidator, SimulationEngine, OutcomeEvaluator
    web/
      controller/         # REST API controllers
      dto/                # Stable API request/response types
      error/              # Safe API errors and exception mapping
  src/main/resources/
    application.properties
```

Keep class names and package names aligned with the actual repository conventions when implementation starts. The tree above is a target boundary, not a demand to create empty folders without working code.

### 6.2 Backend responsibilities

The backend must:

- Keep the NASA API key server-side.
- Fetch only the approved NASA endpoints and records.
- Validate the source response before using it.
- Build an immutable NASA snapshot envelope with canonical source values, provenance, snapshot hash, retrieval time, and validity information; do not persist it in a database.
- Normalize values without changing their meaning or original unit.
- Derive a value only through a documented formula with source record IDs and version.
- Decide whether a scenario has all required verified inputs.
- Return only active choices whose physical claims/effects are supported by the approved dataset; keep any game-only costs in a separate explicitly labelled game abstraction.
- Recalculate outcomes; never trust client-submitted resource totals, scientific values, formulas, or result flags.
- Return source citation details to the frontend.
- Handle timeout, rate limit, unavailable source, invalid JSON, empty records, stale data, and schema changes safely.

### 6.3 NASA client and adapter pattern

Do not build one large service that knows every NASA schema. Use one adapter per source family:

- `DonkiAdapter` — only if DONKI is selected after resource review.
- `OsdrAdapter` — only if a relevant OSDR study is selected.
- Additional adapters — create only for exact sources in the resource pack.

Each adapter should implement an internal contract equivalent to:

```java
public interface NasaDataAdapter {
    String sourceKey();
    NasaFetchResult fetch(NasaQuery query);
    ValidationResult validate(NasaFetchResult result);
    List<VerifiedMeasurement> normalize(NasaFetchResult result);
}
```

The signatures are illustrative; align checked exceptions, async behaviour, and return types with the actual codebase. Do not create fake adapter responses or seeded sample measurements.

This file is the project-wide source of truth. Read it before changing code. The repository is maintained by one developer, with Codex expected to implement tasks end-to-end with minimal hand-holding.

## Product goal

Build **MoonBase: 4 Days to Survive**, an English-language, child-friendly educational web game for the NASA Space Apps Challenge 2026 challenge **Junior Astronaut Mission Trainer**. The player manages a lunar base through a short four-day survival mission and learns through meaningful choices grounded in space science.

## Non-negotiable product decisions

- The mission is **four in-game days** long.
- There is **no registration, login, player account, profile, or authentication**.
- There is **no database for players, game sessions, progress, scores, or history**.
- Do not persist game state in `localStorage`, `sessionStorage`, IndexedDB, cookies, URL state, or any other browser/server storage.
- Game state exists only in frontend runtime memory. Refreshing, closing the tab, or leaving and returning starts a fresh mission from Day 1.
- The backend must be stateless between requests: do not keep mission state in server memory, sessions, caches, files, or other storage.
- Do not add a Signed State Token, JWT, HMAC state token, or other token mechanism for gameplay state.
- Do not add a Continue Mission, resume, saved report, or mission-history feature.
- Keep the existing frontend/backend repository layout unless a concrete technical reason requires a change.
- The frontend is HTML, CSS, and vanilla JavaScript. The backend is Java/Spring Boot using the existing Maven project and Java version unless a verified build requirement forces an adjustment.
- No additional frameworks, libraries, databases, authentication providers, or external services without a clear need. Prefer the simplest working implementation.
- Build a complete, coherent game; do not stop at mockups, static screens, TODOs, or a plan.

## Architecture decision — authoritative stateless backend

The Spring Boot backend is the **single authority for gameplay rules and calculations**. The frontend must not independently calculate resource changes, event outcomes, day transitions, or win/failure conditions.

To keep the backend stateless without a database or signed token:

- The frontend keeps only the ordered list of choices made during the current mission in JavaScript runtime memory.
- On each decision, the frontend sends the complete ordered decision history, including the newly selected choice, to the backend.
- The backend validates the sequence and replays the choices deterministically from the canonical Day 1 initial state, calculating resources and outcomes itself.
- The backend must ignore/reject any client-supplied resource totals, scores, outcomes, or calculated effects. Do not accept those values as authoritative inputs.
- The backend returns the authoritative current state, the latest decision feedback/resource changes, available choices for the next day, and the final result when the mission ends.
- The frontend commits the candidate decision history to its in-memory state only after a successful response. If the request fails, keep the previous state and allow a safe retry.
- Starting a new mission clears all in-memory state and calls the mission-start endpoint again.
- This design prevents a client from directly choosing resource totals, but it is not a security system against all deliberate replay or request manipulation. That is acceptable for this simple, non-competitive educational game; do not add anti-cheat infrastructure.

## Canonical API contract

Keep this contract synchronized across the backend, frontend, tests, and API documentation. If a real implementation need requires a change, update all affected pieces together.

### 1. Start a mission

- `POST /api/v1/missions/start`
- Request: no body required.
- Response: initial Day 1 mission state, initial resources, Day 1 event/situation, available choices, and an empty decision history.
- This creates no server-side session and stores nothing.

### 2. Submit/recalculate a decision history

- `POST /api/v1/missions/decisions`
- Request shape:

```json
{
  "decisions": [
    { "day": 1, "choiceId": "example-choice-id" }
  ]
}
```

- `decisions` is the complete ordered list of choices made from Day 1 through the decision being submitted, not just the latest choice.
- The backend must require sequential day numbers beginning at Day 1, validate each choice against that day's actual event, and reject missing, duplicate, out-of-order, unknown, or post-terminal decisions.
- The backend recomputes the entire mission from canonical initial values and rules. It must never trust resource values supplied by the client.
- Response: authoritative mission state plus the latest resolved day, decision feedback, resource changes, and either the next day's event/choices or the terminal mission result.
- Repeating an identical valid request must be deterministic and produce the same logical result.

### 3. Health

- `GET /api/v1/health` may return a small status response if consistent with the existing project setup.

### API errors

Use a consistent safe JSON error shape, for example:

```json
{
  "error": {
    "code": "INVALID_CHOICE",
    "message": "That choice is not available for this day."
  }
}
```

Use appropriate HTTP status codes consistently: `400` for malformed or invalid requests, `404` for unknown routes, and `500` for unexpected server failures. Do not expose stack traces or secrets to the frontend. Document any additional status codes the implementation needs.

## Visual direction for children ages 8–12

Create a polished, playful outer-space adventure, not a corporate dashboard. Use deep navy and indigo space backgrounds, cyan and sky-blue accents, violet, moon-surface silver, and small yellow/orange highlights. Use CSS variables for a consistent palette. Include friendly stars, planets, craters, a lunar base, rover and astronaut visuals, rounded panels, mission badges, large choice cards, readable typography, short English copy, and obvious buttons. Prefer local assets or CSS/SVG art over fragile remote images. Keep the style exciting and polished rather than babyish or cluttered. Ensure accessible contrast, visible focus, touch-friendly controls, reduced-motion support, and responsive layouts. Keep the same design system across all screens.

## Canonical game rules and design decisions

1. The game has a clear start, four playable in-game days, and an ending/result screen.
2. Each day must present a comprehensible situation, relevant information, and a meaningful player decision. Choices must affect game state and/or later events; do not make choices cosmetic.
3. Show resource levels and explain in child-friendly language what changes after a decision and why it matters.
4. Keep the simulation understandable for children. Use a small, consistent set of resources and mechanics; avoid needless complexity.
5. The mission must be completable through sensible decisions. Failure or critical states, if implemented, must be understandable, fair, and consistent with the resource rules.
6. Do not invent scientific facts or present game balancing numbers as real NASA measurements. Distinguish verified science from simplified game mechanics.
7. Codex should decide and implement any still-unspecified design details consistently, after checking official sources where scientific accuracy matters. Record important final mechanics, values, formulas, and event rules in the relevant project documentation so they are not contradictory across screens or services.
8. Keep the full four-day loop internally consistent: initial resources, choice effects, event prerequisites, resource bounds, day transitions, win/failure conditions, and final summary must agree.
9. Document the initial resource values, daily consumption, choice effects, persistent cross-day effects, formulas/order of calculations, resource bounds, terminal conditions, and screen/navigation flow in one canonical game-rules document. Do not scatter conflicting versions of the rules across files.
10. Make sure the full mission can be completed with sensible choices, and test both successful and failure paths if failure is part of the design.

## Game Design Specification — Required Decisions

Before or during implementation, establish a complete and internally consistent specification for the following six areas. Codex is responsible for making reasonable design decisions autonomously, implementing them, testing them, and documenting the final decisions. Do not stop to request approval for ordinary game-design details.

### 1. Initial Resources and Consumption Rates

- Define the initial value, minimum, maximum, and purpose of every gameplay resource.
- Define how much each resource is consumed, generated, restored, or lost during each day and under each relevant event or decision.
- Use a small resource set suitable for children aged approximately 8–12. Introduce a resource only if it contributes meaningfully to the survival mission.
- Make resource units and displayed values consistent throughout the game.
- Ensure initial resources and daily rates support a fair, completable four-day mission.
- Clearly label abstract resource points and balancing values as game values, not real-world engineering measurements.

### 2. Daily Scientific Situations and Player Choices

- Define the scenario, learning objective, relevant scientific explanation, and available choices for each of the four days.
- Each day must contain at least one meaningful decision with understandable trade-offs.
- Choices must be plausible in the simplified context of a lunar base and appropriate for the target age group.
- Explain the likely consequences in accessible English without revealing every consequence in a way that makes the decision meaningless.
- Use reliable scientific sources for factual claims. Do not fabricate NASA facts or imply that NASA endorses the game.
- Keep the four scenarios connected as parts of one mission, with an appropriate progression in challenge.

### 3. Persistent Effects Across Later Days

- Specify which choices affect only the current day and which create effects that continue into subsequent days.
- Define any delayed consequences, event prerequisites, temporary bonuses, penalties, or changes to resource consumption.
- Make continuing effects visible or explain them clearly enough that players can understand why later outcomes occur.
- Prevent contradictory or duplicate effects when advancing between days.
- Ensure later events depend only on conditions that can actually arise from previous game decisions.
- Document the duration, activation conditions, and removal conditions of every continuing effect.

### 4. Resource Calculation Formulas

- Define one authoritative set of formulas for resource updates, including consumption, production, decision effects, event effects, and day transitions.
- Specify the exact order in which decisions, scheduled consumption, production, events, resource bounds, and failure checks are applied.
- Define how minimum and maximum resource limits are enforced and how rounding is handled.
- Prevent resources from becoming negative or exceeding their permitted maximum unless a different behavior is explicitly designed and clearly explained.
- Avoid applying the same resource change twice when the player selects a choice or advances a day.
- Keep calculations deterministic and consistent between the displayed explanation, actual game state, and final results.
- If both frontend and backend perform game calculations, establish one authoritative rules definition and prevent the implementations from drifting apart. Prefer a single calculation authority where practical.

### 5. Victory, Failure, and Mission Results

- Define explicit and testable conditions for mission success, failure, and any critical or recoverable states.
- Determine when those conditions are checked and what happens if a player reaches a critical resource level.
- Make failure understandable and fair. Explain what caused it and, where appropriate, what decision might have prevented it.
- Ensure sensible strategies can complete the mission without requiring random guessing or hidden rules.
- Define the outcome when Day 4 ends, including the final resource state, mission summary, learning takeaways, and success or failure message.
- Do not add an infinite loop, an unintended softlock, or a way to bypass the four-day mission.
- Do not add persistent scores, saved reports, leaderboards, or mission history.

### 6. Screen Design and Navigation Flow

- Define the complete screen list and the order in which screens appear, from the start screen through all four days to the final results screen.
- Specify the purpose, main content, available actions, and navigation behavior of every screen.
- Design all screens for children aged approximately 8–12, using clear English, readable typography, accessible contrast, intuitive controls, and responsive layouts.
- Keep resource information and the consequences of decisions easy to understand during gameplay.
- Define loading, feedback, confirmation where genuinely necessary, critical-resource, success, failure, and restart states.
- Ensure every visible button, link, and control has a working behavior. Do not include decorative controls that appear interactive but do nothing.
- Define the behavior of browser refresh and leaving the game consistently with the no-persistence rule: a fresh visit or reload starts a new mission at Day 1.
- Keep the visual design cohesive across all screens. Prefer a polished, immersive lunar-base experience without sacrificing usability or scientific clarity.

## Game Design Consistency Requirements

The six areas above must be designed as one connected system, not as independent lists.

- Resource values and formulas must support the effects assigned to daily choices.
- Daily scenarios must use the same resource names, limits, and mechanics as the implementation.
- Continuing effects must be reflected in later resource calculations and event eligibility.
- Victory and failure conditions must use the actual calculated game state.
- The final results screen must accurately summarize the mission that was played.
- The screen flow must reflect the actual game states and must not promise unavailable functionality.
- Any change to a resource, formula, choice, event, outcome, or screen must be checked against all affected areas.
- Avoid contradictions between source code, UI text, tests, and project documentation.

## Science and research policy

- Prefer official NASA sources, mission pages, technical explainers, and NASA educational resources.
- For lunar environment, power, water, food, radiation, habitats, life support, dust, and exploration claims, use a relevant source for the specific claim.
- Keep source URLs in a research/reference document or source comments where appropriate. Never fabricate a citation, quote, number, or NASA endorsement.
- If a value is simplified for playability, label it as a **game value** rather than a real-world engineering value.
- Avoid implying that the game is an official NASA product. It is an educational project created for the NASA Space Apps Challenge.

## Engineering and quality rules

- Inspect the existing code and project structure before editing. Reuse working code where appropriate; do not blindly overwrite files.
- Implement the actual feature, connect all relevant interactions, and handle loading, empty, error, success, and edge states.
- Keep frontend and backend contracts synchronized. If a DTO, endpoint, enum, or response changes, update both sides and tests/docs in the same task.
- Validate all untrusted request input on the backend. Never trust client-supplied resource totals or scores; derive them by replaying the submitted ordered choices from the canonical initial state.
- No secrets, credentials, personal data collection, or unnecessary analytics.
- Use semantic HTML, accessible labels, keyboard-friendly controls, visible focus states, readable contrast, and responsive layouts.
- Use clear names and small, cohesive methods/modules. Avoid duplicated business rules.
- Add or update focused automated tests using the testing dependencies already present in the Maven project. Do not add a test framework or testing dependency without an explicit technical need. Also verify through builds, application startup, health/API requests, and practical end-to-end scenarios. Do not claim a check passed unless it actually ran.
- Do not claim a test/build passed unless it was actually run. If an environment limitation blocks a check, state it clearly.
- Before finishing, build and run the available applications, verify the main journey and important API scenarios, inspect the diff, and fix issues introduced by the change.

## Solo workflow for Codex

- Work directly on the existing `main` branch. Do not create feature branches or Pull Requests unless the owner explicitly asks.
- Do not require teammate approvals, reviews, issue numbers, or manual confirmation for ordinary implementation details.
- Work autonomously through inspection, implementation, integration, tests, and documentation.
- Make reasonable low-risk decisions without repeatedly asking the owner. Ask only when a genuinely blocking product decision cannot be resolved from these rules or reliable evidence.
- Never discard unrelated existing work or run destructive Git commands without explicit permission.
- Keep commits focused and use a descriptive commit message if committing is part of the requested task.

## Completion checklist

- The requested behavior works end-to-end.
- Four-day mission logic is consistent and reset-only (no saved progress).
- No account, token, or persistence features were introduced.
- Backend calculations are authoritative and stateless; mission state is reconstructed from validated ordered choices.
- Frontend and backend follow the same documented API contract.
- Scientific claims are sourced and game abstractions are labelled.
- The six game-design areas are fully specified, implemented, and documented consistently.
- Tests/build checks were run where possible and their actual outcomes reported.
- Documentation reflects the implemented behavior.
