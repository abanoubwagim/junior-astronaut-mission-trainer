# Repository Audit — MoonBase: 4 Days to Survive

Audit performed: 27 October 2026.

## Starting state

- The repository uses a Java 17 Spring Boot Maven backend and a separate plain HTML, CSS, and JavaScript frontend.
- The backend contained only the Spring Boot application entry point and a one-test context-load smoke test. There were no controllers, game rules, request/response models, or mission endpoints.
- The frontend HTML was a title-only placeholder; its JavaScript and CSS files were empty, and there were no local visual assets.
- The root `README.md` described a possible game architecture, called the backend endpoint `/api/health`, and implied that client-side game logic and progress tracking might be added. Those statements conflicted with `CONTRIBUTING.md`, which requires a backend-authoritative, stateless `/api/v1` contract and no saved progress.
- The root Maven file is an aggregator for the backend module. The backend uses Java 17, Spring Boot 4.1.2, Spring MVC, and the existing test starter. No database, account system, API controller, or mission persistence was present.
- No scientific reference list or game-rules specification existed in `docs/` at the audit.

## Implemented from the audit

- Added a deterministic, stateless decision-replay service and the documented `/api/v1` health, start, and decisions endpoints.
- Added ordered-history validation and safe JSON errors. The current audit task now expands the existing backend test class using the already-configured JUnit/Spring test dependency; no testing dependency is added.
- Replaced the placeholder interface with an accessible four-day game flow and a local, original SVG lunar-base illustration.
- Replaced the outdated README and added the canonical rules, NASA evidence, API/architecture, calculation notes, and judges' briefing.

## Constraints and preserved work

- The implementation stays on `main`, uses the existing Java 17/Spring Boot project, and adds no persistence, authentication, gameplay token, framework, or external runtime service.
- Existing local Git changes were preserved. No commit or branch was created.
- Build and runtime verification results are recorded in [JUDGES_BRIEFING.md](JUDGES_BRIEFING.md) after commands are actually run.
