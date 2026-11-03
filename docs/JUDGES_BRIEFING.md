# MoonBase — Judges' Technical and Science Briefing

- **Project:** MoonBase: 4 Days to Survive
- **Audience:** Young explorers, approximately ages 7–12
- **Challenge context:** NASA Space Apps Challenge 2026, Junior Astronaut Mission Trainer
- **Project status:** Independent educational project; not an official NASA product.

## 1. Project overview

MoonBase turns space-systems learning into a short decision game. A player guides a lunar crew through four mission-planning rounds, choosing how to allocate limited Power, Water, Food, and Shelter readiness. The learning objective is to see that life-support systems connect: a repair may cost power today but conserve water later, a grow tray can spend power and water before producing food, and shelter preparation changes the final storm plan.

Four rounds keep the activity small enough for a classroom or live demonstration while still allowing delayed effects and a real end state. Each mission starts fresh. No player account, saved progress, score history, or personal data collection is involved.

## 2. How the game works

1. The player starts a mission and reads the briefing and resource meanings.
2. Days 1–4 present a solar-array dust/shelter-planning event, water-recovery maintenance, food planning, and a solar-storm shelter decision.
3. The player selects one server-provided choice and submits it.
4. The backend replays the complete choice history, applies the rules, and returns the next event or final result with an explicit resource breakdown.
5. The final report shows supplies, outcomes, prior decisions, and learning takeaways. Restart clears browser memory and requests a new initial state.

All decision choices have a trade-off. Some effects apply immediately; array cleaning, recycler service, CO₂-loop maintenance, shelter preparation, and grow lights can also change later days. The status is `SUCCEEDED` only after four choices if Power, Water, and Food remain above zero, Shelter readiness is at least 6, and protection is activated and ready. A resource at zero ends the mission in failure; passive shelter also requires prior preparation. There is no score, random punishment, hidden event, or extra day.

## 3. Resource rules and formulas

Every quantity, rate, threshold, choice cost, and scheduled bonus in this section is a **game value**, chosen for four-day balance. NASA sources support the themes, not these numbers.

| Variable           | Start | Range | Daily change | Special effects                                                                        |
|--------------------|------:|------:|--------------|----------------------------------------------------------------------------------------|
| `power`            |    12 |  0–12 | −2           | Clean array: +1 on Days 2–4. Decisions may spend or add Power.                         |
| `water`            |    12 |  0–12 | −2           | Recycler service: +1 on Days 3–4. Grow tray costs 1 Water on Day 3.                    |
| `food`             |    10 |  0–12 | −2           | Grow tray: +2 or +4 on Day 4 depending on Water; meal crate: +3 immediately on Day 3 (and costs 1 Power). |
| `shelterReadiness` |     8 |  0–12 | −1 each day  | Day 1 preparation: +2 and no wear Days 2–4. Day 4 storm: −2. Shelter choice: +2 or +4. |

For every resource and day, exactly as implemented:

```text
After[d,r] = clamp(Before[d,r] + Daily[d,r] + Scheduled[d,r] + Event[d,r] + Choice[d,r], 0, 12)
```

Calculation order: daily consumption/wear → scheduled prior-choice effects → Day 4 grow-harvest Water check → Day 4 storm hazard → selected choice → integer clamp to 0–12 → failure/success check. `Daily` is −2 for Power, Water, and Food, except that CO₂-loop service changes later Power upkeep to −1 as a simplified game rule. Shelter wear is −1 unless the Day 1 preparation effect is active from Day 2 onward. `Scheduled` contains +1 Power from the array on Days 2–4, +1 Water from the recycler on Days 3–4, and a Day 4 grow harvest of +2 Food when resulting Water is ≤5 or +4 otherwise. `Event` is −2 Shelter readiness on Day 4 and zero otherwise. Every other immediate amount is in `Choice`. The backend response reports each term, the bounded result, and the actual net change.

### Choice effects

