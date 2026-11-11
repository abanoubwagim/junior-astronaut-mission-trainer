# API, Architecture, and Local Run Guide

## Active scope

The active build implements MoonBase Day 1, Day 2, Day 3, and Day 4:

- Moon is the only destination.
- `ESTABLISH THE BASE` is the mission title.
- `POWER DROP` is caused by `TERRAIN_SHADOW`.
- Day 4 is an emergency-protocol chapter with a descriptive terminal report;
  it does not introduce final success/failure evaluation.
- There is no Mars destination, preview, or mission path.

## Architecture

- Frontend: plain HTML, CSS, and vanilla JavaScript in
  `mission-trainer-frontend/`. It keeps the current mission response and
  ordered decisions in runtime memory only.
- Backend: Java 17 / Spring Boot in `mission-trainer-backend/`.
  `MissionRulesService` owns the event, ordered-history validation, outcome
  state, day transitions, and result.
- Scene: the existing Three.js lunar environment and player controller remain
  the primary gameplay area. The solar array is a registered interactive scene
  object with a proximity prompt and objective beacon.
- Fallback: if WebGL or an asset fails, the browser shows an accessible mission
  terminal and does not claim that the 3D scene loaded.
- Stateless replay: the server stores no mission session. The browser submits
  the complete ordered history, and the backend rebuilds the result.
- No authentication, database, cookies, local storage, session storage, or
  saved progress is used.

## Endpoints

Base URL: `http://localhost:8080/api/v1`

### `GET /health`

```json
{"status":"UP"}
```

### `POST /missions/start`

No request body is required. The response contains the Day 1 event, the four
qualitative inspection values, six official NASA source links, exactly three
choices, initial qualitative state, and empty history/effects.

Important response fields:

```json
{
  "status": "ACTIVE",
  "day": 1,
  "totalDays": 4,
  "event": {
    "title": "POWER DROP",
    "eventCause": "TERRAIN_SHADOW",
    "inspectionReport": {
      "arrayCondition": "No visible damage detected",
      "sunlightExposure": "Reduced",
      "powerGeneration": "Reduced",
      "eventCause": "Terrain shadow"
    },
    "choices": [
      {"id":"use_stored_energy"},
      {"id":"begin_vsat_deployment"},
      {"id":"reduce_non_essential_loads"}
    ]
  },
  "decisionHistory": [],
  "activeEffects": []
}
```

### `POST /missions/decisions`

The client sends only the ordered decision history. It never sends resource
totals, outcomes, or calculated effects.

```json
{
  "decisions": [
    {"day": 1, "choiceId": "reduce_non_essential_loads"}
  ]
}
```

A successful request with one Day 1 decision returns `status: "ACTIVE"`,
`day: 2`, the Day 2 event, the Day 1 `result` and `latestDecision`, one
decision in `decisionHistory`, the authoritative qualitative state, and the
Day 2 briefing context. This preserves the completed Day 1 report while making
Day 2 available through the same stateless response.

A successful request with a complete Day 1 + Day 2 history returns
`status: "ACTIVE"`, `day: 3`, the Day 3 event, and two decisions in
`decisionHistory`, the authoritative qualitative state, both active effects,
the Day 2 `latestDecision`, and a `result` containing:

- `DAY 2 COMPLETE`;
- the selected decision title;
- preserved and reduced/delayed outcomes;
- water recovery, potable supply, verification, crew life-support, and
  recovered-water isolation states;
- the Day 2 persistent effect;
- one scientific takeaway;
- an explicit Day 3 briefing message.

The Day 2 event adds `systemReport`, containing the four qualitative rows shown
in the alert UI, and `contextNote`, derived from the actual Day 1 choice. The
Day 3 event adds five qualitative rows for stored food, the crop unit, crop
growth, approved crop water, and power availability. The NASA links are
educational references, not lunar-farm telemetry.

A successful request with a complete Day 1 + Day 2 + Day 3 history returns
`status: "ACTIVE"`, `day: 4`, the `SOLAR RADIATION ALERT`, four qualitative
shelter rows, three Day 4 choices, three decisions in `decisionHistory`, and
the authoritative Day 1–Day 3 state. The response records one of
`LIMITED_CROP_TRIAL_STARTED`, `PACKAGED_FOOD_DEPENDENCY`, or
`EXPANDED_CROP_PRODUCTION` and keeps `cropGrowth: "NOT_HARVEST_READY"`.

A successful request with a complete Day 1 + Day 2 + Day 3 + Day 4 history
returns `status: "DAY_4_COMPLETE"`, `day: 4`, `event: null`, four decisions in
`decisionHistory`, the mandatory `STOPPED`/`STORM_SHELTER` state, primary
shielding availability, the selected Day 4 result, and the inherited power,
water, and food constraints. The Day 4 result is descriptive only and does not
calculate radiation dose, shielding effectiveness, a threshold, or mission
success/failure.

## Validation and errors

Invalid requests return HTTP 400 using:

```json
{"error":{"code":"INVALID_CHOICE","message":"That response is not available for Day 1."}}
```

The rules engine rejects empty history, missing or invalid day numbers, a Day 2
decision without a Day 1 decision, unknown choice IDs, duplicate decisions,
wrong-day entries, invalid Day 3 or Day 4 choice IDs, unsupported future-day
entries, and decisions after the Day 4 terminal state. Repeating an identical valid
request returns the same result.

## Local verification

From the repository root:

```powershell
node --test mission-trainer-frontend\tests
.\mission-trainer-backend\mvnw.cmd -f mission-trainer-backend\pom.xml test
```

Run the backend with:

```powershell
.\mission-trainer-backend\mvnw.cmd -f mission-trainer-backend\pom.xml spring-boot:run
```

Serve `mission-trainer-frontend/` with any static HTTP server, for example:

```powershell
python -m http.server 5500 --directory mission-trainer-frontend
```
