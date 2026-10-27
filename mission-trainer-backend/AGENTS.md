# Backend Instructions — MoonBase: 4 Days to Survive

Read the root `CONTRIBUTING.md` first. These instructions apply to everything inside `mission-trainer-backend/`. The root file is the source of truth for product decisions and the canonical API contract.

## Existing stack

- Use the existing Java Spring Boot Maven project.
- Preserve the current Java version and Spring Boot configuration unless inspecting the repository reveals a concrete incompatibility.
- Keep dependencies minimal. Prefer the dependencies already present in `pom.xml`; justify and document any addition.
- Use the existing Maven wrapper for builds and tests where possible.

## Backend purpose and boundaries

The backend is the **single authority for all game calculations**, including resource effects, event outcomes, day transitions, and win/failure conditions. The game has **no user accounts, authentication, database, or saved progress**.

Do not implement authentication, registration, player profiles, session persistence, saved reports, leaderboards, player-related database tables, or in-memory server-side mission sessions.

The backend should expose stateless request/response APIs to:
- start a mission by returning the canonical Day 1 state, resources, event, and choices;
- validate a complete ordered history of player choices and recompute the mission state from the canonical initial state;
- return the authoritative state, latest decision feedback/resource changes, next event/choices, or final result;
- provide a lightweight health endpoint if appropriate.

Do not add a database just because a backend exists. Do not keep mission state in server memory, sessions, caches, files, or other storage. Each request must contain enough decision history for the backend to recompute its response deterministically.

## Stateless calculation model — no gameplay token

- Do **not** implement Signed State Tokens, JWTs, HMAC tokens, cookies, server sessions, or another mechanism for gameplay state.
- The frontend sends the complete ordered list of decisions made so far, including the newly submitted decision. Each item identifies the in-game day and the selected choice.
- The backend starts from canonical Day 1 initial values and replays the supplied decisions using the single centralized rules engine.
- Validate that decisions begin at Day 1, days are sequential, there is exactly one valid decision per resolved day, each choice belongs to that day's event, and no decisions occur after a terminal state.
- Reject malformed, duplicate, out-of-order, unknown, missing, or post-terminal decisions with a consistent client error.
- Never accept client-supplied resource totals, calculated effects, scores, success/failure outcomes, or next-day state as authoritative inputs. Calculate them on the server.
- Keep responses deterministic for identical valid requests unless randomness is explicitly documented and tested.
- This approach prevents direct client selection of resource totals but does not prevent every deliberate replay or request manipulation. That limitation is acceptable for this simple, non-competitive educational game. Do not overengineer anti-cheat protection.

## Architecture and conventions

- Use clear separation between controller, service/domain logic, request/response DTOs, configuration, and exception handling.
- Controllers should be thin; place game rules, history validation, replay, and calculations in service/domain classes.
- Use explicit request/response DTOs rather than exposing internal entities or arbitrary maps.
- Use enums or other constrained types for finite values such as day identifiers, event types, mission statuses, and choice identifiers where appropriate.
- Validate request fields and return consistent, safe error responses.
- Use constructor injection. Avoid field injection.
- Keep classes and methods focused. Avoid overengineering a four-day educational game.
- Do not log unnecessary player information. The game should not collect personal data.
- Configure CORS narrowly for the actual local/deployed frontend origins; do not use wildcard origins together with credentials.
- Keep environment-specific settings outside source code when needed. Never commit secrets.

## Canonical API contract

Keep this contract synchronized with the frontend and root `CONTRIBUTING.md`. Document the implemented contract in the project README or a concise API document.

### 1. Start a mission

- `POST /api/v1/missions/start`
- Request: no body required.
- Response: initial Day 1 mission state, initial resources, Day 1 event/situation, available choices, and an empty decision history.
- Do not create a server-side session or save anything.

### 2. Submit/recalculate decisions

- `POST /api/v1/missions/decisions`
- Request shape:

```json
{
  "decisions": [
    { "day": 1, "choiceId": "example-choice-id" }
  ]
}
```

- The request contains the complete ordered decision history from Day 1 through the newly submitted decision.
- Validate sequential day numbers, the correct choice for each day's event, required fields, and the absence of decisions after a terminal result.
- Recompute the full mission from canonical initial resources and rules. Do not trust client resource totals, effects, scores, or outcomes.
- Response: authoritative mission state plus the latest resolved day, feedback, resource changes, and either the next day's event/choices or the terminal mission result.
- Repeating an identical valid request must produce the same logical result.
- No endpoint may fetch or resume a current mission because no mission is stored.

### 3. Health

- `GET /api/v1/health` may return a small status response if consistent with the existing project setup.

### Error format and status codes

Use a consistent safe JSON error shape, for example:

```json
{
  "error": {
    "code": "INVALID_CHOICE",
    "message": "That choice is not available for this day."
  }
}
```

Use appropriate status codes consistently: `400` for malformed or invalid requests, `404` for unknown routes, and `500` for unexpected server failures. Never expose stack traces, implementation details, or secrets in API responses. Document any additional status codes that the implementation needs.

## Game rules and scientific accuracy

- Follow root `CONTRIBUTING.md` for the four-day mission and no-persistence requirement.
- Centralize initial resource values, daily consumption, choice effects, persistent cross-day effects, formulas/order of calculations, resource bounds, event prerequisites, day transitions, and terminal conditions in the game domain/rules layer.
- Document these mechanics in one canonical game-rules document. Do not maintain contradictory copies in frontend code, controllers, or separate services.
- Research relevant science using official NASA sources and keep source URLs in project documentation.
- Clearly separate real scientific facts from simplified game-balancing values.
- Do not claim a game mechanic is NASA-approved or a real engineering model unless the evidence directly supports that claim.

## Build, run, and verify — do not create backend test files

- **Do not create any backend test files.** Do not create or modify files under `src/test/`, and do not add testing libraries or test-related dependencies. Do not delete or rewrite existing test files.
- Verify backend behavior using real build and runtime checks: use the existing Maven wrapper and available project commands, start the Spring Boot application, call the health endpoint, and send representative requests to mission endpoints.
- Manually verify valid choices, invalid choice IDs, missing/duplicate/out-of-order days, decisions after a terminal result, resource boundaries, and deterministic results for identical decision histories. Use HTTP requests, curl, or an equivalent available tool; do not create test source files for these checks.
- Run the Maven package/build command and report precisely whether compilation, packaging, application startup, health checks, and API scenarios succeeded. If an existing build requires a test-skipping option to package without running test sources, use the appropriate Maven option and disclose it.
- Never claim a check passed unless it actually ran. Keep backend start instructions, API examples, and frontend integration documentation current.

## Completion checklist

- No authentication, gameplay token, server session, or player/progress persistence was introduced.
- The backend is stateless between requests.
- The backend alone calculates resources and mission outcomes by replaying validated ordered decisions.
- API contracts are documented and match frontend usage.
- Domain rules are centralized, validated, and deterministic; runtime/manual API verification results are reported. No new backend test files were created.
- Science references are recorded and game-only assumptions are labelled.
- Build and test results are reported accurately.
