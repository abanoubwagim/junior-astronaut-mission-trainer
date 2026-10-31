# MoonBase Scientific Assumptions and Equations

## Purpose

This document labels every important number in the implemented game. It prevents a fictional balance value from being mistaken for a NASA measurement and gives judges a reproducible way to understand the deterministic replay.

The implementation is in [`MissionRulesService.java`](../mission-trainer-backend/src/main/java/org/juniorastronaut/missiontrainer/game/MissionRulesService.java). The canonical written rules are in [`GAME_RULES.md`](GAME_RULES.md), but this audit treats the Java service as the authority when documentation and generated presentation material disagree.

## Number-origin legend

| Label | Meaning |
|---|---|
| **NASA-derived measurement** | A number explicitly reported by an authoritative NASA source. It must retain its original context and units. |
| **Calculated from NASA-derived data** | A transparent arithmetic derivation from a NASA number, such as doubling one-way light time. |
| **NASA-supported engineering assumption** | A qualitative design idea supported by NASA engineering material, but not a direct measurement of MoonBase. |
| **Scientific-paper value** | A number or result from a NASA technical report or paper, used only in its original model/context. |
| **Simplified game parameter** | A value selected for the four-round puzzle. It is not a physical unit and has no NASA calibration. |
| **Fictional narrative event** | A story event invented for the game, even if its general topic is scientifically plausible. |
| **Arbitrary abstraction** | A meter or flag representing a complex system without physical units. |

## Complete numerical inventory

### Resources and mission structure

| Value | Implementation | Origin | Scientific interpretation |
|---|---|---|---|
| Four mission days | `MissionRulesService.java:15`, `DAYS = 4`; frontend and README | Simplified game parameter | Four planning rounds, not four Earth days, lunar days, or a NASA mission duration. |
| Power start = 12 | `MissionRulesService.State` defaults; `MissionRulesService.java` start path; `GAME_RULES.md:17` | Simplified game parameter | Dimensionless game units. |
| Water start = 12 | Same | Simplified game parameter | Dimensionless game units. |
| Food start = 10 | Same | Simplified game parameter | Dimensionless game units. |
| Shelter readiness start = 8 | Same | Simplified game parameter / arbitrary abstraction | A planning/readiness meter, not a dose, shielding percentage, thickness, or physical state. |
| Minimum for all resources = 0 | `MIN = 0`; `clamp()` at `MissionRulesService.java:16-17,443-445` | Simplified game parameter | Zero triggers failure for the resource categories checked by the rules. |
| Maximum for all resources = 12 | `MAX = 12`; `clamp()` | Simplified game parameter | Storage/balance cap, not a capacity measurement. |
| Day 4 shelter threshold = 6 | `SHELTER_BELOW_THRESHOLD` and `failureFor()` lines 255–256 | Simplified game parameter | A game requirement for final readiness. |

### Daily effects

| Effect | Days | Origin | Notes |
|---|---:|---|---|
| Power upkeep −2 | 1–4, except Days 3–4 after CO₂ service | Simplified game parameter | Not kilowatt-hours or a NASA ECLSS load. |
| Water upkeep −2 | 1–4 | Simplified game parameter | Not liters or crew-consumption data. |
| Food upkeep −2 | 1–4 | Simplified game parameter | Not calories, kilograms, or crew metabolic data. |
| Shelter wear −1 | 1–4 unless shielding preparation is active from Day 2 | Simplified game parameter | Not physical degradation or radiation exposure. |
| CO₂ maintenance Power upkeep = −1 | Days 3–4 only | Simplified game parameter, NASA-supported concept | NASA supports separate air revitalization; the one-unit saving is invented. |
| Clean-array delayed Power +1 | Days 2–4 | Simplified game parameter, NASA-supported concept | Dust/array risk is sourced; the amount and duration are not. |
| Recycler delayed Water +1 | Days 3–4 | Simplified game parameter, NASA-supported concept | This is the single scheduled recovery effect; it is not a 90%/98% fraction. |
| Grow-tray harvest Food +4 | Day 4 only | Simplified game parameter and fictional time compression | NASA APH supports controlled plant research; no NASA source supports +4 in one turn. |
| Day 4 shelter event −2 | Day 4 | Fictional narrative event plus simplified game parameter | The story is a fictional solar-particle alert; the effect is not a dose or event measurement. |

### Immediate choice effects

