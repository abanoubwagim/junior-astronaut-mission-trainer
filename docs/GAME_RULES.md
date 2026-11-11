# MoonBase: Day 1–Day 4 Game Rules

`MissionRulesService` is the authoritative rules engine. The browser keeps the
ordered decision history in memory, renders server responses, and never
calculates mission outcomes or resource values.

## Scope

- World: Moon only
- Mission: `ESTABLISH THE BASE`
- Active playable chapters: Day 1, Day 2, Day 3, and Day 4
- Day 4 is descriptive only; it does not calculate a final mission success or
  failure classification
- State model: qualitative labels only; no numerical power, water, battery, or
  processing values are invented

The base, stations, alerts, choices, and persistent labels are fictional game
assumptions. MoonBase is an independent educational project; NASA has not
endorsed or validated it.

## Player flow

1. Start the mission and read the existing briefing.
2. Choose the Moon, which is the only destination.
3. Explore the existing 3D lunar environment and inspect the Day 1 solar array.
4. Submit one Day 1 decision and read the authoritative Day 1 report.
5. Continue to the Day 2 briefing, enter the lunar habitat, and find the
   spatially registered Water Recovery Station.
6. Inspect the station to reveal the `WATER QUALITY ALERT`, its system report,
   and exactly three Day 2 choices.
7. Submit one Day 2 decision. The backend returns the authoritative Day 2
   result and opens the Day 3 briefing with the carried-forward state.
8. Enter the Crop Production Unit, inspect the food and crop systems, and
   reveal the `FOOD SUPPLY WARNING` before choosing a Day 3 strategy.
9. Submit one Day 3 decision. The backend returns the authoritative Day 3
   report and opens the Day 4 briefing with its qualitative state.
10. Read the `SOLAR RADIATION ALERT`, stop EVA, enter the existing Storm
    Shelter, and inspect the shelter/resource status.
11. Choose one supplementary-shielding strategy and submit it through the
    same ordered-history endpoint.
12. Read the descriptive Day 4 report. The Day 1–Day 4 history is preserved in
    the returned response.

If the 3D scene fails, the accessible mission terminal provides the same
inspection steps. Refreshing the page starts a new mission; no browser or
server persistence exists.

## Day 1 — Power Drop

The Day 1 event is `POWER DROP`, caused by `TERRAIN_SHADOW`. The array is shown
as intact, while terrain shadows reduce sunlight exposure and solar input.

| Choice ID | Backend effect |
|---|---|
| `use_stored_energy` | `backupReserve=IN_USE`, `powerAllocation=STORED_ENERGY_SUPPORT` |
| `begin_vsat_deployment` | `verticalArrayStatus=DEPLOYMENT_PREPARATION`; preparation is not deployment and does not generate power immediately |
| `reduce_non_essential_loads` | `powerDemand=REDUCED`, `powerAllocation=ESSENTIAL_OPERATIONS_PRIORITY` |

All Day 1 choices preserve the reduced solar input and intact-array state.

## Day 2 — Life Support Crisis

The event is `WATER QUALITY ALERT`. The water recovery system reports an
unacceptable water-quality reading. The recovered water is isolated from the
potable supply until it can be inspected, reprocessed, and verified.

An unacceptable reading does **not** prove contamination and does **not** prove
that the recovery hardware is physically broken. Water recovery is one
life-support subsystem; air revitalization and oxygen generation remain
separate, and the Day 2 event keeps crew life support `OPERATIONAL`.

The system report is:

| System | State |
|---|---|
| Water recovery | `RESTRICTED` |
| Potable water supply | `AVAILABLE` |
| Water quality verification | `REQUIRED` |
| Crew life support | `OPERATIONAL` |

The three choices are:

| Choice ID | Choice | Trade-off | Persistent state |
|---|---|---|---|
| `inspect_reprocess_water` | Inspect the recovery system and start reprocessing while keeping failed water isolated | Requires time and power; the water is not immediately safe | `REPROCESSING_PENDING_VERIFICATION` |
| `use_stored_potable_water` | Use the already approved potable reserve and keep failed water isolated | The available reserve is reduced; the recovery issue remains unresolved | `POTABLE_RESERVE_REDUCED` |
| `conserve_water` | Reduce non-essential use and postpone optional water activities | The recovery restriction remains unresolved; essential drinking and hygiene remain protected | `WATER_CONSERVATION_ACTIVE` |

The exact result messages are returned by the backend:

- Reprocessing: “Reprocessing has started. The recovered water remains
  isolated until it passes quality verification.”
- Stored potable water: “The crew is using stored potable water. The available
  reserve has been reduced.”
- Conservation: “Non-essential water use has been reduced. Essential crew
  needs remain the priority.”

## Day 3 — Food Production

The event is `FOOD SUPPLY WARNING`. Stored ready-to-eat food is `LOW`, the
Crop Production Unit is `AVAILABLE`, and `CROP_GROWTH` remains
`NOT_HARVEST_READY`. The event is a fictional educational warning, not crop
disease, equipment failure, live NASA telemetry, or a claim that a lunar farm
is already operational.

The Day 3 system report is:

