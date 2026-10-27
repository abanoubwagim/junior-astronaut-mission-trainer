# Project Rules — MoonBase: 4 Days to Survive

This file is the project-wide source of truth. Read it before changing code. The repository is maintained by one developer, with Codex expected to implement tasks end-to-end with minimal hand-holding.

## Product goal

Build **MoonBase: 4 Days to Survive**, an English-language, child-friendly educational web game for the NASA Space Apps Challenge 2026 challenge **Junior Astronaut Mission Trainer**. The player manages a lunar base through a short four-day survival mission and learns through meaningful choices grounded in space science.

## Non-negotiable product decisions

- The mission is **four in-game days** long.
- There is **no registration, login, player account, profile, or authentication**.
- There is **no database for players, game sessions, progress, scores, or history**.
- Do not persist game state in `localStorage`, `sessionStorage`, IndexedDB, cookies, URL state, or any other browser/server storage.
- Game state exists only in runtime memory. Refreshing, closing the tab, or leaving and returning starts a fresh mission from Day 1.
- Do not add a Continue Mission, resume, saved report, or mission-history feature.
- Keep the existing frontend/backend repository layout unless a concrete technical reason requires a change.
- The frontend is HTML, CSS, and vanilla JavaScript. The backend is Java/Spring Boot using the existing Maven project and Java version unless a verified build requirement forces an adjustment.
- No additional frameworks, libraries, databases, authentication providers, or external services without a clear need. Prefer the simplest working implementation.
- Build a complete, coherent game; do not stop at mockups, static screens, TODOs, or a plan.

## Canonical game rules and design decisions

1. The game has a clear start, four playable in-game days, and an ending/result screen.
2. Each day must present a comprehensible situation, relevant information, and a meaningful player decision. Choices must affect game state and/or later events; do not make choices cosmetic.
3. Show resource levels and explain in child-friendly language what changes after a decision and why it matters.
4. Keep the simulation understandable for children. Use a small, consistent set of resources and mechanics; avoid needless complexity.
5. The mission must be completable through sensible decisions. Failure or critical states, if implemented, must be understandable, fair, and consistent with the resource rules.
6. Do not invent scientific facts or present game balancing numbers as real NASA measurements. Distinguish verified science from simplified game mechanics.
7. Codex should decide and implement any still-unspecified design details consistently, after checking official sources where scientific accuracy matters. Record important final mechanics, values, formulas, and event rules in the relevant project documentation so they are not contradictory across screens or services.
8. Keep the full four-day loop internally consistent: initial resources, choice effects, event prerequisites, resource bounds, day transitions, win/failure conditions, and final summary must agree.

## Science and research policy

- Prefer official NASA sources, mission pages, technical explainers, and NASA educational resources.
- For lunar environment, power, water, food, radiation, habitats, life support, dust, and exploration claims, use a relevant source for the specific claim.
- Keep source URLs in a research/reference document or source comments where appropriate. Never fabricate a citation, quote, number, or NASA endorsement.
- If a value is simplified for playability, label it as a **game value** rather than a real-world engineering value.
- Avoid implying that the game is an official NASA product. It is an educational project created for the NASA Space Apps Challenge.

## Engineering and quality rules

- Inspect the existing code and project structure before editing. Reuse working code where appropriate; do not blindly overwrite files.
- Implement the actual feature, connect all relevant interactions, and handle loading, empty, error, success, and edge states.
- Keep frontend and backend contracts synchronized. If a DTO, endpoint, enum, or response changes, update both sides and tests/docs in the same task.
- Validate all untrusted request input on the backend. Never trust client-supplied resource totals or scores if the backend is responsible for calculating them.
- No secrets, credentials, personal data collection, or unnecessary analytics.
- Use semantic HTML, accessible labels, keyboard-friendly controls, visible focus states, readable contrast, and responsive layouts.
- Use clear names and small, cohesive methods/modules. Avoid duplicated business rules.
- Add/update automated tests for game rules, boundary conditions, API behavior, and regressions.
- Do not leave fake buttons, dead links, placeholder screens, debug logging, or unfinished TODOs in the user experience.
- Do not claim a test/build passed unless it was actually run. If an environment limitation blocks a check, state it clearly.
- Before finishing, run the available relevant tests/builds, inspect the diff, and fix issues introduced by the change.

## Solo workflow for Codex

- Work directly on the existing `main` branch. Do not create feature branches or Pull Requests unless the owner explicitly asks.
- Do not require teammate approvals, reviews, issue numbers, or manual confirmation for ordinary implementation details.
- Work autonomously through inspection, implementation, integration, tests, and documentation.
- Make reasonable low-risk decisions without repeatedly asking the owner. Ask only when a genuinely blocking product decision cannot be resolved from these rules or reliable evidence.
- Never discard unrelated existing work or run destructive Git commands without explicit permission.
- Keep commits focused and use a descriptive commit message if committing is part of the requested task.

## Completion checklist

- The requested behavior works end-to-end.
- Four-day mission logic is consistent and reset-only (no saved progress).
- No account or persistence features were introduced.
- Frontend and backend agree on any API contract.
- Scientific claims are sourced and game abstractions are labelled.
- Tests/build checks were run where possible and their actual outcomes reported.
- Documentation reflects the implemented behavior.
