# MoonBase Final Presentation — Review

## 1. Summary of changes

Created a new, editable 15-slide, 16:9 PowerPoint at [`MoonBase_Final_Presentation.pptx`](./MoonBase_Final_Presentation.pptx). The original `MoonBase_presentation.pptx` was left unchanged.

The presentation replaces the old template-heavy deck with a consistent dark navy, gold, cyan, and purple identity; readable Arial typography; concise slide hierarchy; editable diagrams and resource bars; source links and speaker-note citations; and authentic screenshots of the running game. It preserves the verified project title, challenge context, and team names. It removes unsupported legacy mechanics such as oxygen leaks, atmospheric dust storms, fatigue systems, and power-grid failures.

Individual responsibilities are not assigned in the available project record. The deck lists the six named team members without inventing individual roles and describes only shared project artifacts verified in the repository.

## 2. Slide-by-slide outline

| Slide | Purpose and contents |
|---:|---|
| 1 | RUN 2.0, *MoonBase: 4 Days to Survive*, challenge name, target age, and authentic welcome-screen screenshot. |
| 2 | Six team members and verified shared project outputs; states that individual roles are not recorded. |
| 3 | Frames the learning-design question around connected Power, Water, Food, and Shelter readiness systems; does not claim measured learning gains. |
| 4 | Explains the four-round game, Mission Control feedback, NASA science signals, and uses original MoonBase scene art. |
| 5 | Editable gameplay loop: challenge → decision → backend recalculation → feedback; states the actual end conditions. |
| 6 | Starting resources, daily costs, delayed effects, integer 0–12 game-value scale, and calculation formula. |
| 7 | The actual Day 1–4 events and available choices, with their immediate and delayed game effects. |
| 8 | NASA science themes paired with explicit model boundaries, including the manual-brushing caveat and no Earth-style lunar weather. |
| 9 | Authentic Day 2 decision screen with “Service the recycler” selected and the state before the choice. |
| 10 | Authentic Day 2 decision report and the server-calculated resource changes and delayed Water effect. |
| 11 | Authentic successful mission result and the exact four choices and final values from the captured run. |
| 12 | Intended learning objectives, explicitly labeled as goals rather than measured outcomes. |
| 13 | Verified frontend/backend architecture and test evidence reported in project docs; limitations and local-only demo status. |
| 14 | Six traceable official NASA references, with clickable titles and URLs also in speaker notes. |
| 15 | Closing statement, real successful-result screenshot, and “Local demo only · no public URL documented.” |

## 3. Actual game mechanics and resource rules represented

The rules below come from `docs/GAME_RULES.md`, the backend rules service, and the live game. Every quantity and effect is a **game value**, not a real unit or NASA engineering specification.

### Resources and objective

| Resource | Start | Range | Normal daily change | Purpose in the game |
|---|---:|---:|---:|---|
| Power | 12 | 0–12 | −2 | Runs habitat, rover, recycler, and grow lights. |
| Water | 12 | 0–12 | −2 | Crew supply; recycler effects can stretch the reserve. |
| Food | 10 | 0–12 | −2 | Crew supply; the grow tray and meal crate affect it. |
| Shelter readiness | 8 | 0–12 | −1 | Abstract readiness meter for the final shelter event; not a dose or shielding measurement. |

The mission has exactly four planning rounds. A resource reaching 0 ends the mission in failure that day. After Day 4, success requires Power, Water, and Food above 0 and Shelter readiness at least 6. There is no score, random event, hidden penalty, rescue mechanic, or extra day.

### Daily calculation order

For each resource and day, the backend applies daily use/wear, prior-choice scheduled effects, the Day 4 event where applicable, the current choice, and then clamps the integer result to 0–12:

```text
After[d,r] = clamp(Before[d,r] + Daily[d,r] + Scheduled[d,r] + Event[d,r] + Choice[d,r], 0, 12)
```

Daily use is Power −2, Water −2, Food −2, and normally Shelter readiness −1. Day 1 shelter preparation prevents the Shelter-readiness wear on Days 2–4.

### Events, choices, and delayed effects

