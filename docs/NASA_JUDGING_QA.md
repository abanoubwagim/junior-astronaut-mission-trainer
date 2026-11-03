# MoonBase NASA Judging Q&A

This question bank is written for a judging panel. The short answer is intended to fit roughly 20–45 seconds when spoken. The technical answer is for a follow-up. “Verified” means supported by the repository or an identified primary source. “Team confirmation required” means the final intended audience, challenge interpretation, or submission claim must be confirmed by the team before speaking.

The safest overall description is: **MoonBase is a stateless, deterministic educational lunar resource-planning game inspired by NASA references. It is not a live NASA-data application and not a validated lunar-habitat simulator.**

## A. Project concept and challenge alignment

### 1. What problem does MoonBase solve?

**Short answer:** MoonBase gives children a small, playable way to practice systems thinking. They must keep power, water, food, and shelter readiness positive while seeing that an early choice can help one system later but cost another system now. It is an educational model, not a solution for operating a real habitat.

**Technical answer:** The backend replays one choice per planning round, applies daily effects, delayed effects, clamping, and terminal checks, then returns a breakdown explaining each change. This directly connects a decision to a consequence without asking the player to understand engineering units.

**Evidence:** [`MissionRulesService.java`](../mission-trainer-backend/src/main/java/org/juniorastronaut/missiontrainer/game/MissionRulesService.java#L134-L299); [`GAME_RULES.md`](GAME_RULES.md).

**Status:** Verified in repository.

**Likely follow-up:** What learning outcome can you measure with a child user study?

### 2. Why did you choose a lunar outpost?

**Short answer:** The Moon is close enough for children to understand the setting, but it still lacks Earth’s protective atmosphere and presents dust, radiation, life-support, and communication challenges. The game uses those real themes while clearly labeling its numbers as game values.

**Technical answer:** NASA’s lunar-weather and radiation material describes a space environment with solar wind, cosmic rays, CMEs, and no Earth-like atmosphere. MoonBase uses dust/power, shelter planning, ECLSS, and light-travel examples as qualitative anchors; it does not simulate the lunar surface quantitatively.

**Evidence:** [NASA Weather on the Moon](https://science.nasa.gov/moon/weather-on-the-moon/); [NASA radiation article](https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/); Day 1/Day 4 events in `MissionRulesService.java:388-442`.

**Status:** Scientific basis verified; final challenge-alignment wording requires team confirmation.

**Likely follow-up:** Why not Mars?

### 3. How does MoonBase answer the Junior Astronaut Mission Trainer challenge?

**Short answer:** Based on the challenge brief supplied to the team, the player operates a small lunar outpost through four planning rounds and learns how operational decisions affect survival. The prototype provides an interactive mission loop, not just explanatory text. The exact official wording should be rechecked on the event page before submission.

**Technical answer:** The application has welcome/briefing, event choices, server-calculated feedback, resource breakdowns, system state, terminal results, and replay from a complete history. Challenge-specific compliance claims should be tied to the official page, not inferred from the repository alone.

**Evidence:** `app.js:175-185,244-265,476-558`; `MissionController.java:17-35`; supplied challenge URL: [NASA Space Apps challenge](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/).

**Status:** Product behavior verified; official page was unavailable to the research fetcher, so exact challenge wording requires confirmation.

**Likely follow-up:** Which requirement is intentionally not modeled?

### 4. What makes it an educational mission trainer rather than only a resource-management game?

**Short answer:** The player sees a science note, chooses an action, receives the server’s arithmetic breakdown, and gets a plain-language lesson about the trade-off. The feedback says what changed now and what is scheduled later, so the child can connect an operational decision to a system consequence.

**Technical answer:** `DecisionFeedback` contains the choice explanation, why it matters, future effect, and four `ResourceBreakdown` objects. The frontend renders those values without recalculating them.

**Evidence:** `MissionDtos.java:48-64`; `MissionRulesService.java:215-229,344-380`; `app.js:476-507`.

**Status:** Verified in repository.

**Likely follow-up:** How will you know the child understood the lesson rather than merely won?

### 5. Who is the target audience?

**Short answer:** The supplied challenge brief identifies ages 7–12, and the repository now uses that label consistently. This remains a target audience statement, not evidence of child-user validation or measured learning gains.

**Technical answer:** The interface uses short sentences, four named meters, one choice per round, visible explanations, keyboard focus, and no account or setup burden. No child user study has been performed, so suitability is a design intention, not an evaluated outcome.

**Evidence:** `README.md:13`; `GAME_RULES.md:9`; `app.js:244-265`; challenge brief supplied by the team.

**Status:** Repository mismatch verified; team confirmation required.

**Likely follow-up:** What evidence shows that seven-year-olds can read the terminology?

### 6. What are the main learning outcomes?

**Short answer:** Children practice delayed consequences, trade-offs, bounded resources, and the difference between maintaining a system and activating a shelter. They also learn that CO₂ removal and oxygen generation are separate life-support jobs, and that Moon communication has a light-travel component plus operational overhead.

**Technical answer:** The outcomes are encoded in the choice lessons and feedback, not in a separate score. There is no validated assessment instrument yet, so these are intended learning outcomes rather than measured educational results.

**Evidence:** `MissionRulesService.java:344-380`; `app.js:453-463`; [NASA ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/).

**Status:** Intended outcomes verified; measured effectiveness requires future study.

**Likely follow-up:** Why is there no mandatory quiz?

## B. Scientific foundation

### 7. What scientific research inspired the game?

**Short answer:** The core references are NASA’s ECLSS documentation, NASA’s ISS water-recovery reporting, the Advanced Plant Habitat page, a NASA lunar-dust technical memorandum, and NASA radiation-protection material. These sources support the ideas behind the events; they do not supply the game’s 0–12 values.

**Technical answer:** The exact titles and URLs are recorded in `MissionRulesService.java:43-61` and `docs/SCIENCE_REFERENCES.md`. The sources are exposed as static links in event responses; no source data is ingested.

**Evidence:** [`SCIENCE_REFERENCES.md`](SCIENCE_REFERENCES.md); [`SCIENTIFIC_FOUNDATION.md`](SCIENTIFIC_FOUNDATION.md).

**Status:** Verified in repository and primary sources.

**Likely follow-up:** Which source is strongest for a specific mechanic?

### 8. What is ECLSS?

**Short answer:** ECLSS means Environmental Control and Life Support System. NASA describes it as the group of systems that helps control the cabin environment and supplies, including water recovery, air revitalization, and oxygen generation.

**Technical answer:** NASA’s reference separates a Water Recovery System, an Air Revitalization System that removes contaminants and CO₂, and an Oxygen Generation System that electrolyzes water. MoonBase uses that separation to avoid saying that a CO₂ scrubber makes oxygen.

**Evidence:** [NASA ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/).

**Status:** Verified.

**Likely follow-up:** Which ECLSS subsystems are actually simulated?

### 9. How does water recovery work in the NASA reference?

**Short answer:** NASA describes recovering wastewater, cabin humidity condensate, and suit hydration water, then filtering, oxidizing, checking, and storing the cleaned water. MoonBase simplifies that into a recycler-maintenance choice and delayed game units.

**Technical answer:** The ECLSS page describes filtration beds, catalytic oxidation, conductivity checks, reprocessing of unacceptable water, and storage. The game does not model those components or use their measured throughput.

**Evidence:** [NASA ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/); `MissionRulesService.java:404-416`.

**Status:** Verified.

**Likely follow-up:** Is the game’s +1 Water equal to liters?

### 10. How are carbon dioxide removal and oxygen generation different?

**Short answer:** CO₂ removal cleans exhaled carbon dioxide from cabin air. NASA describes oxygen generation separately: water is electrolyzed to produce oxygen and hydrogen, with additional CO₂-reduction chemistry possible. MoonBase’s CO₂ choice therefore does not generate oxygen or water.

**Technical answer:** The backend only sets `airLoopServiced` and changes later Power upkeep from −2 to −1 as a simplified game rule. There is no Oxygen resource, gas balance, electrolysis calculation, or Sabatier model.

**Evidence:** [NASA ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/); `MissionRulesService.java:173-176,365`; `app.js:453-455`.

**Status:** Verified.

**Likely follow-up:** Why not add an Oxygen meter?

### 11. What is the 90% water-recovery statistic?

**Short answer:** NASA’s ECLSS page says the Water Recovery System can recover about 90% of the water on station. That is an ISS/station statement, not a lunar-habitat measurement and not a MoonBase gameplay parameter.

**Technical answer:** NASA’s 2023 ISS article separately describes a 98% total-recovery goal demonstrated on the U.S. segment with a Brine Processor Assembly; it also describes earlier 93–94% recovery. Neither number is inserted into the game’s Water equation.

**Evidence:** [NASA ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/); [NASA ISS milestone](https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/).

**Status:** Verified.

**Likely follow-up:** Why cite a station system for a Moon game?

### 12. Why is food production delayed?

**Short answer:** The delay teaches that production systems require inputs before they return a benefit. NASA’s Advanced Plant Habitat provides the real-world inspiration: controlled light, water, nutrients, and a managed growth chamber. The one-turn harvest is explicitly compressed game time, not a real crop-growth prediction.

**Technical answer:** `start_grow_light_tray` costs Power 2 and Water 1 on Day 3, then schedules Food +2 or +4 on Day 4 depending on Water after upkeep and scheduled recovery. The implementation does not represent crop species, biomass, photosynthesis, or the APH’s experimental durations.

**Evidence:** [NASA APH](https://science.nasa.gov/mission/advanced-plant-habitat/); `MissionRulesService.java:177-181,425-426`.

**Status:** Verified.

**Likely follow-up:** What would a real crop model need?

## C. NASA data and tools

### 13. Which NASA APIs did you actually use?

**Short answer:** None in the running application. The game uses static NASA reference links returned by its own backend. The browser only calls the local `/api/v1` MoonBase endpoints.

**Technical answer:** There is no NASA HTTP client, NASA host in `fetch`, API key, NASA JSON parser, scheduler, or data cache. The URLs in `MissionRulesService.java:43-61` are metadata, not data integrations.

**Evidence:** `app.js:47-75`; `MissionRulesService.java:43-61`; [NASA Open APIs catalog](https://api.nasa.gov/).

**Status:** Verified.

**Likely follow-up:** Would live data improve the game?

### 14. What is DONKI?

**Short answer:** DONKI is NASA’s Community Coordinated Modeling Center space-weather database. It catalogs and links events such as solar flares, coronal mass ejections, and solar energetic particles, with analyses and notifications.

**Technical answer:** DONKI offers public REST/OpenAPI access and event catalogs. It is event/context information, not automatically a local habitat dose sensor. MoonBase does not call it.

**Evidence:** [NASA CCMC DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/); [DONKI events guide](https://ccmc.gsfc.nasa.gov/DONKI/guide/events/).

**Status:** Tool facts verified; non-use verified in repository.

**Likely follow-up:** How could DONKI be used responsibly?

### 15. Why doesn’t a DONKI SEP record give the habitat’s radiation dose?

**Short answer:** An SEP record describes an event and observations or analyses at particular locations. Dose inside a habitat also depends on particle energy and fluence at the habitat, shielding material and geometry, transport through that material, instruments, and crew context. A DONKI record cannot be copied into the game’s Shelter meter.

**Technical answer:** NASA’s lunar-regolith report demonstrates that real dose predictions use event spectra and habitat/shielding configurations. A scientifically defensible transformation would require an explicit validated radiation transport model, not a lookup-table multiplier.

**Evidence:** [DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/); [NTRS 19890004839](https://ntrs.nasa.gov/citations/19890004839).

**Status:** Verified scientific limitation.

**Likely follow-up:** Would you ever make the Day 4 event live?

### 16. What is OSDR and did you use it?

**Short answer:** NASA’s Open Science Data Repository contains space-life-science datasets and metadata, including physiological, plant, environmental, imaging, and other research data. MoonBase does not use OSDR; no OSDR dataset identifier or endpoint is in the running application.

**Technical answer:** OSDR could support a teacher-facing reading activity, but it is not a ready-made source for four-day food yields or ECLSS Power costs. Any use would need a selected study, context, attribution, and no unsupported conversion to game units.

**Evidence:** [NASA OSDR overview](https://science.nasa.gov/biological-physical/data/osdr/); `rg` audit of repository; `app.js:47-75`.

**Status:** Verified.

**Likely follow-up:** Why not use NASA data just to increase credibility?

### 17. What is the difference between a NASA API and a NASA reference?

**Short answer:** An API is a programmatic service the software calls and uses. A reference is a source a person can read to support an explanation. MoonBase has the second, not the first.

**Technical answer:** The six URLs are static `ScienceSource` objects returned in event payloads. They do not drive resource calculation, event selection, or any live state. Calling them an API integration would be inaccurate.

**Evidence:** `MissionRulesService.java:43-61,388-442`; [NASA Open APIs](https://api.nasa.gov/).

**Status:** Verified.

**Likely follow-up:** Is static attribution still valuable?

### 18. Which ten NASA sources are strongest for this project?

**Short answer:** The strongest are NASA ECLSS; the ISS water-recovery milestone; Advanced Plant Habitat; NTRS 20240003496 on lunar dust; TechPort 116295 on dust mitigation; NASA’s lunar radiation article; NASA Radiation Protection; NTRS 19890004839 on regolith shielding analysis; NASA’s Moon light-travel explainer; and NTRS 20250000703 on operational communication delay.

**Technical answer:** Each source has a bounded role. None establishes all game values, and NTRS 19890004839 is background for why dose modeling is complex, not a calibration source for Shelter readiness.

**Evidence:** [`SCIENTIFIC_FOUNDATION.md`](SCIENTIFIC_FOUNDATION.md#strongest-ten-sources-for-a-judge).

**Status:** Verified.

**Likely follow-up:** Which one is actually used at runtime?

## D. Game mathematics and balancing

### 19. Where did the initial resource values come from?

**Short answer:** They were designed by the team for a four-round puzzle. Power 12, Water 12, Food 10, and Shelter readiness 8 are game values, not NASA measurements.

**Technical answer:** The service initializes fixed integers and clamps every resource to 0–12. The README and API documentation explicitly label them simplified values.

**Evidence:** `MissionRulesService.java:15-17,32-41`; `README.md:33-39`; `GAME_RULES.md:11-22`.

**Status:** Verified.

**Likely follow-up:** Why those particular numbers?

### 20. Why are resources limited to 0–12?

**Short answer:** The small range keeps the dashboard readable for children and makes changes easy to see. It is a board-game-style abstraction, not a habitat capacity.

**Technical answer:** `clamp(value)` enforces the range after each daily transition. There is no conversion to liters, kilograms, watts, calories, or sieverts.

**Evidence:** `MissionRulesService.java:16-17,203-210`; `app.js:298-320`.

**Status:** Verified.

**Likely follow-up:** Could a child mistake the scale for a real measurement?

### 21. Why does Power decrease every day?

**Short answer:** The game needs a persistent pressure that makes maintenance choices meaningful. The daily −2 is a fictional upkeep cost representing many habitat activities together, not a measured ECLSS load.

**Technical answer:** Power upkeep is −2 on Days 1–2 and remains −2 on Days 3–4 unless the CO₂-loop maintenance flag changes it to −1. Solar-array cleaning adds a delayed +1; other choices spend or add Power.

**Evidence:** `MissionRulesService.java:138,143,203-217`; `GAME_RULES.md:24-41`.

**Status:** Verified.

**Likely follow-up:** What real systems would be inside that abstraction?

### 22. Why does the CO₂ choice affect Power?

**Short answer:** The game uses maintenance as a teaching trade-off: spend one Power now to avoid one simplified upkeep point on Days 3–4. It does not claim that NASA’s CO₂ hardware saves exactly one unit or that cleaning CO₂ generates oxygen.

**Technical answer:** `inspect_co2_removal_loop` sets `airLoopServiced`; `dailyPower` becomes −1 only when `day >= 3`. It does not alter Water or Food and cannot be selected twice because the history has one Day 2 decision.

**Evidence:** `MissionRulesService.java:138,173-176`; backend test `MissionTrainerBackendApplicationTests.java:139-152`.

**Status:** Verified.

**Likely follow-up:** Why not model oxygen directly?

### 23. Why does the grow tray have a delayed effect?

**Short answer:** It teaches that production needs inputs before it pays back. The child must decide whether to spend Power and Water now for a later Food benefit rather than always choosing an immediate meal.

**Technical answer:** Day 3 costs Power 2 and Water 1. On Day 4, the backend applies daily Water upkeep and scheduled recycler recovery first, then schedules Food +2 when the resulting Water is 5 or lower, otherwise +4. NASA APH supports the controlled-environment concept, not these timing or game-unit amounts.

**Evidence:** `MissionRulesService.java:145,177-181`; [NASA APH](https://science.nasa.gov/mission/advanced-plant-habitat/).

**Status:** Verified.

**Likely follow-up:** Are +2 or +4 real crop yields?

### 24. What do the 36 paths represent?

**Short answer:** They are the complete combinations of 3 Day 1 choices, 3 Day 2 choices, 2 Day 3 choices, and 2 Day 4 choices: `3 × 3 × 2 × 2 = 36`. They are exhaustive test paths, not probabilities of real missions.

**Technical answer:** Independent simulation and backend tests find 13 successes, 0 Day 3 Power failures, 11 Day 4 Power failures, and 12 unprepared-passive primary failures. Some failure conditions overlap, so those categories are defined by primary-reason priority.

**Evidence:** `MissionTrainerBackendApplicationTests.java:61-94`; [`SCIENTIFIC_ASSUMPTIONS_AND_EQUATIONS.md`](SCIENTIFIC_ASSUMPTIONS_AND_EQUATIONS.md#independently-checked-36-path-distribution).

**Status:** Verified.

**Likely follow-up:** Are the 13 winning paths scientific statistics?

### 25. How did you test whether the mission is winnable?

**Short answer:** The test suite enumerates every valid path and compares the service to an independent transition model. It checks exact resource values, status, terminal day, and failure reason, rather than only counting wins.

**Technical answer:** The independent model is implemented in the test class, not by calling the service’s private calculation method. It also checks early terminal histories and the supplied scenario assertions.

**Evidence:** `MissionTrainerBackendApplicationTests.java:61-94,97-114`.

**Status:** Verified.

**Likely follow-up:** How do you know the independent model did not repeat the same bug?

### 26. What is the main balance weakness?

**Short answer:** The current model is intentionally small, but some choices are more useful than others in the four-day horizon. The complete path audit shows that no Water or Food failure is primary, while Power is the limiting resource in 13 paths and unprepared passive protection is the primary reason in 11.

**Technical answer:** The path distribution is a balance result from this ruleset, not a scientific result. A future balance review should ask whether Water/food choices visibly matter without adding complexity or presenting the distribution as engineering evidence.

**Evidence:** [`SCIENTIFIC_ASSUMPTIONS_AND_EQUATIONS.md`](SCIENTIFIC_ASSUMPTIONS_AND_EQUATIONS.md#independently-checked-36-path-distribution); `MissionRulesService.java:232-264`.

**Status:** Verified; whether to rebalance requires team decision.

**Likely follow-up:** Which choice is dominant?

## E. Radiation and shelter

### 27. Why is Shelter readiness not a radiation meter?

**Short answer:** Real radiation dose depends on particle energy, exposure, material, geometry, time, and biological context. The game has none of those physical inputs, so it uses a qualitative readiness meter and says clearly that it is not dose or a shielding percentage.

**Technical answer:** NASA-TP-2869 calculates dose predictions for specific event and habitat/shield configurations. MoonBase only tracks a bounded integer and booleans for preparation and activation.

**Evidence:** `MissionRulesService.java:39-40,267-270`; [NTRS 19890004839](https://ntrs.nasa.gov/citations/19890004839).

**Status:** Verified.

**Likely follow-up:** What would be required to calculate dose?

### 28. What is the difference between preparation and activation?

**Short answer:** Preparation is an earlier planning step that sets up protection and prevents later readiness wear. Activation is a Day 4 decision that puts the shelter into FULL or PASSIVE mode. Preparing alone never completes the mission.

**Technical answer:** `shieldingPrepared` is set on Day 1; `shelterActivated` and `shelterMode` are set only by a Day 4 shelter choice. `protectionReady` requires activation plus either preparation or emergency activation.

**Evidence:** `MissionRulesService.java:159-163,186-199,267-270`; backend test `MissionTrainerBackendApplicationTests.java:155-180`.

**Status:** Verified.

**Likely follow-up:** Why does emergency FULL work without preparation?

### 29. Why can an emergency shelter action work without earlier preparation?

**Short answer:** It is a simplified narrative choice inspired by NASA discussions of arranging available stowage or supplies into a denser temporary shelter during a solar-particle event. The extra Power cost represents emergency work in the game. It is not a validated lunar-base procedure.

**Technical answer:** Unprepared FULL costs Power 2 rather than Power 1 and sets `emergencyProtectionActivated`. The rule lets the child compare advance planning with a more expensive emergency response.

**Evidence:** `MissionRulesService.java:186-193`; [NASA lunar radiation article](https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/).

**Status:** Game behavior and source concept verified; operational equivalence not claimed.

**Likely follow-up:** What materials would a real shelter use?

### 30. Does the game calculate shielding percentage or radiation dose?

**Short answer:** No. It calculates only a qualitative Shelter readiness value and a logical protection-ready state. The backend and frontend explicitly state that these are not radiation dose or shielding percentage.

**Technical answer:** There are no numeric dose fields, shielding-coverage fields, material thicknesses, particle spectra, or transport equations in the DTOs or service.

**Evidence:** `MissionDtos.java:93-101`; `MissionRulesService.java:39-40,275-277`; `app.js:462-463`.

**Status:** Verified.

**Likely follow-up:** Does the game teach anything real about radiation?

### 31. What NASA source supports sheltering during a solar-particle event?

**Short answer:** NASA’s lunar radiation article describes using onboard stowage bags to create a denser shelter during an SEP event, and NASA’s radiation-protection page describes shielding, monitoring, and protection technologies. Those sources support the importance of preparation, not the game’s numerical threshold.

**Technical answer:** NTRS 19890004839 is the stronger technical example for lunar regolith shielding analysis; it predicts dose for specified events and habitat configurations. MoonBase does not import those calculations.

**Evidence:** [NASA lunar radiation article](https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/); [NASA Radiation Protection](https://www.nasa.gov/radiation-protection/); [NTRS 19890004839](https://ntrs.nasa.gov/citations/19890004839).

**Status:** Verified.

**Likely follow-up:** Why not show regolith thickness?

### 32. Is the Day 4 solar-particle event a real NASA event?

**Short answer:** No. It is a fictional narrative event chosen to create a final shelter decision. Its topic is scientifically plausible, but the game does not retrieve a forecast or historical DONKI record.

**Technical answer:** The backend event is hard-coded as “A fictional solar-particle alert” and applies Shelter readiness −2 as a game parameter. No event ID, timestamp, or data source is stored.

**Evidence:** `MissionRulesService.java:431-432,146`; [`NASA_TOOLS_AND_DATA.md`](NASA_TOOLS_AND_DATA.md).

**Status:** Verified.

**Likely follow-up:** Would a live alert make the game more realistic?

## F. Communication

### 33. Why is Earth–Moon communication not instantaneous?

**Short answer:** Information carried by light or radio signals cannot arrive faster than the signal’s propagation time. NASA explains that light from the Moon takes about 1.3 seconds to reach Earth.

**Technical answer:** The exact path and geometry vary, but the educational approximation is about 1.3 seconds one way. This is propagation only, not the time for a complete operational response.

**Evidence:** [NASA Webb light-travel explainer](https://science.nasa.gov/mission/webb/science-overview/science-explainers/how-does-webb-see-back-in-time/).

**Status:** Verified.

**Likely follow-up:** How did you get 2.6 seconds?

### 34. How did you calculate 2.6 seconds?

**Short answer:** A light-only round trip has an outbound and return leg, so it is approximately `1.3 + 1.3 = 2.6 seconds`. That is a minimum propagation calculation, not a promise that a crew receives a response in 2.6 seconds.

**Technical answer:** Processing, routing, scheduling, link availability, and human decision-making add operational latency. NASA’s communication-delay research discusses lunar one-way operational latencies of 3–14 seconds in its mission-operations context.

**Evidence:** [NASA Webb explainer](https://science.nasa.gov/mission/webb/science-overview/science-explainers/how-does-webb-see-back-in-time/); [NTRS 20250000703](https://ntrs.nasa.gov/citations/20250000703).

**Status:** Verified.

**Likely follow-up:** Why does the UI say “operational communication can take longer”?

### 35. Does MoonBase model actual operational communication latency?

**Short answer:** No. It explains the distinction but does not turn communication into a gameplay timer or delay the next day. The optional demo is UI-only so it cannot corrupt replay or make a child wait for an artificial delay.

**Technical answer:** `communicationOpen` exists only in frontend UI state; it is not in the request body or backend DTO. The frontend test verifies that opening the demo leaves the decision history and resource state unchanged.

**Evidence:** `app.js:8-15,270-294`; `app.test.cjs:344-361`.

**Status:** Verified.

**Likely follow-up:** Does that mean the communication objective is fully simulated?

### 36. Why not use a next-day response or a Mars-style delay?

**Short answer:** That would be scientifically wrong for the lunar setting if it were attributed to the 2.6-second light round trip. The project keeps the Moon setting, teaches the propagation-versus-operations distinction, and avoids inventing a long delay that the evidence does not support.

**Technical answer:** A future autonomy mechanic would need a separate operational scenario and a defensible timing model. It should not call a 2.6-second signal round trip “next day.”

**Evidence:** [NASA Webb explainer](https://science.nasa.gov/mission/webb/science-overview/science-explainers/how-does-webb-see-back-in-time/); [NTRS 20250000703](https://ntrs.nasa.gov/citations/20250000703).

**Status:** Design/scientific boundary verified.

**Likely follow-up:** What operational action could be added later?

## G. Software engineering and architecture

### 37. Why did you choose Java and Spring Boot?

**Short answer:** Spring Boot provides a small, testable HTTP boundary while Java makes the state transitions explicit and strongly typed. The project does not need a database or a large framework because the mission is a short deterministic replay.

**Technical answer:** `MissionController` delegates to `MissionRulesService`; DTO records define the contract; `ApiExceptionHandler` returns safe error responses. The service is stateless and reconstructs state from the ordered history.

**Evidence:** `MissionController.java`; `MissionDtos.java`; `MissionRulesService.java`; `ApiExceptionHandler.java`.

**Status:** Verified.

**Likely follow-up:** Why not let JavaScript calculate the game?

### 38. Why is the backend authoritative?

**Short answer:** A child’s browser can be changed, so the browser must not be trusted for resource totals or outcomes. The browser sends only the ordered choices; the backend recomputes the state and returns the breakdown.

**Technical answer:** The request DTO contains decisions, not resource totals. `replay()` starts from canonical initial values, validates each day/choice, applies transitions, and returns the authoritative response.

**Evidence:** `MissionDtos.java:13-17`; `MissionRulesService.java:68-123`; `API_AND_ARCHITECTURE.md:5-9`.

**Status:** Verified.

**Likely follow-up:** Is this an anti-cheat system?

### 39. How does deterministic replay work?

**Short answer:** Every decision request includes the complete ordered history. The server starts at the same initial state and applies the same rules in the same order, so the same history returns the same result.

**Technical answer:** There is no random event or server-side mission object. Validation requires one sequential day beginning at Day 1, and the service rejects terminal continuation.

**Evidence:** `MissionRulesService.java:68-123`; `MissionTrainerBackendApplicationTests.java:194-200`; `app.js:135-155`.

**Status:** Verified.

**Likely follow-up:** Why send the full history instead of a mission ID?

### 40. Why is there no database or saved progress?

**Short answer:** The prototype is intentionally stateless. A fresh page refresh starts a fresh mission, which keeps the demo simple and avoids collecting accounts or player data.

**Technical answer:** There is no persistence layer, authentication, cookie, session, localStorage, sessionStorage, IndexedDB, or gameplay token. This also means a player cannot resume after refresh.

**Evidence:** `README.md:33-39`; `API_AND_ARCHITECTURE.md:5-9`; `app.js:8-15,105-127`.

**Status:** Verified.

**Likely follow-up:** Is that acceptable for a classroom deployment?

### 41. How do you validate a decision?

**Short answer:** The backend checks that the history is non-empty, no longer than four decisions, sequential from Day 1, and that the choice ID belongs to the event for that day. It rejects malformed, duplicate, out-of-order, wrong-day, unknown, and post-terminal histories.

**Technical answer:** `validateDecision()` checks the day and nonblank choice ID; `findChoice()` checks the day’s event; `failureFor()` controls terminal state; additional decisions after terminal state produce `POST_TERMINAL_DECISION`.

**Evidence:** `MissionRulesService.java:68-123,126-132`; `MissionTrainerBackendApplicationTests.java:202-213,225-230`.

**Status:** Verified.

**Likely follow-up:** What happens if two clicks arrive quickly?

### 42. How does the frontend handle failed requests and duplicate clicks?

**Short answer:** The frontend disables the decision flow while a request is pending, keeps the selected option if the request fails, displays an error, and allows retry. It advances the mission only after validating the backend response.

**Technical answer:** `ui.loading` prevents a second submission, `request()` throws on network/HTTP errors, and `submitChoice()` updates history and screen only after `validateMission()` and history comparison succeed.

**Evidence:** `app.js:47-75,131-167`; `app.test.cjs:291-342`.

**Status:** Verified.

**Likely follow-up:** What security does the stateless design not provide?

## H. Testing and reliability

### 43. How did you test the 36 paths?

**Short answer:** The backend test enumerates 3 × 3 × 2 × 2 combinations and checks each path day by day against an independent transition model. It asserts exact resources, status, terminal day, and primary reason.

**Technical answer:** The test also checks that a complete history submitted after an early terminal condition is rejected. The independent model is distinct from the production service method.

**Evidence:** `MissionTrainerBackendApplicationTests.java:61-94`.

**Status:** Verified.

**Likely follow-up:** How are overlapping reasons represented?

### 44. What is the independent expected-state model?

**Short answer:** It is a separate calculation in the test class that applies the documented daily, delayed, event, choice, clamp, and failure rules. The expected state is not obtained by calling the production service and comparing it with itself.

**Technical answer:** `ExpectedState.apply()` and the assertion helper calculate expected transition data independently, then compare it with each replay response.

**Evidence:** `MissionTrainerBackendApplicationTests.java:61-94` and the `ExpectedState` helper later in the same file.

**Status:** Verified.

**Likely follow-up:** What independent review remains?

### 45. What happens if Power reaches zero?

**Short answer:** The backend clamps it to zero, checks resource failures after all effects for that day, and returns a failed terminal response with `POWER_REACHED_ZERO`. No later scheduled effect or day is processed.

**Technical answer:** Power is checked first in `failureFor()`, so if another condition is also true, Power is the primary reason. The test suite covers Day 3 and Day 4 Power failures.

**Evidence:** `MissionRulesService.java:203-210,232-246`; backend tests lines 102–113 and 183–191.

**Status:** Verified.

**Likely follow-up:** What happens if Food would reach zero before the Day 4 harvest?

### 46. How do you test delayed effects?

**Short answer:** Tests inspect the returned resource breakdown, not only the final total. They verify the recycler’s delayed Water term appears once, the grow harvest appears on Day 4, and the harvest is applied before terminal checks.

**Technical answer:** The test asserts Day 3 Water `daily=-2`, `delayed=1`, `choice=-1`, and Day 4 Food `daily=-2`, `delayed=4`, `after=6` for the canonical grow path. It also verifies a low-Water path reports `delayed=2` and the child-facing reduced-harvest explanation.

**Evidence:** `MissionTrainerBackendApplicationTests.java:116-136`.

**Status:** Verified.

**Likely follow-up:** How do you test no double-counting?

### 47. How do you test shelter activation and protection?

**Short answer:** The tests distinguish preparation from activation, verify passive shelter succeeds only after preparation, and verify unprepared FULL sets emergency protection. They also check that unprepared passive shelter is not protection-ready.

**Technical answer:** The test checks the `SystemState` booleans and mode values, not just the final result string.

**Evidence:** `MissionTrainerBackendApplicationTests.java:154-180`; `MissionDtos.java:93-101`.

**Status:** Verified.

**Likely follow-up:** Does the test prove radiation safety?

### 48. What manual browser testing remains?

**Short answer:** Automated frontend and backend tests cover the contract and state transitions, but no child user study, screen-reader run, production deployment, or NASA validation has been performed. Native browser network inspection was also not fully captured in the repository’s verification notes.

**Technical answer:** The existing judge briefing records local responsive and keyboard checks, five frontend tests, and ten backend tests, while explicitly listing user study, public deployment, performance measurement, and real screen-reader verification as pending.

**Evidence:** `docs/JUDGES_BRIEFING.md:95-159`.

**Status:** Verified limitation.

**Likely follow-up:** What is the next highest-value validation?

## I. Education and user experience

### 49. Why is the game designed for children?

**Short answer:** The game uses a small number of visible resources, one choice per round, immediate feedback, and concrete language such as “helps now” and “helps later.” It gives a child a manageable systems problem instead of requiring a full engineering model.

**Technical answer:** Resource cards show a value and maximum; decision feedback lists daily, delayed, event, and choice terms; focus and live announcements support keyboard use. Suitability for the official age range still needs user-study confirmation.

**Evidence:** `app.js:298-320,492-507`; `style.css:463-464`; `README.md:13`.

**Status:** UX implementation verified; age-range confirmation required.

**Likely follow-up:** Did children test it?

### 50. How did you simplify science without teaching incorrect science?

**Short answer:** We simplified quantities, not the key relationships. We explicitly say CO₂ removal is not oxygen generation, Water units are not percentages, Shelter readiness is not dose, and the grow harvest compresses time.

**Technical answer:** The source notes and result takeaways label game values and qualitative states. Where the game uses a narrative shortcut—such as the Day 4 alert or array cleaning—it is described as fictional or simplified.

**Evidence:** `MissionRulesService.java:228,275-277,365-366,431-432`; `app.js:453-463`.

**Status:** Verified.

**Likely follow-up:** Which simplification is most scientifically important to disclose?

### 51. How do children understand failure?

**Short answer:** The result reports the day, the limiting resource or protection issue, the primary failure reason, and takeaways about comparing immediate and delayed choices. The feedback includes the actual resource breakdown before the terminal result.

**Technical answer:** `MissionResult` carries primary and secondary failure reasons; the frontend renders the terminal result and keeps the authoritative last breakdown. A future classroom version could add teacher prompts, but that is not currently implemented.

**Evidence:** `MissionDtos.java:66-76`; `MissionRulesService.java:280-300`; `app.js:510-558`.

**Status:** Verified.

**Likely follow-up:** Is there a separate quiz?

### 52. Is a separate quiz necessary?

**Short answer:** Not for the current prototype. The game’s explanation is embedded in the decision loop, which is more directly connected to the child’s action. A separate quiz could be useful for a classroom lesson, but it should test understanding rather than add complexity for its own sake.

**Technical answer:** There is no quiz route, DTO, screen, or assessment score in the repository. The current feedback and takeaways are the implemented educational assessment mechanism.

**Evidence:** `app.js:175-185,476-558`; `MissionDtos.java:66-76`.

**Status:** Verified.

**Likely follow-up:** How would you measure learning?

### 53. How does the interface explain delayed consequences?

**Short answer:** Each choice includes a trade-off and future-effect sentence. After submission, the server returns a breakdown with daily, delayed, event, and choice terms, and the frontend shows the next scheduled effect.

**Technical answer:** This is driven by `futureEffectForChoice()` and `ResourceBreakdown`, so the text and values remain consistent with backend rules.

**Evidence:** `MissionRulesService.java:215-229,376-382`; `app.js:492-507`.

**Status:** Verified.

**Likely follow-up:** Is the terminology too advanced for age seven?

### 54. How do you support accessibility and reduced motion?

**Short answer:** Buttons are real keyboard-focusable controls, the app moves focus to the main region, status text is announced, resource meters have labels, and CSS has a reduced-motion media query. A real screen-reader user test has not been completed.

**Technical answer:** `style.css:463-464` reduces animations/transitions. `app.js` uses `aria-label`, `aria-live`, `role=meter`, and focus management; the existing notes record keyboard and responsive checks.

**Evidence:** `app.js:170-173,298-320`; `style.css:463-464`; `docs/JUDGES_BRIEFING.md:138-144`.

**Status:** Implementation verified; assistive-technology behavior partly unverified.

**Likely follow-up:** Does the optional communication animation respect reduced motion?

## J. Limitations and future work

### 55. What are the biggest scientific simplifications?

**Short answer:** The resources are dimensionless, the four days are compressed planning rounds, crops harvest in one turn, radiation is qualitative, and ECLSS is represented by one maintenance choice. There is no physical dose, pressure, temperature, mass, or power-unit model.

**Technical answer:** The full limitation list is in `SCIENTIFIC_FOUNDATION.md` and `SCIENTIFIC_ASSUMPTIONS_AND_EQUATIONS.md`. The correct improvement path is better attribution and measured educational validation before adding more meters.

**Status:** Verified.

**Likely follow-up:** Which simplification would you remove first?

### 56. Why is this not a real engineering simulator?

**Short answer:** A real simulator would need validated physical models, units, environmental conditions, crew and hardware parameters, uncertainty, and verification against mission data. MoonBase intentionally uses a small game model so a child can see cause and effect in minutes.

**Technical answer:** The project has fixed integer transitions and no dimensional analysis or validated model. Calling it a simulator would overstate what the code does.

**Evidence:** `README.md:33-39`; `MissionRulesService.java:134-229`; frontend disclaimer `app.js:263-265`.

**Status:** Verified.

**Likely follow-up:** What would validation require?

### 57. How could real NASA data be integrated responsibly?

**Short answer:** A fixed, attributed historical space-weather card or teacher-facing OSDR reading could add context without driving fictional resource values. Any live feature would need source timestamps, fallbacks, fixtures, and a clear label for what the data does not measure.

**Technical answer:** DONKI could support an event-exploration activity, but not direct dose. OSDR could support plant or human-spaceflight reading, but not direct four-day food-yield calibration.

**Evidence:** [DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/); [OSDR](https://science.nasa.gov/biological-physical/data/osdr/); `NASA_TOOLS_AND_DATA.md`.

**Status:** Future-design recommendation; not implemented.

**Likely follow-up:** Why not just make DONKI change the Day 4 event?

### 58. How would you add oxygen, radiation, and temperature without overwhelming children?

**Short answer:** Add only one new concept at a time and connect it to a decision the child can understand. For example, use a small air-safety state with an explicit “air cleaning is not oxygen making” lesson, while keeping radiation as a preparedness concept until a validated model exists.

**Technical answer:** The current ECLSS source supports separate subsystems, but adding an Oxygen meter would require a defined model for generation, consumption, and Power. Adding dose would require a real radiation transport model; otherwise it should remain qualitative.

**Status:** Future-design recommendation; not implemented.

**Likely follow-up:** What would you not add?

### 59. What would you improve with more time?

**Short answer:** The official 7–12 age label is now consistent. Remaining high-value improvements are child/teacher usability testing, stronger source attribution, and possibly a small, clearly separated historical NASA data activity rather than making the core game falsely data-driven.

**Technical answer:** I would preserve the deterministic rules and backend authority, add fixed fixtures if any external data is introduced, and test the accessibility claims with actual assistive technology. I would not add a database or live API without a clear learning benefit.

**Status:** Team prioritization required.

**Likely follow-up:** What is the biggest risk before submission?

### 60. What is the honest one-sentence assessment?

**Short answer:** MoonBase is a credible small educational prototype with careful NASA attribution and strong deterministic engineering logic, but it is not a NASA-data integration, real habitat simulator, or scientifically validated mission model.

**Technical answer:** Its strongest evidence is the backend-authoritative replay, exact 36-path testing, and source-bounded wording. Its key open items are target-age consistency, user-study evidence, accessibility verification with real assistive technology, and keeping presentation claims synchronized with the canonical code.

**Evidence:** `MissionTrainerBackendApplicationTests.java`; `MissionRulesService.java`; `docs/SCIENCE_REFERENCES.md`; `PRESENTATION_REVIEW.md`.

**Status:** Repository-based assessment verified; final competitive positioning requires team confirmation.

**Likely follow-up:** What should the team show on screen?

## Questions we must never answer incorrectly

- We must not claim a live NASA API or DONKI integration.
- We must not claim that game resource values came from NASA measurements.
- We must not claim CO₂ removal generates oxygen.
- We must not claim `Shelter readiness` is dose, shielding percentage, regolith thickness, or medical protection.
- We must not claim DONKI measures dose inside the habitat.
- We must not claim the `+1 Power`, `+1 Water`, `+2/+4 Food`, −2 alert, or threshold 6 are NASA values.
- We must not claim the array-brushing action is NASA-recommended.
- We must not claim the four-day crop harvest is realistic growth timing.
- We must not claim MoonBase is a validated lunar-habitat simulator.
- We must not claim child suitability has been proven without a user study.

