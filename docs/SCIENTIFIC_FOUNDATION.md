# MoonBase Scientific Foundation

> Historical prototype notice (November 11, 2026): some entries below refer
> to a superseded numeric model and older Day 4 assumptions. They are retained
> for audit history only. The active implementation uses qualitative states,
> avoids radiation calculations, and is defined by `SCIENCE_REFERENCES.md`.

## Audit purpose and scope

This document is the scientific evidence record for **MoonBase: 4 Days to Survive**. It was prepared from the implementation, the repository documentation and presentation notes, and primary NASA sources checked on 31 October 2026.

This is an audit and judging aid, not a claim that MoonBase is a validated lunar-habitat simulator. The project is an independent educational game. NASA has not endorsed, validated, calibrated, or supplied the gameplay model.

The official challenge page supplied by the team was not retrievable from the research environment at audit time. Challenge-specific statements in this document therefore distinguish the team-supplied brief from claims verified directly in the repository or NASA sources. Confirm the final challenge wording and participant requirements on the event site before submission.

## Executive scientific conclusion

MoonBase uses NASA research as qualitative inspiration and as linked reading material. The running application does **not** retrieve NASA data, call a NASA API, calculate lunar radiation dose, model a real ECLSS, or use NASA measurements to set its resource values. The backend returns six static NASA source links with the relevant event; the browser fetches only the local MoonBase API.

The strongest scientific foundation is:

- NASA ECLSS documentation for the distinction between water recovery, air revitalization, and oxygen generation.
- NASA’s ISS water-recovery reporting for the idea that closed-loop life support can reclaim water. The reported 90% and 98% figures are ISS context, not MoonBase or lunar-habitat performance.
- NASA’s Advanced Plant Habitat page for controlled light, water, nutrients, and space-plant research. The game’s one-turn harvest is compressed game time.
- NASA’s lunar-dust technical memorandum for dust risks to exposed surfaces and solar-array efficiency. The game’s “Brush the solar array” choice is fictional; it must not be presented as NASA’s recommended cleaning method.
- NASA radiation-protection material for the concept of preparing a denser shelter for solar-particle events. `Shelter readiness` is a qualitative game state, not dose, shielding percentage, thickness, or medical risk.
- NASA’s Moon communication explainer for approximately 1.3 seconds of one-way light travel. The 2.6-second round trip is an arithmetic derivation. NASA’s communication-delay research separately discusses longer operational latency in lunar mission operations.

## What the running application actually shows

The authoritative user-facing claims come from the backend event and feedback text in [`MissionRulesService.java`](../mission-trainer-backend/src/main/java/org/juniorastronaut/missiontrainer/game/MissionRulesService.java), especially lines 32–61, 267–299, 316–380, and 388–442. The frontend renders the server’s science notes and source links in [`app.js`](../mission-trainer-frontend/js/app.js), including the optional communication explainer at lines 270–294 and system-status wording at lines 444–464.

