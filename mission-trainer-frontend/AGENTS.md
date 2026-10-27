# Frontend Instructions — MoonBase: 4 Days to Survive

Read the root `CONTRIBUTING.md` first. These instructions apply to everything inside `mission-trainer-frontend/`.

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
5. **Mission result:** after Day 4, summarize the outcome, important choices, resource changes, and one or more learning takeaways. Provide a clear option to start a completely new mission.

Do **not** build Sign In, Register, account/profile, Continue Mission, saved reports, or mission history. Do not suggest progress will be saved.

## Session and reset behavior

- Keep all mission state in JavaScript runtime memory only.
- Never use `localStorage`, `sessionStorage`, IndexedDB, cookies, a service worker cache for game state, or any persistence mechanism for mission state/results.
- A page refresh, tab close, or return to the site must begin a new mission at Day 1.
- A “Start New Mission” action from the result screen must initialize all game values, day index, choice history, feedback, and ending state from scratch.
- Do not rely on the backend to store sessions, player identities, progress, scores, or reports.
- If the backend provides stateless content or rule-validation endpoints, use the agreed API contract. The frontend must remain clear about errors and must not silently invent server responses.

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

- Separate rendering, game-state transitions, and API calls rather than putting all behavior into one giant script.
- Keep a single clear source of truth for current day, resource values, selected choice, event state, and decision history.
- Define resource bounds and choice effects centrally; do not duplicate balancing numbers across HTML and multiple scripts.
- Prevent double-submission while a decision is being processed.
- Validate state transitions: a day cannot be submitted twice, days advance in order, and the result screen appears only after the final day or a defined terminal condition.
- Use safe DOM APIs and avoid injecting untrusted text through `innerHTML`.
- Handle unavailable backend/API responses with a clear recoverable message. Do not show success if a request failed.
- Keep endpoint base URLs configurable in one place. Never embed credentials or secrets in frontend code.

## API coordination

Before consuming or changing an endpoint, inspect the backend and its `AGENTS.md`. Keep request/response shapes, enum values, and error handling aligned with the backend. If the frontend needs a contract change, update both sides in the same implementation and add tests where possible. Do not add endpoints merely to move simple client-only presentation logic to the server.

## Verification before finishing

- Test the welcome-to-briefing-to-four-days-to-result flow.
- Test that every choice produces a visible consequence and that the next day uses the updated state.
- Test starting a new mission resets every gameplay value.
- Refresh mid-mission and confirm the game starts from Day 1; confirm no browser storage is used for progress.
- Test mobile layout, keyboard interaction, and basic accessibility.
- Run available checks and report the actual result. Fix broken controls, console errors, dead links, and layout issues before declaring completion.