| Day / choice                   | Immediate `Choice`             | Delayed effect                          |
|--------------------------------|--------------------------------|-----------------------------------------|
| Day 1 `clean_solar_array`      | Power −1                       | Power +1 on Days 2–4                    |
| Day 1 `connect_spare_battery`  | Power +1                       | None                                    |
| Day 1 `prepare_storm_shelter`  | Power −1, Shelter readiness +2 | Removes Shelter-readiness wear Days 2–4 |
| Day 2 `service_water_recycler` | Power −1, Water +1             | Water +1 on Days 3–4                    |
| Day 2 `use_backup_water_pack`  | Power −2, Water +5             | None; Water clamps to 12                |
| Day 2 `inspect_co2_removal_loop` | Power −1                    | Power upkeep is 1 lower on Days 3–4; no Oxygen or Water is generated |
| Day 3 `start_grow_light_tray`  | Power −2, Water −1             | Food +2 or +4 on Day 4 depending on Water after upkeep and scheduled recovery |
| Day 3 `open_meal_crate`        | Power −1, Food +3              | None                                    |
| Day 4 `full_storm_shelter`     | Power −1 prepared / −2 unprepared, Shelter readiness +4 | Activates protection |
| Day 4 `passive_storm_shelter`  | Shelter readiness +2           | Requires prior shielding preparation    |

### Worked successful mission

The path `clean_solar_array` → `service_water_recycler` → `start_grow_light_tray` → `full_storm_shelter` is calculated as follows. Tuple order is Power, Water, Food, Shelter readiness.

| Checkpoint | Arithmetic | Expected result |
|---|---|---|
| Start | Initial values | `(12, 12, 10, 8)` |
| Day 1 | Daily `(-2,-2,-2,-1)` + choice `(-1,0,0,0)` | `(9,10,8,7)` |
| Day 2 | Daily `(-2,-2,-2,-1)` + solar `(1,0,0,0)` + choice `(-1,1,0,0)` | `(7,9,6,6)` |
| Day 3 | Daily `(-2,-2,-2,-1)` + solar/recycler `(1,1,0,0)` + choice `(-2,-1,0,0)` | `(4,7,4,5)` |
| Day 4 | Daily `(-2,-2,-2,-1)` + solar/recycler/harvest `(1,1,4,0)` because Water after recovery is 6 + storm `(0,0,0,-2)` + unprepared full choice `(-2,0,0,4)` | `(1,6,6,6)` — success |

This is a hand-calculated expectation. **Observed API output is reported separately in the verification status below.**

### Balancing rationale and boundaries

- The initial amounts leave room to compare immediate supplies with repairs that pay back later, while four daily consumption steps make choices matter.
- A player can succeed with the worked path. The revised backup-water route `clean_solar_array → use_backup_water_pack → open_meal_crate → full_storm_shelter` now succeeds at `(1,8,5,6)` while retaining a larger Water reserve.
- A Day 2 backup-water calculation can exceed the maximum before clamping: Water `10 − 2 + 5 = 13` after Day 1, then becomes 12. The response's `change` is +2 relative to the pre-Day-2 value of 10.
- Negative totals clamp to zero before terminal checks; zero Power, Water, or Food fails on that day. The Day 4 readiness threshold is 6. No rounding is needed because all amounts are integers.
- There is no final score. The result is derived only from the documented survival conditions.

## 4. NASA science evidence and simplifications

The exact evidence, publication details, access date, and direct links are in [SCIENCE_REFERENCES.md](SCIENCE_REFERENCES.md). The key features are:

- **Dust and power:** NASA's lunar-dust report and solar-array dust-mitigation project discuss dust sticking to exposed surfaces and risks to array efficiency. Day 1 applies that as a maintenance decision; one sweep and a `+1 Power` future bonus are invented game values.
- **Water recovery:** NASA reports that ISS ECLSS combines collection, filtering, treatment, and recycling and demonstrated a 98% recovery goal. Day 2 introduces a fictional serviceable recycler; its one-unit gains do not represent that percentage or a lunar system.
- **Growing food:** NASA's Advanced Plant Habitat uses LED lighting and controlled water/nutrient delivery. Day 3 trades resources for a delayed harvest; the one-day delay is compressed game time, not real crop growth.
- **Radiation sheltering:** NASA describes an Orion plan to arrange stored supplies into a temporary shelter during a solar-particle event, and separately discusses possible lunar shielding ideas. The game borrows the planning theme for a fictional base; its shelter-readiness points are not a measurement of radiation protection.