| System | State |
|---|---|
| Stored food supply | `LOW` |
| Crop production unit | `AVAILABLE` |
| Crop growth | `NOT_HARVEST_READY` |
| Approved water for crops | Derived qualitatively from the Day 2 state |
| Power availability | Derived qualitatively from the Day 1 state |

The three choices use the exact identifiers below:

| Choice ID | Choice | Persistent state | Trade-off |
|---|---|---|---|
| `START_LIMITED_CROP_TRIAL` | Start a Limited Crop Trial | `LIMITED_CROP_TRIAL_STARTED` | Starts a smaller future food effort, but needs power, approved water, nutrients, monitoring, and continued care. It does not provide an immediate meal or guarantee a Day 4 harvest. |
| `PRESERVE_STORED_FOOD` | Preserve Stored Food | `PACKAGED_FOOD_DEPENDENCY` | Avoids allocating additional power and water to a new crop cycle, but no new crop production starts and the base remains dependent on low stored food. |
| `EXPAND_CROP_PRODUCTION` | Expand Crop Production | `EXPANDED_CROP_PRODUCTION` | Starts a broader future food effort. It is accepted even when power or approved water is constrained; the backend records those operational constraints instead of changing the player's choice. |

The backend always accepts all three valid Day 3 identifiers. It evaluates the
actual Day 1 power state and Day 2 water state from the ordered history. A
risky expansion can therefore be less effective without being rejected.

Recovered water that is still pending verification remains isolated and is
never treated as approved water for crops. No water quantities, power costs,
food quantities, growth rates, harvest amounts, or durations are invented.

Every Day 3 response keeps `CROP_GROWTH=NOT_HARVEST_READY`; the result explains
that crops need time and continued care and do not provide an immediate meal.

## Day 4 — Emergency Protocol

The event is `SOLAR RADIATION ALERT`. It is an educational simulation of a
solar-particle-event warning, not live NASA telemetry. The base already has a
designated Storm Shelter with fixed primary shielding; the player does not
build a shelter during this event.

The mandatory safety procedure happens before the strategic choice:

1. Stop all EVA operations.
2. Enter the existing Storm Shelter.
3. Review the shelter status and choose how to handle supplementary shielding.

The shelter report is qualitative:

| System | State |
|---|---|
| EVA status | `STOPPED` |
| Crew location | `STORM_SHELTER` |
| Primary shielding | `AVAILABLE` |
| Supplementary shielding | `READY_FOR_RESOURCE_ALLOCATION` |

The three strategic choices are:

| Choice ID | Persistent/result state | Rule |
|---|---|---|
| `REPOSITION_WATER_SUPPLIES` | `WATER_SUPPLIES_POSITIONED_FOR_SHIELDING` or `WATER_SUPPLIES_UNAVAILABLE` | Uses only approved water represented by the current Day 2 state. Isolated recovered water pending verification is never used. Reduced potable reserve and active conservation are reported as constraints, while crew water needs remain the priority. |
| `REPOSITION_FOOD_SUPPLIES` | `FOOD_SUPPLIES_POSITIONED_FOR_SHIELDING` or `FOOD_SUPPLIES_LIMITED` | Uses available packaged food without treating immature crops as food. The Day 3 crop states remain `NOT_HARVEST_READY`. |
| `MAINTAIN_EXISTING_SHIELDING` | `PRIMARY_SHIELDING_MAINTAINED` | Keeps the fixed primary shielding and preserves water and food access. This is a valid strategic choice, not mission failure. |

The backend accepts any of the three valid choices, including a risky choice
under limited power, approved water, or packaged-food conditions. It preserves
the original choice and returns the deterministic operational constraint; it
does not silently replace the choice or invent quantities, percentages,
durations, radiation doses, shielding effectiveness, or thresholds.

Day 4 records `EVA_STOPPED`, `STORM_SHELTER`, and the existing primary
shielding in the returned state. The report remains descriptive and does not
claim scientifically verified radiation safety. Final mission evaluation rules
remain pending scientific review after November 13, 2026.

## Continuity and replay

Day 2 accepts only an ordered history containing a valid Day 1 decision first.
The Day 1 state is replayed and preserved before the Day 2 state is applied:

- `use_stored_energy`: energy management is more constrained; no battery
  capacity or operating time is invented.
- `begin_vsat_deployment`: VSAT preparation remains ongoing; no immediate solar
  generation is added.
- `reduce_non_essential_loads`: reduced non-essential loads remain active and
  essential systems retain priority.

The Day 2 state and both decisions remain in the ordered response history for
Day 3. Reprocessing is never automatically marked successful, and the
recovered water remains `RECOVERED_WATER_ISOLATED` with
`WATER_QUALITY_VERIFICATION_REQUIRED`. Day 3 carries its food strategy and
`NOT_HARVEST_READY` crop state into Day 4, where immature crops cannot become
emergency food.

The backend rejects missing Day 1 history, unknown IDs, wrong-day entries,
duplicate decisions, invalid Day 3 or Day 4 identifiers, and decisions after
Day 4. Replaying the same valid history is deterministic and safe because no
mission session is stored.