| Day | Choice ID | Immediate Power | Immediate Water | Immediate Food | Immediate Shelter | Later state/effect | Origin |
|---:|---|---:|---:|---:|---:|---|---|
| 1 | `clean_solar_array` | −1 | 0 | 0 | 0 | Power +1 on Days 2–4 | Game parameter; dust/power theme NASA-supported |
| 1 | `connect_spare_battery` | +1 | 0 | 0 | 0 | None | Game parameter |
| 1 | `prepare_storm_shelter` | −1 | 0 | 0 | +2 | `shieldingPrepared=true`; prevents shelter wear on Days 2–4 | Game parameter; preparation theme NASA-supported |
| 2 | `service_water_recycler` | −1 | +1 | 0 | 0 | Water +1 on Days 3–4 | Game parameter; water recovery theme NASA-supported |
| 2 | `use_backup_water_pack` | −3 | +5 | 0 | 0 | None; Water is clamped | Game parameter |
| 2 | `inspect_co2_removal_loop` | −1 | 0 | 0 | 0 | `airLoopServiced=true`; Power upkeep becomes −1 on Days 3–4 | Game parameter; ECLSS separation NASA-supported |
| 3 | `start_grow_light_tray` | −2 | −1 | 0 | 0 | Food +4 on Day 4 | Game parameter; controlled crop theme NASA-supported |
| 3 | `open_meal_crate` | −1 | 0 | +3 | 0 | None | Game parameter |
| 4 | `full_storm_shelter` prepared | −1 | 0 | 0 | +4 | `shelterActivated=true`, mode FULL | Game parameter; shelter concept NASA-supported |
| 4 | `full_storm_shelter` unprepared | −2 | 0 | 0 | +4 | `shelterActivated=true`, mode FULL, `emergencyProtectionActivated=true` | Game parameter; temporary-shelter concept NASA-supported |
| 4 | `passive_storm_shelter` prepared | 0 | 0 | 0 | +2 | `shelterActivated=true`, mode PASSIVE | Game parameter |
| 4 | `passive_storm_shelter` unprepared | 0 | 0 | 0 | +2 | Activation flag is set but final protection check fails | Game validation rule |

## Canonical transition equation

For each resource `r` on day `d`, the backend calculates:

```text
raw[d,r] = before[d,r]
           + daily[d,r]
           + delayed[d,r]
           + event[d,r]
           + choice[d,r]

after[d,r] = clamp(raw[d,r], 0, 12)
```

