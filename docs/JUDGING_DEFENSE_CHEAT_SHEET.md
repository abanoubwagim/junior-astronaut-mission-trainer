# MoonBase Judging Defense Cheat Sheet

## 30-second project description

> MoonBase: 4 Days to Survive is a stateless educational lunar outpost game. A child chooses one operational action per planning round, and a Java/Spring Boot backend replays the complete history, applies daily and delayed effects, and explains the result. The four meters are deliberately simplified game values. NASA sources support the themes—ECLSS, water recovery, controlled plant growth, lunar dust, radiation sheltering, and communication propagation—but the running app does not call a NASA API or claim to calculate real habitat performance.

## The 20 hardest questions

### 1. “Which NASA API did you use?”

**Short answer:** None. We use static NASA references in the event responses; the browser calls only our local MoonBase API.

**What not to claim:** Do not say DONKI, NASA Open APIs, OSDR, or a NASA live feed is integrated.

**Show:** `MissionRulesService.java:43-61`; `app.js:47-75`; [NASA Open APIs](https://api.nasa.gov/).

### 2. “Where did your resource numbers come from?”

**Short answer:** They are team-designed game parameters for a four-round puzzle, not NASA measurements.

**What not to claim:** Do not give Power units as watts, Water as liters, Food as calories, or Shelter readiness as a physical percentage.

**Show:** `MissionRulesService.java:15-17,32-41`; `README.md:33-39`; [`SCIENTIFIC_ASSUMPTIONS_AND_EQUATIONS.md`](SCIENTIFIC_ASSUMPTIONS_AND_EQUATIONS.md).

### 3. “Is Shelter readiness a radiation dose?”

**Short answer:** No. It is a qualitative game state for preparation and final shelter readiness.

**What not to claim:** Do not claim dose, dose rate, shielding percentage, regolith thickness, or medical risk.

**Show:** `MissionRulesService.java:39-40,267-270`; `app.js:462-463`; [NTRS 19890004839](https://ntrs.nasa.gov/citations/19890004839) to explain how real dose modeling works.

### 4. “Does DONKI tell you how much radiation reaches the crew?”

**Short answer:** No. DONKI contains space-weather event information and analyses. Local habitat dose also requires particle spectra at the location, shielding geometry/materials, transport, instruments, and crew context.

**What not to claim:** Never turn a DONKI SEP record directly into a game dose or readiness number.

**Show:** [DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/); [NTRS lunar regolith shielding report](https://ntrs.nasa.gov/citations/19890004839).

### 5. “Does CO₂ removal make oxygen?”

**Short answer:** No. NASA describes CO₂ removal as air revitalization and oxygen production as a separate water-electrolysis subsystem. MoonBase deliberately keeps them separate.

**What not to claim:** Do not call the Day 2 maintenance choice an oxygen generator.

**Show:** [NASA ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/); `MissionRulesService.java:365`; `app.js:453-455`.

### 6. “Is the 90% or 98% water figure used in the game?”

**Short answer:** No. NASA’s approximately 90% statement is for water recovery on station, and the 98% result/goal is ISS U.S.-segment context. MoonBase’s +1 Water effects are game units.

**What not to claim:** Never say the lunar base recovers 98% or that one game point equals a percentage.

**Show:** [NASA ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/); [NASA ISS milestone](https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/).

### 7. “Why does brushing dust give more Power if NASA warns against brushing?”

**Short answer:** That choice is a fictional game action. NASA’s dust report supports the risk to exposed arrays, while the game’s specific maintenance method and +1 bonus are invented for teaching delayed trade-offs.

**What not to claim:** Do not call it a NASA procedure or recommendation.

**Show:** [NASA/TM-20240003496](https://ntrs.nasa.gov/citations/20240003496) and its [PDF](https://ntrs.nasa.gov/api/citations/20240003496/downloads/TM-20240003496.pdf); `MissionRulesService.java:396-400`.

### 8. “Is a grow-tray harvest in one day realistic?”

**Short answer:** No. It is compressed game time. NASA’s Advanced Plant Habitat supports the idea of controlled light, water, nutrients, and plant research, but not +4 Food the next day.

**What not to claim:** Do not present +4 as a crop yield, measured growth rate, or APH result.

**Show:** [NASA Advanced Plant Habitat](https://science.nasa.gov/mission/advanced-plant-habitat/); `MissionRulesService.java:420-430`.

### 9. “What is scientifically real about the Day 4 solar-particle alert?”

**Short answer:** Solar energetic particle events and the need to prepare shelter are real NASA topics. This particular event, timing, −2 effect, and four-day story are fictional.

**What not to claim:** Do not imply it is a live forecast, a historical DONKI record, or a measured lunar event.

**Show:** `MissionRulesService.java:431-432`; [NASA lunar radiation article](https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/).

### 10. “Why is a lunar communication round trip 2.6 seconds?”

**Short answer:** NASA says Moon light takes about 1.3 seconds one way, so the light-only minimum round trip is approximately `1.3 × 2 = 2.6 seconds`.

**What not to claim:** Do not call 2.6 seconds the complete operational response time.

**Show:** [NASA Webb explainer](https://science.nasa.gov/mission/webb/science-overview/science-explainers/how-does-webb-see-back-in-time/); frontend lines `app.js:289-292`.

### 11. “Why does NASA communication research mention 3–14 seconds if you say 1.3?”

**Short answer:** They describe different quantities. 1.3 seconds is light propagation; 3–14 seconds is an operational one-way latency range discussed in a NASA communication-delay research context that includes more than propagation.

**What not to claim:** Do not treat those values as contradictory or use 3–14 seconds as a universal fixed lunar delay.

**Show:** [NTRS 20250000703](https://ntrs.nasa.gov/citations/20250000703); [NASA Webb explainer](https://science.nasa.gov/mission/webb/science-overview/science-explainers/how-does-webb-see-back-in-time/).

### 12. “Why does communication not affect the game?”

**Short answer:** We kept it optional and UI-only to avoid turning a scientifically subtle topic into an artificial gameplay penalty. The demo changes no history, resources, outcome, or replay.

**What not to claim:** Do not say the project models local autonomy or operational command latency in the mission rules.

**Show:** `app.js:8-15,270-294`; `app.test.cjs:344-361`.

### 13. “Does the project really meet the challenge?”

**Short answer:** It provides a functioning interactive lunar outpost planning experience with decisions, consequences, and educational feedback. The strongest honest qualification is that it is a compact educational prototype, not a full engineering simulator; the final challenge wording and target-age label should be confirmed.

**What not to claim:** Do not claim every challenge subsystem is physically simulated or that NASA validated it.

**Show:** live four-day flow; `MissionRulesService.java`; `README.md`; team-confirmed official challenge page.

### 14. “Why are the ages inconsistent?”

**Short answer:** The supplied challenge brief says 7–12, while the current README and game rules say 8–12. We should correct that inconsistency before submission rather than improvise an answer.

**What not to claim:** Do not say the game has been proven suitable for either range without user testing.

**Show:** `README.md:13`; `GAME_RULES.md:9`; confirm official brief.

### 15. “Are the 12 winning paths a scientific statistic?”

**Short answer:** No. They are the result of exhaustive enumeration of our own 36 game paths. They measure the current ruleset’s balance, not lunar mission probability.

**What not to claim:** Do not report “one-third of missions survive” as an engineering or NASA statistic.

**Show:** `MissionTrainerBackendApplicationTests.java:61-94`; [`SCIENTIFIC_ASSUMPTIONS_AND_EQUATIONS.md`](SCIENTIFIC_ASSUMPTIONS_AND_EQUATIONS.md#independently-checked-36-path-distribution).

### 16. “How do you know the backend is not calculating the same wrong result as the test?”

**Short answer:** The exhaustive test contains a separate expected-state transition model and compares exact states and reasons against the service. It is not just a snapshot or an aggregate count.

**What not to claim:** Do not say this proves scientific validity; it proves internal rule consistency for the tested model.

**Show:** `MissionTrainerBackendApplicationTests.java:61-94` and the `ExpectedState` helper.

### 17. “Can a player forge resources from the browser?”

**Short answer:** The request contract accepts the ordered choices, not authoritative resource totals. The backend starts from canonical initial values and recomputes the response. A user can replay or alter choices because the game is intentionally stateless, but cannot make the server accept client totals.

**What not to claim:** Do not call it a secure competition or anti-cheat system.

**Show:** `MissionDtos.java`; `MissionRulesService.java:68-123`; `API_AND_ARCHITECTURE.md:9`.

### 18. “Why no database or accounts?”

**Short answer:** The prototype needs neither to teach the four-round mission. It keeps no personal data and makes refresh start a new mission. That is a deliberate scope choice, not a missing persistence requirement.

**What not to claim:** Do not promise resume-after-refresh or cross-device progress.

**Show:** `README.md:33-39`; `app.js:105-127`; frontend refresh test.

### 19. “What is the biggest educational weakness?”

**Short answer:** The game explains its rules but has not yet been evaluated with children or teachers. We can show intended learning outcomes and feedback mechanics, but we must not claim measured learning gains.

**What not to claim:** Do not say the interface is age-validated or classroom-proven.

**Show:** `app.js:476-507`; `docs/JUDGES_BRIEFING.md:153-157`; propose a small user study as future work.

### 20. “What would you improve first?”

**Short answer:** First, make the official audience wording consistent and verify the challenge submission requirements. Then add communication source attribution and run child/teacher accessibility testing. Only after that would I consider a carefully bounded historical NASA data activity; I would not add live data just for appearance.

**What not to claim:** Do not promise a larger simulator or extra resources without educational justification and validation.

**Show:** the repository audit, source files, and this documentation; agree on priorities with the team.

## Questions we must never answer incorrectly

1. **Live API claim:** “We integrated DONKI” is false. The running application does not call it.
2. **NASA-calibration claim:** Power, Water, Food, Shelter readiness, costs, thresholds, and delays are not NASA measurements.
3. **CO₂ claim:** CO₂ removal does not automatically generate oxygen.
4. **Radiation claim:** Shelter readiness is not dose, percentage, thickness, or medical risk.
5. **DONKI claim:** DONKI event data is not a local habitat dose measurement.
6. **Dust-cleaning claim:** NASA’s dust report does not validate manual brushing; the action is fictional.
7. **Crop claim:** +4 Food after one turn is not a real crop yield.
8. **Communication claim:** 2.6 seconds is light-only round-trip propagation, not an end-to-end operational response.
9. **Validation claim:** The game is not NASA-endorsed or a validated lunar-habitat simulator.
10. **Education claim:** The intended child audience is not the same as a completed child user study.

## Key numbers to memorize

| Number | Exact safe statement | Classification |
|---:|---|---|
| 1.3 s | Approximate one-way Moon–Earth light propagation in NASA’s explainer | NASA-derived measurement |
| 2.6 s | Minimum light-only round trip, calculated as `2 × 1.3 s` | Calculated from NASA-derived data |
| 3–14 s | One-way lunar operational latency range discussed in NTRS 20250000703’s mission-operations context | NASA-reported research context, not a universal fixed delay |
| ~90% | NASA ECLSS page’s current water-recovery statement “on station” | NASA-derived station context |
| 98% | ISS U.S.-segment total-recovery goal/demonstration described by NASA | NASA-derived ISS context |
| 12 | Power/Water maximum and game scale | Simplified game parameter |
| 10 | Starting Food | Simplified game parameter |
| 8 | Starting Shelter readiness | Simplified game parameter |
| 6 | Day 4 readiness threshold | Simplified game parameter |
| 36 | Valid complete choice combinations | Game combinatorics |
| 12 | Current successful paths | Game simulation result, not science |

## Five sources to open during judging

1. [NASA ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/)
2. [NASA ISS water-recovery milestone](https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/)
3. [NASA Advanced Plant Habitat](https://science.nasa.gov/mission/advanced-plant-habitat/)
4. [NASA lunar radiation protection](https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/)
5. [NASA Webb light-travel explainer](https://science.nasa.gov/mission/webb/science-overview/science-explainers/how-does-webb-see-back-in-time/)

## Team confirmations required before submission

- Confirm the exact official challenge requirements from the event page; the page was unavailable to the research fetcher during this audit.
- Resolve the official target-age wording versus `README.md` and `GAME_RULES.md` (7–12 in the supplied brief versus 8–12 in the repository).
- Confirm which presentation file is final and remove or correct any stale slide/note that describes the pre-consolidation rules.
- Confirm any license and participant-term requirements; the repository audit notes no `LICENSE`/`COPYING` file.
- Confirm that all NASA source links and any future presentation source claims are visible and current.
- Decide whether the communication demo should gain a clickable NASA source link; it currently has accurate text but no NASA link in the UI.