## 5. Technical architecture

The browser uses plain HTML, CSS, and vanilla JavaScript. It sends only the complete ordered decision history. The Java 17 Spring Boot backend owns initial resources, choice IDs, validation, deterministic replay, clamping, delayed effects, day transitions, feedback, and terminal outcomes. Details and local commands are in [API_AND_ARCHITECTURE.md](API_AND_ARCHITECTURE.md).

Each request is recomputed from canonical Day 1 values. There is no account, database, cookie, browser storage, URL state, server session, gameplay token, or saved mission. A history can be replayed or altered by a user, so the architecture protects calculation authority but is not anti-cheat security.

## 6. Demonstrated verification

This section separates historical verification already recorded in the repository from the Phase 1 rerun. Historical browser/API observations remain evidence of the implemented behavior at that time; they are not claimed as newly executed unless explicitly labeled.

### Verification record

- **Backend build and automated tests (historical record):** The repository record previously documented `BUILD SUCCESS` on Java 17.0.19 and 10 passing `MissionTrainerBackendApplicationTests` tests. Those old results remain historical evidence. The Phase 2 offline Maven run compiled the changed backend and completed `Tests run: 10, Failures: 0, Errors: 0, Skipped: 0` using the existing local cache.
- **Frontend automated tests (Phase 1 rerun):** `node --test mission-trainer-frontend\tests\app.test.cjs` completed with 5 tests: 5 passed, 0 failed, 0 skipped. The dependency-free DOM harness covers the connected four-day flow, server-provided results, restart, disabled buttons while requests are pending, request failure and retry, communication demo isolation, CO₂ choice display, focus/announcements, and no browser persistence.
- **Frontend automated tests (Phase 2):** `node --test mission-trainer-frontend/tests/app.test.cjs` completed with 6 tests: 6 passed, 0 failed, 0 skipped. The added coverage verifies that the UI displays backend-reported delayed Food `+4` and `+2` values and only shows the reduced-harvest explanation when supplied by the backend.
- **Startup and health:** `java -jar mission-trainer-backend\target\mission-trainer-backend-0.0.1-SNAPSHOT.jar --server.address=127.0.0.1` started Spring Boot 4.1.2 on Java 17.0.19 and Tomcat port 8080. `GET /api/v1/health` returned `{"status":"UP"}`.
- **Configured port:** Launching with `PORT=8082` started the server on port 8082; its health endpoint returned `UP`.
- **Start response:** `POST /api/v1/missions/start` returned `ACTIVE`, Day 1 of 4, initial values `(12,12,10,8)`, three Day 1 choices, and NASA source links.
- **Successful full API path:** The hand-calculated `clean_solar_array` → `service_water_recycler` → `start_grow_light_tray` → `full_storm_shelter` path returned `SUCCEEDED` with `(1,6,6,6)`, matching the independent arithmetic table above.
- **Phase 2 exhaustive API verification:** The rebuilt Spring Boot classes served on port 18083; all 36 revised paths returned the expected status, resources, and primary failure reason with `MISMATCH_COUNT=0` and `HTTP_ERROR_COUNT=0`. The successful IDs were `1, 3, 7, 9, 11, 15, 21, 23, 28, 33, 34, 35, 36`.
- **Determinism:** Repeating the same complete valid history returned the same status, resources, and latest resource changes.
- **Upper bound:** Day 2 backup-water request returned Water 12. Its breakdown was `before=10`, `daily=-2`, `choice=+5`, `after=12`, `change=+2`, confirming the 12-unit clamp.
- **Power failure:** The documented backup-water plus grow-tray path returned `FAILED`, limiting resource `Power`, with Power 0.
- **Shelter protection failure:** A full four-day request using an unprepared shelter and the passive Day 4 option returned `FAILED` with primary reason `PASSIVE_SHELTER_REQUIRES_PREPARED_SHIELDING`, while the other supplies remained positive.
- **Input errors:** Invalid choice, out-of-order day, duplicate day, empty history, and malformed JSON returned HTTP 400 with the documented safe error shape/code. An unknown API route returned HTTP 404 and `NOT_FOUND`.
- **No client-authoritative totals:** A Day 1 request containing an extra forged `resources` object still returned the backend result (Power 9, Water 10); the submitted values did not control the state.
- **Revised terminal feedback:** The backup-pack change removes the previous Day 3 Power failures from the 36-path matrix. Paths 29 and 30 now reach Day 4 and fail there from Power; Day 4 grow feedback reports the normal +4 harvest for those Water-rich paths.
- **Local frontend serving and CORS:** `python -m http.server 5500 --directory mission-trainer-frontend` served `/html/` and the local SVG with HTTP 200. CORS preflights from `http://localhost:5500` and `http://127.0.0.1:5500` were accepted; an unlisted origin was rejected with HTTP 403. Automated API tests also submitted forged client `resources` values and confirmed that the backend returned recalculated values.
- **Frontend source checks:** The JavaScript source parsed successfully with Node 20.19.0. A source scan found no browser-storage API, cookie, URL-state, or `innerHTML` use in the frontend implementation.

