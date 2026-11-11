# MoonBase 3D story assets

The story build uses the local rigged astronaut in `assets/models/astronaut-in-spacesuit-rigged.glb` as the playable MoonBase EVA character. It has a full-body articulated rig, textured pressure suit, reflective visor, life-support backpack, joints, gloves, and boots. Its native `walk` and `run` clips drive locomotion through `THREE.AnimationMixer`; missing presentation states use named skeleton-bone poses. A procedural articulated EVA rig remains only as an explicitly reported temporary loading/error fallback.

The same `moonbase-cadet-01` identity is used for every environment. Front three-quarter, back, side, and gameplay views are produced by the existing story/game cameras from the same model; no static character illustration is substituted for the playable protagonist. A different local licensed GLB/glTF may still be supplied explicitly through `window.MOONBASE_ASTRONAUT_ASSET_URL` for a future production art pass, but the game does not silently load a generic remote character.

There is no audio or voice layer.

The integration seam is the `createAstronautCharacter` return contract (`setAction`, `moveTo`, `update`, `dispose`) used by `story-director.js`; no game rules or API code needs to change.

## Mars terrain

The Moon is the default playable environment. Mars remains available through
explicit world selection. `mars-environment.js` generates a
deterministic, visually inspired Martian surface rather than recolouring the
old lunar plane. A displaced 176×176 terrain grid combines broad relief,
eroded ridges, irregular impact depressions, raised rims, wind-shaped dune
fields, level habitat pads, and a shared terrain-height query. It is paired
with varied embedded boulders, angular fragments, layered distant mesas,
rust/brown regolith, thin dusty atmospheric perspective, warm directional
sunlight, and restrained near-ground dust.

The same `getTerrainHeight(x, z)` contract is consumed by the player and
third-person camera controllers, so the astronaut follows the generated
surface while the existing mission gates and station locations remain intact.

This is a visually inspired Mars simulation, not a scientifically exact DEM or
a claim that the scene depicts a named Jezero/Gale coordinate. Its visual
references are public NASA and USGS rover imagery and geological context:

- https://science.nasa.gov/resource/detailed-panorama-of-mars-jezero-crater-delta/
- https://science.nasa.gov/photojournal/galleries/pj-mars/
- https://mars.nasa.gov/mars2020/multimedia/raw-images/
- https://www.usgs.gov/media/images/jezero-crater-mars-0

No Earth, starfield, live Mars telemetry, or permanent heavy fog is used in the
Mars profile. Phobos/Deimos are not represented as large gameplay objects; a
small distant Martian moon is only a visual scale cue.

## Lunar terrain (legacy comparison world)

The Moon environment uses a deterministic procedural height field rather than a
flat plane or a static background. Broad multi-scale relief, irregular crater
floors, sloped crater walls, raised rims, ejecta falloff, level habitat pads,
and embedded rock placement all feed the same `groundHeight(x, z)` query. The
terrain mesh is a 192×192 displaced grid; `getTerrainHeight(x, z)` is shared by
the player and third-person camera controllers so movement and camera collision
follow the generated surface.

This is a visually inspired lunar simulation, not a surveyed reconstruction of a
specific landing site and it does not claim to use live NASA telemetry or a NASA
DEM. The design is informed by NASA descriptions of cratered regolith and LRO's
LOLA topography work:

- https://science.nasa.gov/moon/facts/
- https://science.nasa.gov/mission/lro/lola/
- https://science.nasa.gov/mission/lro/spacecraft-and-instruments/

The base, habitat modules, solar array, rover, recycler, grow tray, communication dish, shelter, dust, leaks, and storm effects are generated from low-poly Three.js primitives. They are gameplay scene objects, not final production art assets.
