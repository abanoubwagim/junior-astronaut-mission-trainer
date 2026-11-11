# MoonBase 3D story architecture

MoonBase now treats the Three.js Moon world as the default gameplay surface.
The Mars profile remains available as an explicit destination. HTML
remains only for readable dialogue/subtitles, compact resource HUD, choice
controls, feedback, and keyboard/accessibility support.

## Runtime flow

1. `app.js` owns the in-memory screen, authoritative mission response, selected choice, and ordered decision history.
2. `scene-manager.js` owns WebGL setup, the render loop, context-loss fallback, and scene lifecycle.
3. `mars-environment.js` builds the displaced Martian terrain, regolith, craters, dunes, layered horizon, Mars base, solar array, water/grow/weather stations, beacons, dust, and storm visuals. `lunar-environment.js` remains the legacy comparison profile.
4. `camera-controller.js` transitions the camera between the base, solar, water, grow, and storm locations.
5. `story-director.js` synchronizes the current app screen, mission day, selected choice, and backend feedback with the characters, location, camera, and environment.
6. `player-controller.js` owns WASD movement, acceleration/deceleration, ground/gravity handling, collision resolution, proximity/raycast interaction, and pointer-lock state.
7. `astronaut-character.js` loads the bundled licensed animated GLB/glTF with `GLTFLoader` and maps its available clips to mission actions; the articulated procedural rig is only an explicitly reported loading/error fallback.

There is no audio, voice acting, speech synthesis, persistence, authentication, or second rules engine.

## Backend boundary

The existing `POST /api/v1/missions/start` and `POST /api/v1/missions/decisions` contract is unchanged. The story layer never calculates resources, delayed effects, terminal states, or choice validity. It only presents server-returned data and animates the corresponding world state.

## Character asset status

The character loader accepts `window.MOONBASE_ASTRONAUT_ASSET_URL` for a local or deployed GLB/glTF asset. By default it loads `assets/models/astronaut-in-spacesuit-rigged.glb`, whose source and CC0 terms are documented beside the model. It does not silently substitute the Three.js Soldier sample. Clip names are matched by action family (`Idle`, `Walk`, `Talk`, `Point`, `React`, `Celebrate`, and `Disappointed`); an asset with fewer clips safely reuses its closest available animation.

## Mars terrain status

`mars-environment.js` generates a deterministic displaced 176×176 Martian
surface with multi-scale relief, actual crater depressions/rims, dune patches,
embedded angular rocks, distant layered mesas, a dusty sky/fog profile, and
Mars-specific lighting. The environment exposes `getTerrainHeight(x, z)` to the
player and camera controllers. It is an educational visual simulation informed
by the NASA/USGS references in `mission-trainer-frontend/assets/STORY_ASSETS.md`,
not an exact DEM-backed survey of a named landing site.

## Lunar terrain status (legacy comparison world)

`lunar-environment.js` generates a deterministic displaced 192×192 surface with
multi-scale highlands and varied crater profiles. Crater depressions and raised
rims are part of the terrain vertices; the old decorative crater bowls/rings are
not used. The environment exposes `getTerrainHeight(x, z)`, which is consumed by
the player and camera controllers. This is a visual lunar simulation informed by
NASA's LRO/LOLA topography references, not an exact DEM-backed survey of a named
site. The relevant references are linked in `mission-trainer-frontend/assets/STORY_ASSETS.md`.

## Verification paths

- Success path: clean solar array → service water recycler → start grow tray → full storm shelter.
- Failure path: connect spare battery → service water recycler → open meal crate → passive storm shelter without earlier preparation.
- The historical frontend test file is not present in the current worktree, so JavaScript syntax and browser flow checks are the available frontend validation paths.
