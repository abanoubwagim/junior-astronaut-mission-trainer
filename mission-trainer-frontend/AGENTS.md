# Frontend Instructions — MoonBase: 4 Days to Survive

Read the root `CONTRIBUTING.md` first. These instructions apply to everything inside `mission-trainer-frontend/`. The root file is the source of truth for product decisions and the canonical API contract.

## Stack and structure

- Use plain **HTML, CSS, and vanilla JavaScript**. Do not introduce React, Angular, TypeScript, a bundler, or another framework unless the project owner explicitly approves it.
- Respect the existing folders: `html/` for page markup, `css/` for styles, `js/` for behavior, and `assets/` for local visual assets. You may add well-named files/folders when useful.
- Inspect the existing files before deciding whether to extend or replace them. Keep the project easy to run and explain how to launch it locally.
- Keep the interface and all player-facing text in English. Code comments and developer documentation may be English.

## Player flow and required screens

Build a connected experience, not isolated mockups. Include the following flows as appropriate to the finished design:

1. **Welcome / Start:** explain the premise in a few child-friendly sentences and provide a clear Start Mission action.
2. **Mission briefing / preparation:** explain the objective, controls, resources, and the fact that the player will make decisions across four days.
3. **Mission gameplay:** show the current day, event/situation, concise science context, available choices, current resource indicators, and a clear way to submit a choice.
4. **Decision feedback / next day:** explain what changed, why it changed, and proceed to the next day without losing the current in-memory state.
5. **Mission result:** after Day 4 or a defined terminal failure condition, summarize the outcome, important choices, resource changes, and learning takeaways. Provide a clear option to start a completely new mission.

Do **not** build Sign In, Register, account/profile, Continue Mission, saved reports, or mission history. Do not suggest progress will be saved.

## Session and reset behavior

- Keep the frontend's current decision history and display state in JavaScript runtime memory only.
- Never use `localStorage`, `sessionStorage`, IndexedDB, cookies, URL state, or any persistence mechanism for mission state/results.
- A page refresh, tab close, or return to the site must begin a new mission at Day 1.
- A “Start New Mission” action from the result screen must clear the decision history, resource display, selected choice, feedback, loading/error flags, and ending state, then call the backend mission-start endpoint.
- Do not assume the backend stores sessions or player identities. The backend must remain stateless between requests.
- Do not create, store, or send Signed State Tokens, JWTs, HMAC tokens, or other gameplay state tokens.

## UI/UX direction

- Create a polished lunar-base atmosphere that feels adventurous, optimistic, and safe for children approximately ages 8–12.
- Use a consistent space palette (deep-space navy, moon/steel neutrals, bright cyan or blue accents, and a restrained warm accent for warnings). Establish CSS variables rather than scattering color values.
- Use a readable type scale, generous spacing, obvious primary actions, and clear visual hierarchy. Avoid excessive tiny text, cluttered dashboards, or dense technical paragraphs.
- Resource meters must have text labels and accessible values; never communicate a critical state through color alone.
- Use friendly icons/illustrations and subtle transitions where they improve comprehension. Prefer local assets or CSS illustrations; do not depend on broken remote image URLs.
- Make the game responsive on desktop, tablet, and mobile. No horizontal overflow at common viewport sizes.
- Support keyboard navigation, visible focus, semantic headings, accessible button names, appropriate contrast, and reduced-motion preferences.
- Use concise, plain English. Explain scientific terms in context rather than assuming children know them.
- Keep animations purposeful and short. Respect `prefers-reduced-motion`.

## Frontend architecture

- Separate rendering, in-memory state management, and API calls rather than putting all behavior into one giant script.
- Keep one clear source of truth for the server-returned mission state and the ordered decision history. Do not independently calculate resource changes, outcomes, event effects, day transitions, or win/failure conditions in JavaScript.
- The frontend may validate basic UI conditions for usability, but the backend is authoritative and must validate every submitted choice and sequence.
- Define the API base URL in one configurable place. Never embed credentials or secrets in frontend code.
- Prevent double-submission while a decision is being processed.
- Build a candidate copy of the ordered decision history when the player submits a choice. Send that candidate to the backend, and only commit it to the frontend's in-memory state after a successful, valid response. If the request fails, preserve the previous state and allow a retry without accidentally appending the choice twice.
- Do not send resource totals, calculated effects, scores, or outcomes as authoritative input. Send only the ordered decisions required by the API.
- Use safe DOM APIs and avoid injecting untrusted text through `innerHTML`.
- Handle unavailable backend/API responses with a clear recoverable message. Do not show success or advance the visible day if a request failed.

## Canonical API integration

Follow the exact contract documented in root `CONTRIBUTING.md` and the backend API documentation. If the contract must change, update frontend, backend, tests, and documentation together.

### Start a mission

- Call `POST /api/v1/missions/start` with no request body.
- Use the returned authoritative initial state, Day 1 event, resource values, and available choices.
- Initialize the in-memory decision history to an empty list.

### Submit a decision

- Call `POST /api/v1/missions/decisions`.
- Send the **complete ordered decision history**, including the new choice, using the agreed JSON shape:

```json
{
  "decisions": [
    { "day": 1, "choiceId": "example-choice-id" }
  ]
}
```

- The list starts at Day 1 and contains one valid decision for each resolved day, in order. The backend replays it from the canonical initial state and returns the authoritative result.
- On success, replace the displayed mission state with the returned state and commit the candidate decision history in memory.
- On error, keep the previous displayed state and decision history. Show a helpful message and permit retry.
- Use the response's latest decision feedback, resource changes, next-day event/choices, or terminal result. Do not calculate these independently.
- Do not call an endpoint to fetch or resume a current mission; no current mission is stored on the server.

### Errors and loading

- Handle JSON API errors consistently with the backend error contract.
- Disable decision controls during a request and restore them safely on recoverable failure.
- Avoid duplicate submissions and accidental double advancement.

## Verification before finishing

- Test the welcome-to-briefing-to-four-days-to-result flow, including any terminal failure path.
- Test that every choice produces a visible server-derived consequence and that the next day uses the updated server-returned state.
- Test starting a new mission resets every gameplay value and sends a fresh start request.
- Refresh mid-mission and confirm the game starts from Day 1; confirm no browser storage is used for progress.
- Test invalid/unavailable choices, API errors, retry behavior, and duplicate-click prevention.
- Test mobile layout, keyboard interaction, and basic accessibility.
- Run available checks and report the actual result. Fix broken controls, console errors, dead links, and layout issues before declaring completion.
