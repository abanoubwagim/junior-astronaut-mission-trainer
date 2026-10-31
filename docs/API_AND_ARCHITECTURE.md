# API, Architecture, and Local Run Guide

## Architecture

- **Frontend:** plain HTML, CSS, and vanilla JavaScript in `mission-trainer-frontend/`. It presents the welcome/briefing, current event, resource meters, selectable decisions, server feedback, and result. It stores only the current mission response and ordered decisions in JavaScript memory while the page is open.
- **Backend:** Java 17 / Spring Boot in `mission-trainer-backend/`. `MissionController` exposes the API; `MissionRulesService` owns all resource values, events, validation, choice effects, replay, transitions, and outcomes; `ApiExceptionHandler` returns safe JSON errors.
- **Stateless replay:** On each decision the browser sends the full ordered day/choice list. The backend starts from canonical initial values, validates the list, and recalculates it from Day 1. It returns the authoritative current resources, the next event or result, and the latest calculation breakdown. The server keeps no mission object between HTTP requests.
- **No saved progress:** There are no accounts, database, gameplay tokens, cookies, server sessions, browser storage, URL state, or saved history. Refreshing returns to the welcome screen; a new Start Mission request begins from Day 1. Restart clears the browser's in-memory mission and requests a fresh initial state.
- **Limit:** A user can replay or alter a decision history because this is not an authenticated competition or anti-cheat system. They cannot submit authoritative resource totals: the service recomputes them from the choices.

## Endpoints

Base URL: `http://localhost:8080/api/v1`

To import the API into Apidog, use **Import Data → OpenAPI/Swagger** and select [`moonbase-api.apidog.json`](moonbase-api.apidog.json). Set the active environment's base URL to `http://localhost:8080`. The specification includes endpoint schemas, valid choice IDs, request examples for success/failure/invalid inputs, and response examples.

### Health — `GET /health`

Response:

```json
{"status":"UP"}
```

### Start — `POST /missions/start`

No request body is required. It creates no session and saves nothing. Response fields:

- `status`, `day`, `totalDays`
- `resources`: `power`, `water`, `food`, `shelterReadiness`
- `resourceDefinitions`: labels, bounds, display units, and purpose
- `event`: current day, situation, science fact, NASA source links, and valid choices
- `activeEffects`, `decisionHistory`, `systems`, `latestDecision`, `result`

Initial response outline (Day 1 copy and choices are abbreviated here; the actual response contains all returned text and choice fields):

```json
{
  "status": "ACTIVE",
  "day": 1,
  "totalDays": 4,
  "resources": {"power": 12, "water": 12, "food": 10, "shelterReadiness": 8},
  "resourceDefinitions": [
    {"key": "power", "label": "Power", "minimum": 0, "maximum": 12, "unit": "game units", "purpose": "..."}
  ],
  "event": {
    "day": 1,
    "title": "Dust on the solar array",
    "situation": "...",
    "scienceFact": "...",
    "scienceSources": [{"title": "...", "url": "https://..."}],
    "choices": [{"id": "clean_solar_array", "title": "...", "description": "...", "tradeoff": "..."}]
  },
  "activeEffects": [],
  "decisionHistory": [],
  "systems": {
    "airLoopServiced": false,
    "shieldingPrepared": false,
    "shelterActivated": false,
    "shelterMode": null,
    "emergencyProtectionActivated": false,
    "protectionReady": false
  },
  "latestDecision": null,
  "result": null
}
```

### Submit or recalculate decisions — `POST /missions/decisions`

The request is the complete decision history through the current selection. The supported contract contains no resource values, calculated effects, score, or claimed outcome. Spring ignores unrecognized request properties; the backend reads only the ordered day and choice ID fields and recalculates all game state.

```json
{
  "decisions": [
    {"day": 1, "choiceId": "clean_solar_array"},
    {"day": 2, "choiceId": "service_water_recycler"}
  ]
}
```

Valid choice IDs:

| Day | IDs |
|---|---|
| 1 | `clean_solar_array`, `connect_spare_battery`, `prepare_storm_shelter` |
| 2 | `service_water_recycler`, `use_backup_water_pack`, `inspect_co2_removal_loop` |
| 3 | `start_grow_light_tray`, `open_meal_crate` |
| 4 | `full_storm_shelter`, `passive_storm_shelter` |

