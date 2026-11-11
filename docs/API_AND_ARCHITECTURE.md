# API, Architecture, and Local Run Guide

## Current Day 1 scope

MoonBase currently implements one authoritative playable mission slice:

- World: Moon
- Day: 1 / 4
- Mission: `ESTABLISH THE BASE`
- Event: `POWER DROP`
- Objective: reach and inspect the solar-array station

Days 2–4 are intentionally not exposed by this implementation. The Mars scene remains visible as `PREVIEW ONLY`; it cannot launch a mission or receive the Moon `POWER DROP` event. This mission contract does not claim to implement a Mars mission.

## Architecture

- **Frontend:** plain HTML, CSS, and vanilla JavaScript in `mission-trainer-frontend/`. It keeps only the current response and selected choice in memory, presents the 3D lunar scene, and sends decisions to the backend.
- **Backend:** Java 17 / Spring Boot in `mission-trainer-backend/`. `MissionController` exposes the API and `MissionRulesService` is the single authority for the Day 1 event, three choices, validation, qualitative outcomes, and completion state.
- **Stateless replay:** the browser sends the ordered Day 1 choice history. The backend validates it and returns the authoritative qualitative result. No session, database, account, cookie, or browser persistence is used.
- **No fake telemetry:** there are no Power, Water, Food, Shelter quantities, meters, daily rates, or NASA telemetry claims in the Day 1 contract.

## Endpoints

Base URL: `http://localhost:8080/api/v1`

### Health — `GET /health`

```json
{"status":"UP"}
```

### Start — `POST /missions/start`

No request body is required. The response contains the Day 1 event and exactly three choices:

```json
{
  "status": "ACTIVE",
  "day": 1,
  "totalDays": 4,
  "event": {
    "day": 1,
    "title": "POWER DROP",
    "situation": "The base is receiving less solar power than expected. The crew must decide how to use the available energy. Some systems are essential for keeping the crew safe, while other activities can wait.",
    "scienceFact": "DATA UNAVAILABLE — The verified NASA data package expected November 13, 2026 is not available yet. This is a fictional equipment condition for the educational simulation, not a live lunar event.",
    "scienceSources": [],
    "choices": [
      {"id":"reduce_non_essential_loads","title":"Reduce Non-Essential Loads","description":"Turn off equipment that is not essential right now to reduce the base's energy demand.","tradeoff":"Trade-off: Essential operations keep priority, but optional activities may be delayed."},
      {"id":"switch_to_backup_batteries","title":"Switch to Backup Batteries","description":"Use stored energy to keep important base systems running while solar production is reduced.","tradeoff":"Trade-off: The base can continue operating for now, but its backup energy reserve is being used."},
      {"id":"prioritize_life_support","title":"Prioritize Life Support","description":"Give life-support systems priority when distributing the available energy.","tradeoff":"Trade-off: Critical crew-support systems receive priority, while lower-priority equipment and activities may be paused."}
    ],
    "dataStatus": "DATA_UNAVAILABLE"
  },
  "qualitativeState": {
    "solarInput":"REDUCED_SOLAR_INPUT",
    "powerAllocation":"POWER_PLAN_PENDING",
    "backupReserve":"AVAILABLE_NOT_MEASURED",
    "crewSupport":"STANDARD_PRIORITY",
    "dataStatus":"DATA_UNAVAILABLE",
    "valueOrigin":"GAME_SIMULATION"
  },
  "activeEffects": [],
  "decisionHistory": [],
  "latestDecision": null,
  "result": null
}
```

### Submit — `POST /missions/decisions`

The request must contain exactly one Day 1 decision. The browser does not send resource values or calculate outcomes.

```json
{
  "decisions": [{"day": 1, "choiceId": "prioritize_life_support"}]
}
```

A successful response has `status: "DAY_1_COMPLETE"`, `event: null`, one decision in `decisionHistory`, a qualitative state, and a `latestDecision` containing:

- `preserved`
- `reducedOrDelayed`
- `reserveState`
- child-friendly `explanation`, `whyItMatters`, and `futureEffect`

The response also includes `result` with the Day 1 takeaway and the resolved choice. Repeating a full two-item history is rejected with `DAY_1_ONLY`; this prevents Days 2–4 from being accepted by the Day 1 contract.

## Data provenance integration point

The event uses `DATA_UNAVAILABLE` and an empty `scienceSources` list until the verified NASA package expected on November 13, 2026 is available. When that package is integrated, preserve its original source, unit, timestamp, location/context, and measurement type in a separate science-data structure. Do not turn a verified measurement into a gameplay quantity or imply NASA endorsement of the fictional choices.

## Errors

```json
{"error":{"code":"INVALID_CHOICE","message":"That solution is not available for Day 1."}}
```

The main client errors are `EMPTY_HISTORY`, `INVALID_HISTORY`, `INVALID_CHOICE`, and `DAY_1_ONLY`. The frontend keeps the current screen and selected choice when a request fails and enables retry.

## Verification

Frontend contract checks:

```powershell
node --test mission-trainer-frontend\tests\day1-contract.test.cjs
```

Backend tests:

```powershell
.\mission-trainer-backend\mvnw.cmd -f mission-trainer-backend\pom.xml test
```

The backend test class `DayOneMissionRulesServiceTest` covers start state, the exact three choices, all qualitative feedback paths, empty selection, one-time Day 1 completion, and rejection of later-day history.
