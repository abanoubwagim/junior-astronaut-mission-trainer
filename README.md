# MoonBase: 4 Days to Survive

MoonBase is an independent, child-friendly lunar survival game for ages 7–12. Players explore a lunar outpost, make four connected mission decisions, and learn how power, water, food, and shelter systems interact. NASA has not endorsed or validated the project.

## Features

- Four-day Moon-only mission with deterministic outcomes.
- Backend-authoritative, stateless decision replay.
- Vanilla JavaScript interface with a Three.js lunar environment and local astronaut model.
- Qualitative gameplay values clearly separated from scientific evidence.
- NASA-backed context for lunar illumination, life support, space agriculture, and space weather.
- No accounts, database, cookies, browser storage, or saved progress.

## Technology

- Java 17 and Spring Boot 4.1.2
- Maven with the backend Maven Wrapper
- Spring MVC, Jakarta Validation, and Jackson
- Plain HTML, CSS, and JavaScript
- Three.js 0.180.0 loaded from jsDelivr
- Node.js built-in test runner for frontend contract checks

## Architecture

The Spring Boot backend exposes a small stateless API. It validates the complete ordered decision history, replays the canonical mission rules, and returns the authoritative state. The browser renders those responses and keeps only the current decision history in memory.

NASA integration is isolated under `integration/nasa`. DONKI is called server-side through `/get/SEP` using the official CCMC endpoint. Requests have bounded timeouts, limited retries, a 15-minute in-memory cache, and an explicitly archived fallback snapshot. DONKI is used as solar/near-Earth space-weather context; it is not treated as a lunar-surface radiation measurement and does not determine game outcomes.

Curated evidence for the four mission chapters is bundled under `mission-trainer-backend/src/main/resources/nasa-evidence`. The Site01 package is checksum-validated at startup. The official DONKI documentation is available at [CCMC APIs](https://ccmc.gsfc.nasa.gov/tools/API/) and [DONKI OpenAPI](https://ccmc.gsfc.nasa.gov/DONKI/api/openapi/).

## Run locally

Requirements: Java 17, Python 3, and Node.js 20 or newer.

Start the backend from the repository root:

```powershell
.\mission-trainer-backend\mvnw.cmd -f pom.xml -pl mission-trainer-backend -am spring-boot:run
```

In a second terminal, serve the frontend:

```powershell
python -m http.server 5500 --directory mission-trainer-frontend
```

Open <http://localhost:5500/html/>. The backend defaults to port `8080`; set `PORT` to change it.

## Tests and build

```powershell
.\mission-trainer-backend\mvnw.cmd -f pom.xml -pl mission-trainer-backend -am test
.\mission-trainer-backend\mvnw.cmd -f pom.xml -pl mission-trainer-backend -am package
node --test mission-trainer-frontend\tests
```

JavaScript syntax can be checked with:

```powershell
Get-ChildItem mission-trainer-frontend\js -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
```

## Environment configuration

`.env.example` documents supported settings. Spring reads environment variables; it does not require a committed `.env` file. Keep any local `.env` ignored and never expose its values to the browser.

- `PORT` — backend port, default `8080`.
- `CORS_ALLOWED_ORIGINS` — comma-separated frontend origins.
- `NASA_DONKI_BASE_URL` — DONKI base URL, defaulting to the official CCMC endpoint.
- `NASA_CONNECT_TIMEOUT`, `NASA_READ_TIMEOUT`, `NASA_CACHE_TTL`, and `NASA_LOOKBACK_DAYS` — NASA client settings.
- `NASA_API_KEY`/`API_KEY` — reserved for future NASA services; the current DONKI endpoint does not require or send a key.

The application is intentionally database-free and stateless.