| Day and event | Actual choices and effects |
|---|---|
| **Day 1 — Dust on the solar array** | **Clean the array:** −1 Power now, +1 Power on Days 2–4. **Connect a spare battery:** +1 Power now, no later effect. **Prepare the storm shelter:** −1 Power, +2 Shelter readiness now, and no normal Shelter-readiness wear on Days 2–4. The cleaning option is a fictional game choice, not a NASA maintenance recommendation. |
| **Day 2 — The water loop needs care** | **Service the recycler:** −1 Power and +1 Water now; +1 Water on Days 3–4. **Open a backup water pack:** −3 Power, +5 Water now, capped at 12, with no later reduction in Water use. |
| **Day 3 — Fresh food for the crew** | **Start the LED grow tray:** −2 Power and −1 Water now; +3 Food on Day 4. **Open the meal crate:** +3 Food now, with no later harvest. |
| **Day 4 — A solar storm warning** | The solar-particle alert applies −2 Shelter readiness. **Power the full shelter setup:** −1 Power, +4 Shelter readiness. **Use the low-power shelter:** no Power cost, +2 Shelter readiness; earlier preparation is needed to reach the final threshold. |

### Demonstrated screenshot route

The screenshots and slides 9–11 follow the actual local-browser route `connect_spare_battery → service_water_recycler → start_grow_light_tray → full_storm_shelter`:

| Checkpoint | Power | Water | Food | Shelter readiness |
|---|---:|---:|---:|---:|
| Start | 12 | 12 | 10 | 8 |
| After Day 1 — spare battery | 11 | 10 | 8 | 7 |
| After Day 2 — recycler service | 8 | 9 | 6 | 6 |
| After Day 3 — grow tray | 4 | 7 | 4 | 5 |
| After Day 4 — full shelter | 1 | 6 | 5 | 6 |

The running game declared this route successful. It differs from the separate worked example in `docs/GAME_RULES.md`, which begins with array cleaning and finishes at `(2, 6, 5, 6)`; both are valid successful routes under the implemented rules.

## 4. Scientific claims, official sources, and deck locations

NASA pages were checked on 27 October 2026. The deck cites sources in speaker notes and lists them on slide 14. These are science references for an independent project, not NASA endorsement or validation.

