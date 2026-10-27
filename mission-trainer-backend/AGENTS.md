# Backend Instructions — MoonBase: 4 Days to Survive

Read the root `CONTRIBUTING.md` first. These instructions apply to everything inside `mission-trainer-backend/`.

## Existing stack

- Use the existing Java Spring Boot Maven project.
- Preserve the current Java version and Spring Boot configuration unless inspecting the repository reveals a concrete incompatibility.
- Keep dependencies minimal. Prefer the dependencies already present in `pom.xml`; justify and document any addition.
- Use the existing Maven wrapper for builds and tests where possible.

## Backend purpose and boundaries

The game has **no user accounts and no saved progress**. Do not implement authentication, registration, player profiles, session persistence, saved reports, leaderboards, or player-related database tables.

The backend may support genuinely server-side responsibilities such as:
- serving canonical mission/event content;
- validating a submitted choice against the current mission rules;
- calculating authoritative resource effects and day transitions, if the final architecture assigns simulation rules to the server;
- providing a lightweight health endpoint.

Do not add a database just because a backend exists. The game should work without any persistent player data. Prefer stateless request/response APIs. The frontend may hold the current game state in runtime memory, and the player starts from Day 1 after a refresh or return.

Before adding an endpoint, determine whether it is necessary. Avoid creating an API for static UI-only behavior or duplicating the same game rules in multiple places.

## Architecture and conventions

- Use clear separation between controller, service/domain logic, request/response DTOs, configuration, and exception handling.
- Controllers should be thin; place game rules and validation in services/domain classes.
- Use explicit request/response DTOs rather than exposing internal entities or arbitrary maps.
- Use enums or other constrained types for finite values such as day identifiers, event types, and choice identifiers where appropriate.
- Validate request fields and return consistent, safe error responses.
- Use constructor injection. Avoid field injection.
- Keep classes and methods focused. Avoid overengineering a four-day educational game.
- Never trust client-submitted resource totals or scores if the backend is the authority for simulation calculations.
- Do not log secrets or unnecessary player information. The game should not collect personal data.
- Configure CORS narrowly for the actual local/deployed frontend origins; do not use wildcard origins together with credentials.
- Keep environment-specific settings outside source code when needed. Never commit secrets.

## API contract requirements

- Agree on API paths, HTTP methods, request DTOs, response DTOs, field names, enum values, and error shapes before wiring the frontend.
- Document the implemented contract in the project README or a concise API document.
- Use appropriate HTTP status codes and predictable JSON responses.
- Include a health endpoint if consistent with the existing repository setup.
- Keep responses deterministic for identical valid inputs unless randomness is a documented and tested game mechanic.
- If a request is invalid or a choice is unavailable for the current day/state, return a clear client error rather than silently accepting it.
- Update frontend integration and backend tests together whenever a contract changes.

## Game rules and scientific accuracy

- Follow the root `CONTRIBUTING.md` for the four-day mission and the no-persistence requirement.
- Research relevant science using official NASA sources and keep source URLs in project documentation.
- Clearly separate real scientific facts from simplified game-balancing values.
- Centralize resource limits, choice effects, event prerequisites, day transitions, and terminal conditions. Avoid contradictory copies of these rules.
- Make the four-day simulation internally consistent and test both normal and edge cases.
- Do not claim a game mechanic is NASA-approved or a real engineering model unless the evidence directly supports that claim.

## Testing and verification

- Add unit tests for core rules and service logic, including resource minimum/maximum boundaries, invalid choices, day ordering, and mission completion/failure behavior.
- Add controller/API tests for successful requests and expected validation/error responses.
- Tests must not require external network access or a live database.
- Run the Maven wrapper tests and package/build checks when possible. Do not claim success unless commands completed successfully.
- Keep the backend start instructions and API examples current.

## Completion checklist

- No authentication or player/progress persistence was introduced.
- The backend is stateless with respect to individual play sessions.
- API contracts are documented and match frontend usage.
- Domain rules are centralized, validated, and tested.
- Science references are recorded and game-only assumptions are labelled.
- Build and test results are reported accurately.
