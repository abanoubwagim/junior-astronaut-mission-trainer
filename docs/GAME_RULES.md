# MoonBase: Day 1 Game Rules

This document describes the currently implemented mission slice. The backend class `MissionRulesService` is authoritative; the browser does not calculate outcomes.

## Mission scope

- **World:** Moon
- **Mission:** Day 1 — `ESTABLISH THE BASE`
- **Main system:** Power Budgeting
- **Event:** `POWER DROP`
- **Playable days in this slice:** Day 1 only

The situation is fictional and local to the base: the array is receiving less output than expected. It is not described as a lunar atmospheric dust storm, a surveyed lunar location, or a live NASA event.

## Player flow

1. Start a mission and read the Commander Vega briefing.
2. Choose the Moon in world selection.
3. Explore the lunar scene with the existing third-person controller.
4. Walk to the highlighted solar-array station.
5. Press `E` when the prompt reads `E — Inspect Solar Array`.
6. Read the `POWER DROP` situation and select one solution.
7. Confirm the selection and receive the qualitative result.
8. Day 1 is marked complete. Days 2–4 remain unavailable.

## Approved choices

| Choice | Player action | Qualitative result |
|---|---|---|
| `reduce_non_essential_loads` | Turn off equipment that is not essential right now to reduce the base's energy demand. | Essential operations keep priority, but optional activities such as research or growing experiments may be delayed. |
| `switch_to_backup_batteries` | Use stored energy to keep important base systems running while solar production is reduced. | The base can continue operating for now, but its backup energy reserve is being used. |
| `prioritize_life_support` | Give life-support systems priority when distributing the available energy. | Critical crew-support systems receive priority, while lower-priority equipment and activities may be paused. |

These are qualitative educational simulation choices, not NASA-prescribed operational procedures. No choice is represented as universally correct.

## State model

The API returns labels such as `POWER_PLAN_PENDING`, `LIFE_SUPPORT_PRIORITY`, `HELD`, and `IN_USE`. These labels describe the fictional simulation state only.

The Day 1 API deliberately does **not** return or display:

- Power, Water, Food, or Shelter quantities
- maximums, minimums, units, meters, percentages, rates, gains, losses, or clamp rules
- live NASA telemetry, DSN status, lunar coordinates, or fabricated measurements

NASA-backed science values are represented as `DATA_UNAVAILABLE` until the verified package expected on November 13, 2026 is supplied. Future integration must retain the original source, unit, timestamp, location/context, and measurement type.

## Completion rules

- Starting a mission returns `ACTIVE` with Day 1 and exactly three choices.
- Confirming an approved Day 1 choice returns `DAY_1_COMPLETE` exactly once for that submitted history.
- The response contains qualitative feedback for what was preserved, what was reduced or delayed, and the reserve state.
- A request containing Day 2, Day 3, or Day 4 is rejected with `DAY_1_ONLY`.
- Empty history is rejected with `EMPTY_HISTORY`; the frontend prevents confirmation until a card is selected.

## World separation

Moon and Mars remain separate scene environments. Moon is the only playable destination for this slice. Mars remains visible as `PREVIEW ONLY` and cannot launch the Moon event or send a world selection to the Day 1 backend contract.