The response uses the same state fields as Start. It includes a `systems` object for CO₂-loop service, shielding preparation, shelter activation/mode, emergency protection, and qualitative protection readiness. It includes a `latestDecision` with `day`, `choiceId`, `choiceTitle`, `headline`, `explanation`, `whyItMatters`, `futureEffect`, and `resourceBreakdown`. Each resource breakdown includes `before`, `daily`, `delayed`, `event`, `choice`, bounded `after`, and actual net `change`. For an active mission, `event` contains the next day. At terminal state, `event` is `null`, `activeEffects` is empty, and `result` contains `status`, `title`, `summary`, `limitingResource`, `primaryFailureReason`, `secondaryFailureReasons`, `takeaways`, and the resolved choice summaries. Shelter readiness and protection readiness are qualitative game states, not radiation dose or shielding percentages.

The response to an identical valid history is deterministic. The service validates required fields, 1-based sequential days, choice/day compatibility, maximum four days, and absence of choices after an in-history terminal state.

### Errors

All error responses use:

```json
{"error":{"code":"INVALID_CHOICE","message":"That choice is not available for this day."}}
```

| HTTP status | Codes / cases |
|---|---|
| `400` | `EMPTY_HISTORY`, `INVALID_HISTORY`, `INVALID_CHOICE`, `POST_TERMINAL_DECISION`, `MALFORMED_REQUEST` |
| `404` | `NOT_FOUND` for an unknown API route |
| `500` | `INTERNAL_ERROR` for an unexpected server error; response does not expose a stack trace |

The frontend keeps the previous state and candidate history uncommitted if a request fails, displays the safe error, and allows retry. Decision controls are disabled during submission.

## Automated verification

From the repository root, run the backend suite with the existing Maven/JUnit dependencies:

```powershell
.\mission-trainer-backend\mvnw.cmd -f pom.xml -pl mission-trainer-backend -am test
```

Run the dependency-free frontend behavior checks with Node.js 20 or newer:

```powershell
node --test mission-trainer-frontend\tests\app.test.cjs
```

The backend tests cover all 36 four-day choice combinations with independent arithmetic, delayed-effect timing, boundaries, terminal states, request validation, and canonical HTTP routing. Frontend tests cover the connected flow, server-owned results, restart, request loading, failure/retry, focus and announcement behavior, and absence of browser persistence. They use a DOM test harness; they do not replace live browser, viewport, or assistive-technology testing.

## Local run

From the repository root in Windows PowerShell, start the backend:

```powershell
.\mission-trainer-backend\mvnw.cmd -f pom.xml -pl mission-trainer-backend -am spring-boot:run
```

In a second terminal, serve the static frontend:

```powershell
python -m http.server 5500 --directory mission-trainer-frontend
```

Open [http://localhost:5500/html/](http://localhost:5500/html/). The backend listens on the `PORT` environment variable and defaults to `8080`; the frontend uses `http://localhost:8080/api/v1` by default. For another backend location, set `window.MOONBASE_API_BASE_URL` before loading `app.js`. CORS permits `http://localhost:5500` and `http://127.0.0.1:5500`; requests from other origins are rejected.

For a health check, use `Invoke-RestMethod http://localhost:8080/api/v1/health`. Start and decisions are POST requests. The backend is stateless and needs no database or account setup.

## Public demonstration deployment (not deployed)

No public deployment has been created or tested. A future demonstration needs a static host for the complete `mission-trainer-frontend/` directory (preserving `html/`, `css/`, `js/`, and `assets/`) and a Java 17 runtime for the Spring Boot backend. Serve both over HTTPS.

Before publishing the frontend, set `window.MOONBASE_API_BASE_URL` to the hosted API base ending in `/api/v1` in a script loaded before `app.js`. Keep that URL free of secrets. The backend reads its listen port from `PORT` and defaults to `8080`.

The current `@CrossOrigin` allowlist in `MissionController` permits only `http://localhost:5500` and `http://127.0.0.1:5500`. If the frontend and API use different public origins, add the exact HTTPS frontend origin to the backend allowlist (or replace the annotation with an explicit environment-backed allowlist) and rebuild the backend. Do not use a wildcard origin. A same-origin reverse proxy can avoid browser CORS, provided it routes `/api/v1` to the backend. Verify the deployed health endpoint, preflight response, start request, and complete gameplay flow before presenting a public URL.

The local Python static server is for development only. This repository contains no deployment manifest, hosting configuration, public API origin, production CORS origin, or hosted demo, and no external accounts or services have been configured.