| Claim used in the deck | Source URL | Slides |
|---|---|---:|
| Lunar dust can adhere to and abrade exposed surfaces, including solar-array systems; the game’s array-cleaning effect is invented. The NASA report warns against manual brushing because it can damage arrays. | [NASA NTRS record](https://ntrs.nasa.gov/citations/20240003496) · [report PDF](https://ntrs.nasa.gov/api/citations/20240003496/downloads/TM-20240003496.pdf?attachment=true) | 7, 8, 14 |
| NASA’s ISS ECLSS demonstrated a 98% water-recovery goal. MoonBase’s Water units do not use that percentage and do not represent a lunar recycler. | [NASA ISS water-recovery milestone](https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/) | 8, 9, 14 |
| NASA’s Advanced Plant Habitat uses LED lights and controlled water/nutrient delivery for space-plant research. The game’s Day 4 harvest compresses real growth time. | [NASA Advanced Plant Habitat](https://science.nasa.gov/mission/advanced-plant-habitat/) | 7, 8, 14 |
| NASA ECLSS controls atmospheric pressure, oxygen levels, ventilation, waste management, and water supply. The game has no Oxygen or pressure meter. | [NASA ECLSS reference](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/) | 8, 14 |
| NASA describes a representative Orion temporary shelter using onboard stowage/supplies during a solar energetic particle event. The game’s Shelter readiness score is not a dose, shielding thickness, or lunar-base design. | [NASA radiation-protection article](https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/) | 7, 8, 14 |
| The Moon’s exosphere is too thin for Earth-style atmospheric weather; lunar “weather” comes from space. The implemented Day 4 story is a solar-particle alert, not an atmospheric dust storm. | [NASA Weather on the Moon](https://science.nasa.gov/moon/weather-on-the-moon/) | 7, 8, 14 |

## 5. Simplified equations and gameplay assumptions

- The displayed equation is the implemented backend update sequence. Each resource is independently clamped as an integer to 0–12.
- All starting quantities, daily costs, choice costs, choice rewards, delayed effects, and success thresholds are game-only balancing values.
- One game day means one planning round. It is not one Earth day or one lunar day.
- The Day 3 grow tray’s +3 Food arrives in the next round. This is compressed game time, not a real crop-growth forecast.
- “Service the recycler” and the resource-return values represent a fictional game system. NASA’s ISS recovery result is a thematic example only.
- The Day 1 “clean the array” choice is not a real maintenance recommendation; NASA’s cited report warns manual brushing can cause damage and is not recommended.
- The Day 4 “solar storm” event is expressed in the game text as a solar-particle alert. No Earth-like atmospheric storm or lunar dust storm is simulated.
- Shelter readiness is an abstract 0–12 game meter. The game calculates no radiation dose, shielding thickness, health risk, or real habitat performance.
- MoonBase does not track oxygen or pressure, although these are real life-support concerns described by NASA ECLSS.

## 6. Screenshots used

All application screenshots below were captured from the actual local website at `http://127.0.0.1:5500/html/` during the live walkthrough. The localhost URL is not a public demo link.

| Asset | Actual application screen | Deck use |
|---|---|---|
| `presentation-build/screenshots/opening-crop.png` | Welcome/opening screen, including the game’s own MoonBase art and launch prompt. | Slide 1 |
| `presentation-build/screenshots/day2-recycler-decision-selected.png` | Day 2 “The water loop needs care” screen with “Service the recycler” selected; authentic science signal and alternative are visible. | Slide 9 |
| `presentation-build/screenshots/day2-recycler-feedback-crop.png` | Day 2 decision report with selected choice, all four resource changes, and Days 3–4 delayed Water effect. | Slide 10 |
| `presentation-build/screenshots/mission-result-battery-path-crop.png` | Successful mission screen from the battery → recycler → grow tray → full shelter route, including final resource meters. | Slides 11 and 15 |

Slide 4 also uses `mission-trainer-frontend/assets/moonbase-scene.svg`, an existing project illustration. It is not a fabricated application screenshot.

## 7. Unverified claims, missing information, and limitations

- No individual member responsibilities are assigned in available project records. The deck does not attribute specific roles to named members.
- No child user study, user feedback, learning-gain measurement, NASA endorsement, NASA validation, public deployment, production-origin CORS validation, or performance measurement is documented.
- The repository documents backend and frontend test results, but those suites were **not rerun for this presentation task**. See slide 13 and the validation section below.
- The current repository has no documented public deployment URL. The game was run locally for this task; `127.0.0.1` is not externally accessible.
- No screen reader product (such as NVDA, JAWS, or VoiceOver) was used for this presentation task. The project briefing also says that spoken screen-reader behavior was not verified.
- The game is a short educational decision model, not a scientifically validated lunar habitat or engineering simulator.
- The source presentation’s older purple/cartoon template was redesigned. The six team names and actual project title were retained; unsupported old event/resource descriptions were removed.

## 8. Validation performed

- **File and separation:** `MoonBase_Final_Presentation.pptx` exists at the project root as a new file. The original PowerPoint was not edited.
- **Copy integrity and references:** The root deliverable’s SHA-256 matches the validated staged PPTX. The package contains 15 speaker-note parts and six external source links on slide 14; the note text contains all six NASA source URLs.
- **PowerPoint package:** The presentation finalizer reported package integrity **pass**, 15 slides, and zero findings.
- **Layout and fonts:** The geometry validator reported **pass**, zero findings and warnings, a 16:9 slide size (13.3333 × 7.5 inches), and Arial as the only observed font family.
- **Reopen/import:** The finalizer reopened the exact staged PPTX through the Artifact Tool importer successfully and reported 15 slides.
- **Rendered inspection:** All 15 slides were rendered to PNGs at presentation size, assembled into a montage for sequence review, and reviewed individually at full size. No blank slides, missing images, clipped text, overflow, or unresolved placeholders were observed. Authentic screenshots rendered correctly.
- **Game verification:** Local `/api/v1/health` returned `{"status":"UP"}`. The live browser completed the documented screenshot route and showed the success result with final supplies `(1, 6, 5, 6)`.
- **Science references:** Each listed source URL was opened or verified against its official NASA/NASA NTRS page; claims were checked against the cited pages and report. The game/source boundaries are stated in the deck.
- **Native PowerPoint application:** The file was parsed, imported, and rendered with the presentation tool. It was not opened in Microsoft PowerPoint during this task, so native PowerPoint rendering remains unverified.
- **Automated test suites:** Existing results in `docs/JUDGES_BRIEFING.md` say backend 9 passed and frontend 3 passed. They were not rerun for this deck and are reported as documented results, not as tests performed here.

Build and render artifacts are retained under `presentation-build/`; the requested deliverables are the root-level PowerPoint and this report.
