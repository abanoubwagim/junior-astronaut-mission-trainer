# MoonBase: 4 Days to Survive

An English-language educational lunar survival game for young explorers ages 8–12. Across four mission-planning rounds, players balance Power, Water, Food, and Shelter readiness through choices inspired by real spaceflight research.

This is an independent educational project created for the NASA Space Apps Challenge 2026 **Junior Astronaut Mission Trainer** challenge. It is not an official NASA product and is not endorsed or validated by NASA.

## Play the game locally

Use Java 17. From the repository root, start the Spring Boot backend:

```powershell
.\mission-trainer-backend\mvnw.cmd -f pom.xml -pl mission-trainer-backend -am spring-boot:run
```

In a second terminal, serve the plain static frontend:

```powershell
python -m http.server 5500 --directory mission-trainer-frontend
```

Open [http://localhost:5500/html/](http://localhost:5500/html/). The frontend calls `http://localhost:8080/api/v1`; backend port defaults to `8080` and can be set with `PORT`. CORS permits only `http://localhost:5500` and `http://127.0.0.1:5500`. It needs no database, account, or secret configuration.

## Mission design

- Exactly four in-game days; each is a planning round, not one real Earth or lunar day.
- The backend is the sole authority for rules, resource calculations, choice validation, delayed effects, day transitions, and outcomes.
- The browser submits the complete ordered decision history. The server replays it from the initial state and returns the authoritative state and calculation breakdown.
- No account, database, saved progress, browser storage, URL state, session, or gameplay token. Refresh returns to the welcome screen; starting again requests a fresh Day 1 state.
- The resource scale, costs, rates, harvest timing, and outcome thresholds are simplified **game values**, not engineering measurements.

## Project layout

```text
mission-trainer-frontend/    Static HTML, CSS, JavaScript, and local SVG art
mission-trainer-backend/     Java 17 / Spring Boot stateless API and rules engine
docs/                        Audit, game rules, science references, API, judges' briefing
```

## Documentation

- [Repository audit](docs/PROJECT_AUDIT.md)
- [Canonical game rules and worked examples](docs/GAME_RULES.md)
- [NASA science sources and simplifications](docs/SCIENCE_REFERENCES.md)
- [API contract, architecture, and local run guide](docs/API_AND_ARCHITECTURE.md)
- [OpenAPI JSON for Apidog import](docs/moonbase-api.apidog.json)
- [Judges' technical and science briefing](docs/JUDGES_BRIEFING.md)
- [Contribution and product rules](CONTRIBUTING.md)

## AI assistance and competition notes

OpenAI Codex assisted with implementation, test authoring, technical review, and documentation. The project team remains responsible for verifying and submitting the work. The [2026 participant terms](https://www.spaceappschallenge.org/legal/) require citing every source used and making original project content freely available or open source; this project is an independent entry and is not endorsed by NASA.

## Test and verify

Run the backend unit and HTTP integration suite from the repository root:

```powershell
.\mission-trainer-backend\mvnw.cmd -f pom.xml -pl mission-trainer-backend -am test
```

Run the frontend interaction checks with Node.js 20 or newer:

```powershell
node --test mission-trainer-frontend\tests\app.test.cjs
```

Both suites use dependencies or runtimes already available; no testing framework or frontend dependency was added. Automated and live-browser verification results, along with any remaining limitations, are recorded in the [judges' briefing](docs/JUDGES_BRIEFING.md).
