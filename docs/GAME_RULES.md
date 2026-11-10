# MoonBase: Game Rules and Mechanics

This is the canonical specification for the implemented game. The backend class `MissionRulesService` is the single rules engine. The frontend displays its responses and does not decide resource outcomes.

## Mission objective

Help the crew survive exactly four mission days. Keep Power, Water, and Food above zero, finish Day 4 with at least 6 Shelter readiness, and activate protection. A mission ends early if a resource reaches zero. The interface calls each quantity a **game value**; none is a real engineering unit or NASA measurement.

Each mission day is a short planning round in the game, not one Earth day or one lunar daylight cycle. This compressed time scale makes a four-step resource puzzle possible for ages 7–12.

## Resources

All resources are whole numbers, start at the values below, and are bounded from 0 to 12 inclusive. The game clamps any total below 0 to 0 and any total above 12 to 12. There is no fractional arithmetic or rounding.

| API key            | Display name      | Start | Minimum | Maximum | Purpose                                                                                                          |
|--------------------|-------------------|------:|--------:|--------:|------------------------------------------------------------------------------------------------------------------|
| `power`            | Power             |    12 |       0 |      12 | Runs the habitat, rover, recycler, and grow lights.                                                              |
| `water`            | Water             |    12 |       0 |      12 | Crew supply; recovery can stretch the reserve.                                                                   |
| `food`             | Food              |    10 |       0 |      12 | Crew supply; stored meals and a delayed grow tray affect it.                                                     |
| `shelterReadiness` | Shelter readiness |     8 |       0 |      12 | Abstract preparedness for the final shelter event. It is not a radiation dose or physical shielding measurement. |

These starting values and all rates/effects in the tables below are **game-only balancing values**. The NASA sources support the science themes, not the quantities.

The grow-tray Water threshold of 5 and harvest values of +2 and +4 are educational game parameters. They are not liters, kilograms, crop yields, or NASA-certified agricultural limits. The simplified dependency illustrates that controlled food production needs supporting Water availability.

## Daily calculation order

For each day, the backend starts from the previous day's resource totals and applies these steps exactly once:

1. **Daily needs and wear:** Power −2, Water −2, Food −2. CO₂-loop maintenance changes Power upkeep to −1 on Days 3–4. Shelter readiness −1, except that a Day 1 shelter-preparation choice prevents this wear on Days 2–4.
2. **Scheduled effects:** A cleaned solar array adds Power +1 on Days 2–4 and a serviced recycler returns Water +1 on Days 3–4. On Day 4, the backend first applies daily Water upkeep and scheduled Water recovery, then checks that resulting Water value to choose the grow-tray harvest: Food +2 when Water is 5 or lower, otherwise Food +4.
3. **Day 4 event:** The solar-storm alert reduces Shelter readiness by 2.
4. **Selected decision:** Apply the one valid choice effect for that day.
5. **Bounds:** Clamp each resulting integer independently to 0–12.
6. **Terminal check:** If any resource is 0, the mission fails on that day. After Day 4, passive shelter requires prior shielding preparation, Shelter readiness must be at least 6, shelter must be activated, and protection must be ready. The fixed failure priority is Power, Water, Food, Shelter readiness, passive-shelter preparation, readiness threshold, activation, then protection readiness.

In formula form, for each resource `r` and day `d`:

```text
After[d,r] = clamp(Before[d,r] + Daily[d,r] + Scheduled[d,r] + Event[d,r] + Choice[d,r], 0, 12)
```

`Before` is the previous response's state (or the canonical initial value on Day 1). `Daily` is the scheduled consumption/wear. `Scheduled` is a delayed effect earned by an earlier choice. For a Day 4 grow harvest, the Food scheduled term is selected after the Day 4 Water daily and scheduled terms have been applied: `+2` when that resulting Water value is `≤ 5`, otherwise `+4`. `Event` is the Day 4 storm hazard (zero on Days 1–3). `Choice` is the selected option's immediate effect. The backend reports these five components plus the bounded result and net change for every resource.

## Events, choices, and effects

| Day                        | Choice ID                | Immediate choice effect        | Continuing effect / trade-off                                                    |
|----------------------------|--------------------------|--------------------------------|----------------------------------------------------------------------------------|
| 1: Dust on the solar array | `clean_solar_array`      | Power −1                       | Power +1 on Days 2–4. Lowers current Power to improve later output.              |
| 1: Dust on the solar array | `connect_spare_battery`  | Power +1                       | No later effect. Gives a smaller immediate boost without a rover task.           |
| 1: Dust and storm planning | `prepare_storm_shelter`  | Power −1, Shelter readiness +2 | Maps a regolith/stored-mass protection area and prevents normal Shelter-readiness wear on Days 2–4. |
| 2: Water loop needs care   | `service_water_recycler` | Power −1, Water +1             | Water +1 on Days 3–4, on top of normal consumption.                              |
| 2: Water loop needs care   | `use_backup_water_pack`  | Power −2, Water +5             | No later effect. Water is capped at 12.                                          |
| 2: Water and air systems   | `inspect_co2_removal_loop` | Power −1                       | Power upkeep is 1 lower on Days 3–4 as a simplified game rule; it generates no Oxygen or Water. |
| 3: Fresh food for the crew | `start_grow_light_tray`  | Power −2, Water −1             | Food +2 or +4 on Day 4, based on Water after upkeep and scheduled recovery. The one-turn harvest is compressed game time. |
| 3: Fresh food for the crew | `open_meal_crate`        | Power −1, Food +3              | No later effect; helps immediately.                                              |
| 4: A solar-particle warning | `full_storm_shelter`     | Power −1 prepared / −2 unprepared, Shelter readiness +4 | Activates FULL mode; regolith or stored mass is the science context, while the values remain game-only. |
| 4: A solar storm warning   | `passive_storm_shelter`  | Shelter readiness +2           | Uses no Power; valid only with prior shielding preparation.                       |
| 4: Solar-particle warning  | `wait_for_earth_instructions` | No immediate resource effect | Demonstrates communication latency; waiting does not activate protection before the event check. |