The actual implementation is [`MissionRulesService.java:134-229`](../mission-trainer-backend/src/main/java/org/juniorastronaut/missiontrainer/game/MissionRulesService.java#L134-L229). It applies the terms in this order:

1. Daily upkeep and wear.
2. Scheduled effects already earned by earlier choices.
3. Day 4 fictional shelter event.
4. The selected choice and its state flag.
5. Independent clamp of Power, Water, Food, and Shelter readiness to 0–12.
6. Resource-zero failure check.
7. On Day 4, passive-preparation, readiness-threshold, activation, and protection checks.

Delayed effects are therefore applied before zero checks. The Day 4 grow harvest can lift Food above zero before terminal evaluation. The Day 4 event is stored in the Shelter readiness breakdown, not as a Power, Water, or Food event effect.

The backend returns `before`, `daily`, `delayed`, `event`, `choice`, bounded `after`, and net `change` in `ResourceBreakdown`. These fields are authoritative; the frontend only displays them (`app.js:492-503`).

## State flags and what they do

| Flag/state | Meaning in this game | What it does not mean |
|---|---|---|
| `airLoopServiced` | Day 2 CO₂-loop maintenance choice was selected; later Power upkeep uses −1 on Days 3–4. | It does not make oxygen, recover water, change atmospheric composition, or represent a measured energy saving. |
| `shieldingPrepared` | Day 1 protection plan/material-preparation choice was selected; later shelter wear is suppressed. | It is not a coverage percentage, material thickness, dose reduction, or activated shelter. |
| `shelterActivated` | A Day 4 shelter choice was selected. | Activation alone does not guarantee final protection readiness. |
| `shelterMode` | `FULL` or `PASSIVE` chosen on Day 4. | It is not a physical habitat mode validated by NASA. |
| `emergencyProtectionActivated` | Unprepared FULL shelter was selected on Day 4. | It is not proof of a real emergency shielding performance. |
| `protectionReady` | Derived as `shelterActivated && (shieldingPrepared || emergencyProtectionActivated)`. | It is not a radiation dose or a medical safety judgment. |
| `shelterReadiness` | 0–12 abstract readiness score. | It is not radiation exposure, shielding, regolith thickness, or structural readiness in engineering units. |

## Failure and success equations

### Primary failure priority

After each day’s state update, `failureFor()` checks in this fixed order:

```text
if Power == 0       -> POWER_REACHED_ZERO
else if Water == 0  -> WATER_REACHED_ZERO
else if Food == 0   -> FOOD_REACHED_ZERO
else if Shelter == 0 -> SHELTER_READINESS_REACHED_ZERO
else if Day < 4     -> ACTIVE
else if PASSIVE and shieldingPrepared == false
                    -> PASSIVE_SHELTER_REQUIRES_PREPARED_SHIELDING
else if Shelter < 6 -> SHELTER_READINESS_BELOW_THRESHOLD
else if activated == false
                    -> SHELTER_NOT_ACTIVATED
else if protectionReady == false
                    -> PROTECTION_NOT_READY
else                -> SUCCEEDED
```

The implementation retains a secondary reason for an unprepared passive shelter when readiness is also below 6. The primary reason remains the passive-preparation failure because it appears first in the documented Day 4 protection checks.

### Success condition

```text
Power > 0
AND Water > 0
AND Food > 0
AND ShelterReadiness >= 6
AND shelterActivated == true
AND (shieldingPrepared == true OR emergencyProtectionActivated == true)
```

Preparation alone cannot satisfy the final condition because `shelterActivated` is independently required.

## Communication arithmetic

| Quantity | Formula/value | Origin | Meaning |
|---|---|---|---|
| One-way Earth–Moon light propagation | approximately 1.3 seconds | NASA-derived measurement reported by NASA’s [Webb explainer](https://science.nasa.gov/mission/webb/science-overview/science-explainers/how-does-webb-see-back-in-time/) | Approximate time for light from the Moon to reach Earth; actual path geometry varies. |
| Minimum light-only round trip | `2 × 1.3 = 2.6` seconds | Calculated from NASA-derived measurement | Outbound and return propagation only; no processing, routing, scheduling, or human response. |
| End-to-end operational latency | greater than the light-only minimum and architecture-dependent | NASA-supported engineering concept; NTRS [20250000703](https://ntrs.nasa.gov/citations/20250000703) discusses lunar operational one-way latencies of 3–14 seconds in its mission-operations context | Not a single fixed number used by MoonBase. |
| In-game response time | none | Product decision | The communication demo is optional UI-only and does not change state or consume a turn. |

The 1.3-second value must not be described as a guaranteed end-to-end response time. The 2.6-second value must not be described as a complete operational round trip.

## Water recovery arithmetic and no double counting

The recycler choice has exactly one immediate `+1 Water` and one delayed `+1 Water` on each of Days 3 and 4. It does not also reduce daily Water upkeep. For example, after Day 1 with any normal choice, a Day 2 recycler path uses:

```text
Day 2 Water = clamp(Day 1 Water − 2 daily + 1 choice, 0, 12)
Day 3 Water = clamp(Day 2 Water − 2 daily + 1 delayed − 1 grow-tray choice, 0, 12)
Day 4 Water = clamp(Day 3 Water − 2 daily + 1 delayed + 0 shelter choice, 0, 12)
```

The `+1` values are game units. NASA’s approximately 90% station recovery statement and 98% ISS demonstration are contextual sources only; no percentage is inserted into this equation.

## CO₂ maintenance arithmetic

If `airLoopServiced` becomes true on Day 2:

```text
Power daily = −2 on Days 1–2
Power daily = −1 on Days 3–4
```

The Day 2 choice still costs `Power −1` immediately. The rule does not add an Oxygen resource or Water effect. The `−1` later upkeep difference is a simplified game parameter, not measured ECLSS energy consumption.

## Shielding and shelter arithmetic

Day 1 `prepare_storm_shelter`:

```text
Power −1
Shelter readiness +2
shieldingPrepared = true
```

From Day 2 onward, `shieldingPrepared` changes daily shelter wear from `−1` to `0`. On Day 4 it does not activate the shelter by itself. A later Day 4 choice is still required.

Day 4:

```text
Full + prepared:  Power −1, Shelter +4, FULL, protectionReady=true
Full + unprepared: Power −2, Shelter +4, FULL, emergencyProtectionActivated=true
Passive + prepared: Power 0, Shelter +2, PASSIVE, protectionReady=true
Passive + unprepared: Power 0, Shelter +2, PASSIVE, primary failure
```

The protection labels are logical game states. They do not say how much radiation reaches a crew member.

## Independently checked 36-path distribution

The path IDs below use the deterministic enumeration order in the backend test: Day 1 choices in service order, then Day 2, Day 3, and Day 4. A separate transition calculation produced these results.

### Successful paths — 12 of 36

`1, 3, 9, 11, 15, 21, 23, 28, 33, 34, 35, 36`

Final resources:

| Path IDs | Final `(Power, Water, Food, Shelter)` |
|---|---|
| 1 | `(1,6,6,6)` |
| 3 | `(2,7,5,6)` |
| 9 | `(3,3,6,6)` |
| 11 | `(4,4,5,6)` |
| 15 | `(1,7,5,6)` |
| 21 | `(2,3,6,6)` |
| 23 | `(3,4,5,6)` |
| 28 | `(1,7,5,9)` |
| 33 | `(1,3,6,11)` |
| 34 | `(2,3,6,9)` |
| 35 | `(2,4,5,11)` |
| 36 | `(3,4,5,9)` |

### Primary Power failures on Day 3 — 2 of 36

| Path ID | Choices | Final state at terminal check |
|---:|---|---|
| 29 | `prepare_storm_shelter → use_backup_water_pack → start_grow_light_tray → full_storm_shelter` (Day 4 choice is never processed) | `(0,9,4,9)` |
| 30 | `prepare_storm_shelter → use_backup_water_pack → start_grow_light_tray → passive_storm_shelter` (Day 4 choice is never processed) | `(0,9,4,9)` |

These paths stop before Day 4; no Day 4 event or scheduled harvest is applied because the mission has already ended.

### Primary Power failures on Day 4 — 11 of 36

`5, 7, 13, 17, 18, 19, 25, 26, 27, 31, 32`

Final states:

| Path IDs | Final `(Power, Water, Food, Shelter)` |
|---|---|
| 5 | `(0,7,6,6)` |
| 7 | `(0,8,5,6)` |
| 13 | `(0,6,6,6)` |
| 17 | `(0,7,6,6)` |
| 18 | `(0,7,6,4)` |
| 19 | `(0,8,5,6)` |
| 25 | `(0,6,6,11)` |
| 26 | `(0,6,6,9)` |
| 27 | `(0,7,5,11)` |
| 31 | `(0,8,5,11)` |
| 32 | `(0,8,5,9)` |

Some of these passive paths also end with readiness below 6 or unprepared passive mode, but Power is primary because it is checked first. They are therefore not separate mutually exclusive categories.

### Primary unprepared-passive failures — 11 of 36

`2, 4, 6, 8, 10, 12, 14, 16, 20, 22, 24`

These all end at Day 4 with `PASSIVE_SHELTER_REQUIRES_PREPARED_SHIELDING`. Their final resources are respectively:

```text
2  (3,6,6,4)     4  (4,7,5,4)     6  (1,7,6,4)
8  (2,8,5,4)    10  (5,3,6,4)    12  (6,4,5,4)
14 (2,6,6,4)    16 (3,7,5,4)    20 (1,8,5,4)
22 (4,3,6,4)    24 (5,4,5,4)
```

Every one also has Shelter readiness below 6, so “passive unprepared” and “below threshold” overlap. The deterministic primary reason is the passive-preparation rule; readiness below 6 is a secondary condition where the API retains it.

### Failure categories not observed as primary in the complete 36 paths

- Water zero: none.
- Food zero: none.
- Shelter readiness zero: none.
- `SHELTER_NOT_ACTIVATED`: none, because every complete valid path contains a Day 4 shelter choice.
- `PROTECTION_NOT_READY`: none after the passive-preparation check; full unprepared sets emergency protection.

This distribution is a property of the current game model, not scientific evidence or a probability of lunar mission success.

## Eight approved scenario values

These are gameplay test expectations, not NASA data:

| Scenario | Final resources | Result/reason |
|---|---|---|
| `clean_solar_array → service_water_recycler → start_grow_light_tray → full_storm_shelter` | `(1,6,6,6)` | Success |
| `clean_solar_array → service_water_recycler → open_meal_crate → full_storm_shelter` | `(2,7,5,6)` | Success |
| `connect_spare_battery → service_water_recycler → start_grow_light_tray → full_storm_shelter` | `(0,6,6,6)` | Day 4 Power failure |
| `connect_spare_battery → service_water_recycler → open_meal_crate → full_storm_shelter` | `(1,7,5,6)` | Success |
| `prepare_storm_shelter → service_water_recycler → open_meal_crate → passive_storm_shelter` | `(1,7,5,9)` | Success |
| `prepare_storm_shelter → inspect_co2_removal_loop → start_grow_light_tray → passive_storm_shelter` | `(2,3,6,9)` | Success |
| `clean_solar_array → service_water_recycler → open_meal_crate → passive_storm_shelter` | `(4,7,5,4)` | Unprepared passive failure; readiness also below threshold |
| `prepare_storm_shelter → use_backup_water_pack → open_meal_crate → passive_storm_shelter` | `(0,8,5,9)` | Day 4 Power failure; protection checks are not reached |

The corresponding exact assertions are in [`MissionTrainerBackendApplicationTests.java:97-114`](../mission-trainer-backend/src/test/java/org/juniorastronaut/missiontrainer/MissionTrainerBackendApplicationTests.java#L97-L114).

## What equations are deliberately absent

The project has no defensible equation for:

- radiation dose or dose rate;
- shielding percentage or regolith thickness;
- oxygen partial pressure or oxygen production;
- ECLSS power draw in watts;
- water mass, crew liters/day, or 90%/98% recovery applied to the game;
- crop biomass, harvest mass, or photosynthetic rate;
- solar-array watts, dust coverage, or battery state of charge;
- message round-trip completion time beyond the light-only arithmetic.

Those quantities should remain absent rather than be assigned invented values.

