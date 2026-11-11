# NASA Science References

MoonBase is an independent educational project inspired by NASA science. NASA
has not endorsed or validated the game. The fictional base, array condition,
qualitative power states, choice effects, and persistent effects are game
mechanics, not NASA measurements or operational procedures.

## Sources used by the Day 1 mission

| Reference | How it is used |
|---|---|
| [NASA — The Lunar South Pole Region](https://www.nasa.gov/reference/moonbase-environment/) | Context for the unusual lighting conditions near the lunar South Pole. |
| [NASA Science — Shadows near the Moon's South Pole](https://science.nasa.gov/resource/shadows-near-the-moons-south-pole/) | Supports the explanation that rugged terrain can create long shadows and change illumination. |
| [NASA — Moon Base Systems](https://www.nasa.gov/moonbase-systems/) | Background for discussing lunar-base power systems. |
| [NASA — Lunar Surface Technology](https://www.nasa.gov/lunar-surface-technology/) | Background for lunar surface infrastructure and technology concepts. |
| [NASA TechPort — Vertical Solar Array Technology](https://techport.nasa.gov/projects/116305) | Inspires the VSAT preparation choice. The game does not claim a VSAT system is deployed or operational on the Moon. |
| [NASA — Moon Base awards and miniCAST announcement](https://www.nasa.gov/news-release/nasa-awards-moon-base-transportation-technology-science-projects/) | Context only. The announcement describes purchasing and assembling components; MoonBase does not represent miniCAST as existing lunar equipment. |

## Sources used by the Day 2 mission

| Reference | How it is used |
|---|---|
| [NASA — Environmental Control and Life Support Systems (ECLSS)](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/) | Supports the distinction between the Water Recovery System, Air Revitalization System, and Oxygen Generation System. NASA states that recovered water must meet purity standards and that unacceptable water is reprocessed while clean water goes to storage. |
| [NASA — Life Support Subsystems](https://www.nasa.gov/reference/jsc-life-support-subsystems/) | Supports the educational explanation that water recovery, monitoring, distribution, and storage are distinct life-support engineering concerns. |
| [NASA — Water Recovery Milestone on the International Space Station](https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/) | Context for real ISS water-recovery technology and NASA's 2023 98% recovery milestone. This is specific to the ISS system and is not used as a lunar-base rate or game value. |
| [NASA — Moon Base Systems](https://www.nasa.gov/moonbase-systems/) | Background for fictional lunar habitat and power-system context. It does not provide telemetry or a numerical water value for this game. |

## Scientific explanation shown in the game

“Near the Moon's South Pole, the Sun stays close to the horizon. Hills and
mountains can cast long shadows across the surface. These shadows can reduce
the sunlight reaching solar equipment.”

The fictional scenario applies that relationship to a made-up solar-array
station. It does not report a NASA power measurement, exact coordinate,
percentage, watt value, shadow duration, or engineering performance figure.

## Boundaries

- The array is intentionally shown as intact; the event is terrain shadow.
- NASA-documented VSAT prototype work is not the same as a deployed lunar
  system. The player choice records preparation only.
- `backupReserve`, `powerDemand`, `powerAllocation`, and `verticalArrayStatus`
  are qualitative game state.
- The game does not model dust, battery capacity, solar storms, or live NASA
  telemetry in Day 1.

## Day 2 scientific boundaries

- The Day 2 water-quality reading is a fictional educational mission event, not
  a real NASA incident, lunar-base event, or live NASA telemetry.
- “Unacceptable” means the recovered water is not approved for potable use yet;
  it does not mean contamination has been confirmed.
- The recovered water is kept isolated until quality verification passes. The
  game never automatically marks reprocessing as successful.
- The water-recovery alert does not mean the complete ECLSS has failed. Air
  revitalization and oxygen generation are separate subsystems, and crew life
  support remains operational in the scenario.
- The 98% recovery milestone is an ISS result and is not a predicted or
  required performance value for a future lunar base.
- Day 2 choices and persistent state identifiers are fictional game mechanics,
  not NASA operational procedures, measurements, capacities, durations, or
  performance guarantees.

## Sources used by the Day 3 mission

| Reference | How it is used |
|---|---|
| [NASA Science — Veggie](https://science.nasa.gov/mission/veggie/) | Supports the educational context that NASA has researched growing plants in space. Veggie is an ISS research system, not an operational lunar farm. |
| [NASA — Growing Plants in Space](https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/) | Supports the explanation that controlled plant growth can contribute to crew food research while requiring suitable conditions and time. |
| [NASA Science — Advanced Plant Habitat](https://science.nasa.gov/mission/advanced-plant-habitat/) | Supports the controlled-environment context for light, water, nutrients, and monitoring. The APH is an ISS research facility and does not provide a lunar crop yield or game rate. |
| [NASA Science — Space Crop Production](https://science.nasa.gov/biological-physical/space-crops/) | Provides NASA background for space-crop research and the challenges of producing food beyond Earth. |
| [NASA Science — International Partners Advance Work on Space Crops](https://science.nasa.gov/science-research/biological-physical-sciences/nasa-international-partners-advance-work-on-space-crops/) | Supports the distinction between ongoing research and future lunar agriculture. |

## Day 3 scientific boundaries

- `FOOD SUPPLY WARNING` is a fictional educational mission event, not live
  NASA telemetry, a NASA incident, crop disease, or a crop-unit failure.
- The system report uses qualitative game states only: stored food is `LOW`,
  the crop unit is `AVAILABLE`, and crop growth is `NOT_HARVEST_READY`.
- Plants need suitable light, water, nutrients, and monitoring. The game does
  not use NASA sources to derive food quantities, crop yields, growth rates,
  power consumption, water consumption, or harvest durations.
- Veggie and Advanced Plant Habitat are ISS research systems, not operational
  lunar farms. Their existence supports the science explanation, not a claim
  that a MoonBase crop system is already validated.
- The backend accepts a risky crop-production decision even when qualitative
  power or approved-water constraints are present. It reports the constraint
  deterministically and never silently changes the player's choice.
- Recovered water pending verification remains isolated. It is never used for
  crop production, even when the player chooses expansion.
- No Day 3 choice provides an immediate meal. The returned `CROP_GROWTH`
  state remains `NOT_HARVEST_READY`, and the Day 3 state is preserved for a
  Day 4 emergency response.

## Day 4 — simulated emergency boundaries

Day 4 displays `SOLAR RADIATION ALERT` and the exact notice: “This is a
simulated mission event, not live NASA telemetry.” The alert is not a NASA
warning, a telemetry feed, or evidence that a real lunar base has received a
solar-particle-event alert.

The Storm Shelter and its fixed primary shielding are fictional game elements.
Supplementary water or packaged-food positioning is a qualitative gameplay
choice. The implementation does not calculate radiation dose, exposure,
shielding effectiveness, shielding percentage, shielding thickness, material
quantity, event duration, power consumption, or a scientifically validated
safety threshold. It also does not classify the mission as success or failure.

Day 4 inherits the actual ordered Day 1–Day 3 decisions. Water that is
`REPROCESSING_PENDING_VERIFICATION` remains isolated and cannot be used for
shielding. Approved-water availability is kept separate from isolated recovered
water, and reduced potable reserve or active conservation is shown as a
qualitative constraint. Day 3 crops remain immature and are never treated as
ready-to-eat emergency food.

The project owner expects additional NASA data on November 13, 2026. That data
has not been reviewed here. No Day 4 scientific threshold or mission outcome
rule is finalized before that review.