### Live Chrome walkthrough completed

The local servers were started from the repository root with the documented commands. In the existing Google Chrome window at `http://127.0.0.1:5500/html/`, I completed the welcome, briefing, all four gameplay screens, feedback screens, results, restart, and refresh flow.

The actual winning path was `clean_solar_array` → `service_water_recycler` → `start_grow_light_tray` → `full_storm_shelter`. Each report showed the selected choice, explanation, calculation breakdown, scheduled effect, and returned resources:

| Checkpoint | Power | Water | Food | Shelter readiness |
|---|---:|---:|---:|---:|
| Start | 12 | 12 | 10 | 8 |
| Day 1: clean array | 9 | 10 | 8 | 7 |
| Day 2: service recycler | 7 | 9 | 6 | 6 |
| Day 3: start grow tray | 4 | 7 | 4 | 5 |
| Day 4: full shelter | 1 | 6 | 6 | 6 |

The Day 3 report showed no grow-tray Food yet; the canonical Day 4 report showed the normal scheduled `+4 Food` because Water after upkeep and recycler recovery was 6. A low-Water route reports the actual `+2 Food` delayed value and explains that the grow tray produced a smaller harvest. The result screen declared success, repeated the final `(1,6,6,6)` values, listed all four choices, and showed the takeaways.

Two losing paths were also played in Chrome:

- **Delayed Power failure:** `prepare_storm_shelter` → `use_backup_water_pack` → `start_grow_light_tray` now reaches `(1,9,4,9)` on Day 3, then fails from Power on Day 4 after the Day 4 calculation. The backup pack no longer causes an early Day 3 terminal state in this route.
- **Insufficient final protection:** `clean_solar_array` → `use_backup_water_pack` → `start_grow_light_tray` → `passive_storm_shelter` ended Day 4 at `(1,7,5,4)`. The result said “Mission paused on Day 4” and explained that passive shelter required earlier shielding preparation.

After the successful mission, “Start a new mission” returned to the briefing with fresh `(12,12,10,8)` supplies. Refreshing the Chrome tab returned to the welcome screen and did not restore mission history.

### Responsive and accessibility checks

Responsive layout checks used the browser test tab's explicit viewport override at `1280×900`, `768×1024`, and `390×844`; these were not emulated in the native Chrome window. At all three sizes `documentElement.scrollWidth` matched the usable viewport width. On mobile, the four resource meters became two columns, decision cards stacked, and the Confirm control fit the screen width. At tablet size, resource meters and choice cards remained in two/four-column layouts without horizontal overflow.

In the separate in-app browser DOM keyboard check, Tab moved to focusable NASA source links and then to choices, showing a 3px visible focus outline. Enter selected a choice (`aria-pressed=true`), Tab reached Confirm, and Enter submitted it. After the response, focus moved to `main#app`; the `role="status"` / `aria-live="polite"` region announced the Day 1 result. The live Chrome accessibility tree also exposed named resource meters, choices, and status text.