Choice descriptions, IDs, current events, resource definitions, and science source links are returned by the backend. No choice outcome is calculated in the browser.

## Worked successful path

The following path demonstrates a sustainable strategy: clean the array, service the recycler, start the grow tray, then use the full shelter setup.

Resource order in each tuple is `(Power, Water, Food, Shelter readiness)`.

| Step | Calculation | Expected state |
|---|---|---|
| Start | Canonical initial values | `(12, 12, 10, 8)` |
| Day 1: clean array | Daily `(-2,-2,-2,-1)`; choice `(-1,0,0,0)` | `(9, 10, 8, 7)` |
| Day 2: service recycler | Daily `(-2,-2,-2,-1)`; scheduled solar `( +1,0,0,0)`; choice `(-1,+1,0,0)` | `(7, 9, 6, 6)` |
| Day 3: grow tray | Daily `(-2,-2,-2,-1)`; scheduled solar/water `(+1,+1,0,0)`; choice `(-2,-1,0,0)` | `(4, 7, 4, 5)` |
| Day 4: full shelter (unprepared emergency) | Daily `(-2,-2,-2,-1)`; scheduled solar/water/harvest `(+1,+1,+4,0)` because Water after scheduled recovery is 6; storm `(0,0,0,-2)`; choice `(-2,0,0,+4)` | `(1, 6, 6, 6)` — **success** |

The backend's observed values are documented in [JUDGES_BRIEFING.md](JUDGES_BRIEFING.md) after runtime verification.

## Failure examples and boundaries

- **Power depletion after a costly Water choice:** Day 1 `prepare_storm_shelter`, Day 2 `use_backup_water_pack`, Day 3 `start_grow_light_tray` reaches `(Power 1, Water 9, Food 4, Shelter readiness 9)` after the new −2 Power cost. Day 4 then reaches Power 0 and fails; the delayed grow harvest is applied before that terminal check.
- **Shelter not ready:** Day 1 `clean_solar_array`, Day 2 `use_backup_water_pack`, Day 3 `start_grow_light_tray`, Day 4 `passive_storm_shelter` ends with `(Power 1, Water 7, Food 5, Shelter readiness 4)`. Shelter readiness is below 6, so the Day 4 result fails with Shelter readiness identified.
- **New backup-pack success:** Day 1 `clean_solar_array`, Day 2 `use_backup_water_pack`, Day 3 `open_meal_crate`, Day 4 `full_storm_shelter` ends at `(Power 1, Water 8, Food 5, Shelter readiness 6)` and succeeds.
- **Reduced grow harvest:** On a Day 4 route whose Water is 5 before daily upkeep and has no recycler recovery, Day 4 Water becomes 3. The grow tray therefore adds +2 Food instead of +4; the actual amount appears in the Food breakdown and feedback.
- **Maximum clamp:** With initial Water 12, Day 1 consumes 2; the Day 2 backup-pack choice follows daily Water use (12 − 2 − 2 + 5 = 13), then clamps the result to 12. The response exposes the `choice: +5`, `after: 12`, and actual `change: +2` relative to the pre-Day-2 state of 10.
- **Minimum clamp:** In the Power-depletion example, Day 4's computed Power is below zero and the response clamps it to 0 before failure is checked.

No score is awarded. Success/failure is based only on the documented resource, Shelter-readiness, shelter-activation, and protection conditions. There is no random event, hidden penalty, rescue mechanic, or extra playable day.

## History validation

The decisions API accepts one to four items with sequential day numbers beginning at 1. Each ID must belong to that day's event. Empty, malformed, duplicate, missing, out-of-order, unknown-choice, over-four-day, and post-terminal histories are rejected as client errors. The backend replays from the canonical initial values for every request and stores nothing between requests.

## NASA data context and communication delay

Every event now carries a visible hazard type, hazard level, data-status label, and a Moon communication delay context. The mission response also returns a `spaceWeather` object with the NASA DONKI source link, a severity label, a clear note that the scenario is curated rather than live, and a 1.3-second one-way Moon light-time value. These fields educate the player and support traceability; they do not drive a real radiation-dose calculation.

Day 4 is a solar-particle event scenario, not a live forecast. NASA describes solar-particle events, monitoring, shielding, and timely shelter decisions as important protection topics. MoonBase models those ideas with qualitative Shelter readiness and Protection readiness game states. The `wait_for_earth_instructions` choice makes communication delay a visible operational trade-off: a short signal delay can still matter when the crew must act locally.