The frontend explicitly describes the product as an educational game, not a real engineering simulator or official NASA product at [`app.js`](../mission-trainer-frontend/js/app.js#L263-L265). Resource cards label their quantities “Game value” at lines 298–320. The backend describes shelter readiness as an abstract value, not radiation dose or shielding percentage at [`MissionRulesService.java`](../mission-trainer-backend/src/main/java/org/juniorastronaut/missiontrainer/game/MissionRulesService.java#L32-L41).

## Scientific claim audit

The table uses these evidence labels:

- **Supported:** the cited source establishes the qualitative claim as written.
- **Partially supported:** the source supports the theme or a related system, but not the exact MoonBase mechanic or context.
- **Unsupported as written:** the repository wording would overclaim the source or the implementation. No unsupported wording should remain in a judge presentation.
- **Game assumption:** an intentional design value or rule, not a scientific measurement.

| Claim shown or implied | Location | Current source | Source type | What the source establishes | Accuracy | Recommended wording for children | Judge risk |
|---|---|---|---|---|---|---|---|
| Lunar dust can affect exposed equipment and solar-array efficiency. | Day 1 event and science note; `MissionRulesService.java:388-403`; `docs/SCIENCE_REFERENCES.md:9-10`. | [NASA/TM-20240003496](https://ntrs.nasa.gov/citations/20240003496); [TechPort DMFlex-ACO](https://techport.nasa.gov/projects/116295). | NASA technical report and NASA TechPort reference. | Lunar dust’s jagged surfaces, electrostatic charge, chemical reactivity, and motion can harm exposed surfaces and create solar-array efficiency challenges. | Supported for the qualitative theme. | “Lunar dust can make equipment harder to operate. This game turns that idea into a planning choice.” | “Does NASA recommend brushing arrays?” The NTRS PDF cautions against manually brushing dust from arrays; the game choice is fictional. |
| Brushing the solar array produces `+1 Power` on Days 2–4. | Day 1 choice and future effect; `MissionRulesService.java:396-400,376`. | No NASA source gives this value or validates this action. | Simplified game parameter. | The sources support a dust/power problem, not a particular rover action, output gain, or duration. | Supported only as an explicitly labeled game rule. | “In this game, the crew spends one Power unit on a fictional array-maintenance plan that may help later.” | Do not call `+1` a measured array recovery or claim that manual brushing is operationally safe. |
| ECLSS includes water recovery, air revitalization, and oxygen generation. | Day 2 science note and CO₂ explanation; `MissionRulesService.java:404-418,349,365`. | [NASA Environmental Control and Life Support Systems](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/). | NASA engineering reference. | NASA describes those as separate ECLSS components. Air revitalization removes contaminants and exhaled CO₂; oxygen generation electrolyzes water and can use a CO₂-reduction assembly. | Supported. | “Space life support has different jobs: clean the air, recover water, and make oxygen.” | A judge may ask why the game has no oxygen meter. Answer honestly: the current game models only a simplified maintenance decision, not oxygen production. |
| Servicing the CO₂ loop does not generate oxygen or recover water. | Choice explanation and system status; `MissionRulesService.java:365`, `app.js:453-455`. | NASA ECLSS reference. | NASA fact plus deliberate simplification. | CO₂ capture is described as part of air revitalization; oxygen generation is a separate water-electrolysis subsystem. | Supported and carefully bounded. | “Cleaning CO₂ from the air is not the same job as making oxygen.” | Do not imply the game’s `−1 Power` saving is a NASA energy measurement. It is a simplified game rule. |
| Water recovery can reclaim and recycle water. | Day 2 event and choice; `MissionRulesService.java:404-416`. | [NASA ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/) and [NASA ISS water milestone](https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/). | NASA engineering reference and NASA ISS report. | NASA describes treatment of wastewater, humidity condensate, and urine-derived water. The ECLSS page reports about 90% water recovery on station; the 2023 article reports a 98% total-recovery goal demonstrated on the U.S. ISS segment with the Brine Processor Assembly. | Supported for the concept; not a lunar-performance claim. | “A recycler can help stretch a water supply. Real systems clean and test recovered water before reuse.” | Never say MoonBase recovers 90% or 98% of lunar-habitat water. The game’s `+1` values are not percentages. |
| `+1 Water` on Days 3–4 is water recovery. | Active effects and breakdown; `MissionRulesService.java:143-145,164-168,322`. | No NASA measurement is mapped to one game unit. | Simplified game parameter. | The source supports delayed recovery as a teaching idea, not the timing or amount. | Supported only if called a game effect. | “This game schedules one small recovery bonus for later turns.” | A judge may ask for the recovery fraction or hardware model. There is none in the current implementation. |
| The grow tray uses light, water, and nutrients and produces food later. | Day 3 event; `MissionRulesService.java:420-430`. | [NASA Advanced Plant Habitat](https://science.nasa.gov/mission/advanced-plant-habitat/). | NASA ISS experiment reference. | NASA describes an enclosed plant-research facility using LED lights and controlled delivery of water, nutrients, and oxygen to roots, with experiments lasting much longer than one game turn. | Partially supported. | “Plants in space need controlled light, water, and nutrients. This game compresses growing time into one mission round.” | Do not present the `+2/+4 Food` Day 4 game values as a real crop yield or growth rate. |
| A grow tray can produce `+2` or `+4 Food` on Day 4 depending on the Water reserve. | Day 4 delayed effect; `MissionRulesService.java:145,177-181`. | None. | Simplified game parameter and time compression. | No cited source establishes these quantities, threshold, or one-turn harvest. | Game assumption. | “Low Water can reduce the tray’s game harvest, showing that food production depends on supporting resources.” | “How long would a real crop take?” The answer depends on crop, hardware, conditions, and experiment; the game does not model it. |
| Solar-particle events are a reason to prepare shelter. | Day 1 and Day 4 story; `MissionRulesService.java:390,431-432`. | [NASA radiation article](https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/); [NASA Radiation Protection](https://www.nasa.gov/radiation-protection/). | NASA science and technology references. | NASA discusses solar energetic particle events and shelter concepts, including using onboard stowage bags to make a denser Orion shelter. | Supported for the planning theme. | “A burst of energetic particles from the Sun can make shelter planning important.” | The Day 4 event is fictional. It is not a forecast or a real NASA event record. |
| `Shelter readiness` measures protection. | Resource card and result wording; `MissionRulesService.java:39-40,275-277`; `app.js:462-463`. | No source maps this meter to a physical quantity. | Simplified game state. | NASA sources discuss shielding, shelter, monitoring, and dosimetry, but do not define the MoonBase 0–12 meter. | Supported only with the explicit disclaimer. | “Shelter readiness is a game score for whether the crew prepared the shelter.” | Never call it dose, dose rate, shielding percentage, regolith thickness, or crew medical safety. |
| Preparing shielding prevents later shelter wear. | Day 1 choice/future effect; `MissionRulesService.java:159-163,141,362,376`. | No source establishes this exact relationship. | Simplified game rule inspired by advance preparation. | NASA supports the general importance of shielding and timely shelter preparation, not this readiness arithmetic. | Game assumption. | “Preparing early helps in this game because the plan is ready before the alert.” | A judge may ask what material or coverage is modeled. None is modeled numerically. |
| Full shelter activation can work with an emergency setup. | Day 4 choice; `MissionRulesService.java:186-193,368`. | NASA article describes temporary sheltering with stowed supplies; no source validates this exact game action. | Simplified game rule inspired by NASA concept. | NASA’s Orion example supports arranging available mass as shelter during an SEP event. | Partially supported. | “The game lets the crew assemble an emergency protection setup when they skipped earlier preparation.” | Do not claim this is a validated lunar-base emergency procedure. |
| The Moon has a meaningful communication delay. | Optional demo; `app.js:281,289-292`. | [NASA Webb explainer](https://science.nasa.gov/mission/webb/science-overview/science-explainers/how-does-webb-see-back-in-time/); [NTRS 20250000703](https://ntrs.nasa.gov/citations/20250000703). | NASA science page and NASA technical presentation record. | NASA states Moon light is about 1.3 seconds old when received. The NTRS communication-delay review discusses lunar mission one-way operational latencies of 3–14 seconds and the effects of delayed operations. | Supported if propagation and operational latency are kept distinct. | “Light takes about 1.3 seconds to travel one way. Real teams may take longer because messages also need computers, schedules, and people.” | Do not say a lunar reply takes a whole day or that 2.6 seconds includes all operational delay. |
| The optional communication animation is a mission mechanic. | UI behavior; `app.js:270-294`; frontend tests. | No NASA source; implementation contract says it is UI-only. | Product behavior. | The demo changes no history, resources, status, or result. | Accurate as a demo, not as gameplay. | “This optional animation explains the idea but does not spend a turn.” | A judge could reasonably say it does not test autonomy or delayed commanding because it is not connected to play. |
| Four mission days represent a lunar mission. | README, game rules, backend constant `DAYS=4`. | No NASA source. | Game structure. | Four planning rounds make a small puzzle; they are explicitly not Earth days or lunar days. | Accurate when called compressed game time. | “Each day is a short planning round, not a real lunar day.” | Do not infer real lunar daylight, crew metabolic rates, or mission duration from the four turns. |
| Power, Water, Food, and Shelter readiness are engineering units. | Resource cards and API definitions. | No NASA source. | Arbitrary abstraction. | The UI labels them “game value” and the README says values are simplified. | Accurate only with current labels. | “These are simple game meters that help us compare choices.” | Do not attach kilograms, kilowatt-hours, liters, calories, sieverts, meters, or percentages to them. |

## Scientific concepts represented correctly at a high level

### Lunar environment and dust

The Moon has an extremely thin exosphere rather than an Earth-like atmosphere. NASA’s [Weather on the Moon](https://science.nasa.gov/moon/weather-on-the-moon/) page describes lunar “weather” as coming from space and discusses solar wind, galactic cosmic rays, coronal mass ejections, and micrometeoroids. The current game does not link this page from the backend and does not model atmospheric weather. Its Day 1 event is a dust-on-equipment story; its Day 4 event is a fictional solar-particle alert.

The strongest implementation-supported dust source is NASA/TM-20240003496. The report is by Christopher J. Wohl, James K. Burgess, Scott P. Belbin, Richard S. Pappa, Chuck B. Taylor, Meghan E. Bush, Phillip B. Abel, Christopher J. Wright, Thomas W. Kerslake, and Joseph R. Blandino; publication date 1 October 2024; report number NASA/TM-20240003496; NTRS document ID 20240003496. Its abstract establishes that dust can adversely affect exposed surfaces and create solar-array efficiency challenges. The PDF also warns against manually brushing dust from arrays because of potential damage. Therefore, “Brush the solar array” is a deliberately fictional decision used to teach delayed maintenance trade-offs, not an operational recommendation.

### Life support and ECLSS

NASA’s [ECLSS reference](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/) says ECLSS controls atmospheric pressure, fire detection and suppression, oxygen levels, ventilation, waste management, and water supply. It identifies three key components:

1. **Water Recovery System:** reclaims wastewater, humidity condensate, and suit hydration water; filters and treats it; checks purity; and stores acceptable water.
2. **Air Revitalization System:** cleans cabin air and removes contaminants, including exhaled CO₂. NASA describes molecular sieves for CO₂ removal.
3. **Oxygen Generation System:** electrolyzes water to produce oxygen and hydrogen; the hydrogen may be vented or used with CO₂ in a Sabatier process that produces methane and water.

MoonBase models only a single Day 2 choice called `inspect_co2_removal_loop`. It adds a one-time maintenance cost and changes later Power upkeep by one game unit. It does not create an Oxygen resource, does not recover Water, and does not model electrolysis, Sabatier chemistry, pressure, trace contaminants, or failure of a real ECLSS. That separation is scientifically important and should be preserved in judging answers.

### Water-recovery statistics

The NASA ECLSS page states that the Water Recovery System can recover and recycle about 90% of the water **on station**. NASA’s 20 June 2023 [ISS water-recovery milestone](https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/) says the U.S. segment demonstrated a 98% total water-recovery goal with the Brine Processor Assembly, after previously achieving 93–94% overall. These are ISS system results and goals, not a lunar-habitat measurement. The repository’s current documentation correctly says that the game does not apply those percentages.

### Food production

NASA’s [Advanced Plant Habitat](https://science.nasa.gov/mission/advanced-plant-habitat/) is an ISS experiment and controlled plant-growth facility. It uses LED lights, a porous clay substrate, controlled-release fertilizer, water, nutrients, and oxygen delivery to plant roots; it is designed for investigations lasting up to 135 days. MoonBase uses the page to support the concept that food production needs controlled inputs and has delayed benefits. It does not use APH data to derive its `Power -2`, `Water -1`, `Water ≤5`, or `Food +2/+4` values.

### Radiation and shelter

NASA’s [How NASA Will Protect Astronauts From Space Radiation at the Moon](https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/) describes a representative Orion plan in which stowage bags are used to create a denser shelter during an SEP event. NASA’s [Radiation Protection](https://www.nasa.gov/radiation-protection/) page describes protection technologies for solar particle events and galactic cosmic radiation across the Moon and other environments. The NTRS report [Solar-flare shielding with Regolith at a lunar-base site](https://ntrs.nasa.gov/citations/19890004839), NASA-TP-2869, by John E. Nealy, John W. Wilson, and Lawrence W. Townsend, published 1 December 1988, models dose predictions for candidate lunar habitat configurations and lunar-soil shielding.

These sources establish why shielding and sheltering matter and show that real analyses use particle spectra, material models, habitat geometry, and dose calculations. They do **not** establish the MoonBase 0–12 scale, a threshold of 6, a `−2` Day 4 event effect, or the protection state booleans. The current game intentionally avoids claiming a dose or physical shielding percentage.

### Earth–Moon communication

NASA’s [How Does Webb See Back in Time?](https://science.nasa.gov/mission/webb/science-overview/science-explainers/how-does-webb-see-back-in-time/) states that light from the Moon takes about 1.3 seconds to reach Earth. MoonBase’s 2.6-second minimum round-trip statement is `2 × 1.3 seconds`, an explicit arithmetic derivation rather than a separate NASA measurement. The NASA NTRS record [Assessment of the State of Communication Delay Research in Preparation for Missions Beyond Low Earth Orbit](https://ntrs.nasa.gov/citations/20250000703) is a 2025 Human Research Program Investigators’ Workshop presentation by John A. Karasinski, Lauren B. Landon, Megan E. Parisi, Katie R. McTigue, Shu-Chieh Wu, Linda G. Morissette, and Tina L. Panontin. Its abstract says lunar missions may experience one-way communication latencies of 3–14 seconds in operational contexts and that delay affects multi-team operations.

The correct judging explanation is therefore:

- **One-way light propagation:** about 1.3 seconds.
- **Minimum light-only round trip:** about 2.6 seconds, derived by doubling the one-way value.
- **End-to-end operational latency:** potentially longer because encoding, routing, scheduling, computer processing, human decision-making, link availability, and procedures add time. The exact value is mission- and architecture-dependent.
- **MoonBase behavior:** the optional explainer is UI-only. It does not change decisions, resources, replay, victory, failure, or the four-day model.

## Scientific limitations that must be disclosed

1. The four resources are dimensionless game values bounded from 0 to 12.
2. There is no mass balance, energy balance, thermodynamic model, pressure model, atmospheric composition, temperature model, radiation transport, dose calculation, crew physiology, crop model, lunar illumination model, or communication network model.
3. The game does not model actual lunar soil, regolith thickness, water ice extraction, solar-array geometry, dust transport, thermal control, battery state of charge, or ECLSS hardware.
4. The Day 4 solar-particle alert is a fictional narrative event. No live forecast or historical event record is consulted.
5. The `+1 Power`, `+1 Water`, `+2/+4 Food`, Water threshold 5, shelter effects, daily costs, and terminal threshold are balance choices.
6. The Day 3-to-Day 4 harvest compresses real crop-growth time.
7. Static source links are attribution and reading material, not evidence that NASA data drives a live simulation.
8. The project has no child user study, NASA validation, or scientific peer review of its game balance.
9. The repository, interface, rules, and presentation now use the team-supplied official audience label of ages 7–12. This is a target audience label, not evidence of child-user validation or measured learning outcomes.

## Strongest ten sources for a judge

1. [NASA ECLSS reference](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/): separate water recovery, air revitalization, and oxygen generation.
2. [NASA ISS water-recovery milestone](https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/): 93–94% prior recovery and 98% demonstrated total-recovery goal in the ISS context.
3. [NASA Advanced Plant Habitat](https://science.nasa.gov/mission/advanced-plant-habitat/): controlled space-plant research using LED light, water, and nutrients.
4. [NASA/TM-20240003496](https://ntrs.nasa.gov/citations/20240003496): lunar-dust properties and exposed-surface/solar-array challenges.
5. [NASA TechPort DMFlex-ACO project 116295](https://techport.nasa.gov/projects/116295): dust-mitigation technology context for flexible solar arrays.
6. [NASA radiation-protection article for the Moon](https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/): solar-particle events and temporary shelter concepts.
7. [NASA Radiation Protection technology page](https://www.nasa.gov/radiation-protection/): protection technology scope and intended environments.
8. [NASA-TP-2869 / NTRS 19890004839](https://ntrs.nasa.gov/citations/19890004839): regolith-shielding dose analyses and why real radiation modeling is more detailed than a game meter.
9. [NASA Webb light-travel explainer](https://science.nasa.gov/mission/webb/science-overview/science-explainers/how-does-webb-see-back-in-time/): approximately 1.3 seconds for Moon light to reach Earth.
10. [NTRS 20250000703](https://ntrs.nasa.gov/citations/20250000703): communication-delay research and operational lunar latency context.