No NVDA, JAWS, VoiceOver, or other screen reader was run, so actual spoken output and screen-reader behavior remain unverified.

### Browser and server diagnostics

- The in-app browser's captured `warn`/`error` console log was empty. Chrome's local static-server log showed the HTML, CSS, JavaScript cache-busted URL, and SVG assets loading successfully (`200` or valid cache `304`). The game screens and authoritative API-returned state updated during actual Chrome play.
- Chrome also requested `/.well-known/appspecific/com.chrome.devtools.json`, which the Python static server returned as `404`. Based on its path, this appears to be a Chrome DevTools discovery probe rather than a game asset or API route; no missing game asset was observed.
- Chrome's DevTools Network/Console panels were not successfully captured, so per-request HTTP status/header inspection and the native Chrome console remain unverified. The Spring runtime log showed normal dispatcher initialization and no exception output during the walkthrough; application access logging is not enabled.
- The frontend source and OpenAPI contract match the three implemented endpoints. The import file declares `GET /api/v1/health`, `POST /api/v1/missions/start`, and `POST /api/v1/missions/decisions`, with the documented response/error codes.

### Not verified or still pending

- No child/user study, NASA validation, public deployment, production-origin CORS test, or performance measurement was performed.
- The repository currently has no `LICENSE`/`COPYING` file. The 2026 participant terms require original solution content to be freely available or OSI-licensed and say NASA will distribute it under Apache 2.0 if no license is specified. The project submitter must choose or confirm the intended license before submission; no license was added during this audit.
- The 2026 participant terms reviewed require citing every source used. The project includes NASA source records and now discloses Codex assistance; the terms page reviewed did not specify an AI-assistance disclosure format. Confirm any additional instructions on the final submission form.

The local services used for verification were not deployed publicly. See [API_AND_ARCHITECTURE.md](API_AND_ARCHITECTURE.md) for hosting configuration required before a public demonstration.

## AI assistance and competition notes

OpenAI Codex assisted with implementation, test authoring, technical review, and documentation. The project submitter remains responsible for final verification and submission. The [2026 participant terms](https://www.spaceappschallenge.org/legal/) require source citations and freely available or OSI-licensed original solution content; the terms page reviewed on 27 October 2026 did not state a specific AI-disclosure format. This disclosure is included voluntarily for transparency. The project remains an independent educational entry, not an official or NASA-endorsed product.

## 7. Likely judges' questions

**What makes this educational?**

Players must reason about connected supplies and delayed system effects, then receive feedback explaining the resource arithmetic and the science behind each event.

**Why four days?**

Four rounds are long enough to make early repairs affect later decisions and short enough for a child or judge to complete in one demonstration. A game day is a planning round, not a real lunar day.

**How do you know the science is accurate?**

Each claim used in the game has a NASA primary-source reference and evidence note. The sources support the qualitative ideas; game balance values are clearly separated and labeled.

**Which values come from NASA?**

No resource points, daily costs, choice effects, or readiness thresholds come from NASA. They are all game values. The NASA sources support dust/array, water-recovery, plant-growth, and sheltering themes.

**How are decisions calculated?**

The browser submits the full ordered list of choices. The backend replays it from fixed initial supplies, applies daily use and scheduled effects, applies the day's event and choice, clamps values to 0–12, then checks the outcome.

**How do earlier choices matter?**

Cleaning the array adds Power on Days 2–4; servicing the recycler returns Water on Days 3–4; CO₂-loop maintenance reduces later Power upkeep as a simplified game rule; preparing the shelter prevents later readiness wear; starting the grow tray adds +2 or +4 Food on Day 4 depending on Water after upkeep and scheduled recovery.

**How was the game tested?**

Use the observed Maven, HTTP, and browser outcomes recorded in this file. Do not claim a check that is still listed as unverified.

**What are the limitations?**

This is a compact educational model, not a lunar engineering simulator. Crop time and resource units are compressed, mission history is not saved, and stateless replay is not anti-cheat protection.

**How could it grow later?**

Potential future work could add more sourced mission events, teacher-led discussion prompts, or validated educational activities while keeping the source evidence and game values distinct.
