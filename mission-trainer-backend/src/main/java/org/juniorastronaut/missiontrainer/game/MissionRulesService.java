package org.juniorastronaut.missiontrainer.game;

import org.juniorastronaut.missiontrainer.api.MissionDtos.ActiveEffect;
import org.juniorastronaut.missiontrainer.api.MissionDtos.Choice;
import org.juniorastronaut.missiontrainer.api.MissionDtos.DecisionFeedback;
import org.juniorastronaut.missiontrainer.api.MissionDtos.DecisionHistoryRequest;
import org.juniorastronaut.missiontrainer.api.MissionDtos.DecisionInput;
import org.juniorastronaut.missiontrainer.api.MissionDtos.Event;
import org.juniorastronaut.missiontrainer.api.MissionDtos.InspectionReport;
import org.juniorastronaut.missiontrainer.api.MissionDtos.MissionResponse;
import org.juniorastronaut.missiontrainer.api.MissionDtos.MissionResult;
import org.juniorastronaut.missiontrainer.api.MissionDtos.QualitativeState;
import org.juniorastronaut.missiontrainer.api.MissionDtos.ResolvedChoice;
import org.juniorastronaut.missiontrainer.api.MissionDtos.ScienceSource;
import org.juniorastronaut.missiontrainer.api.MissionDtos.SystemStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MissionRulesService {
    private static final int DAY_ONE = 1;
    private static final int DAY_TWO = 2;
    private static final int DAY_THREE = 3;
    private static final int DAY_FOUR = 4;
    private static final int TOTAL_DAYS = 4;
    private static final String ACTIVE = "ACTIVE";
    private static final String DAY_TWO_COMPLETE = "DAY_2_COMPLETE";
    private static final String DAY_THREE_COMPLETE = "DAY_3_COMPLETE";
    private static final String DAY_FOUR_COMPLETE = "DAY_4_COMPLETE";
    private static final String VALUE_ORIGIN = "GAME_SCENARIO";

    private static final String SOLAR_INPUT_REDUCED = "REDUCED";
    private static final String ARRAY_INTACT = "NO_VISIBLE_DAMAGE";
    private static final String BACKUP_AVAILABLE = "AVAILABLE";
    private static final String BACKUP_IN_USE = "IN_USE";
    private static final String BACKUP_UNCHANGED = "UNCHANGED";
    private static final String POWER_DEMAND_NORMAL = "NORMAL";
    private static final String POWER_DEMAND_REDUCED = "REDUCED";
    private static final String POWER_ALLOCATION_PENDING = "PENDING";
    private static final String STORED_ENERGY_SUPPORT = "STORED_ENERGY_SUPPORT";
    private static final String ESSENTIAL_OPERATIONS_PRIORITY = "ESSENTIAL_OPERATIONS_PRIORITY";
    private static final String VSAT_PREPARATION = "DEPLOYMENT_PREPARATION";
    private static final String VSAT_NOT_STARTED = "NOT_STARTED";
    private static final String DATA_STATUS = "EDUCATIONAL_SCENARIO";

    private static final String WATER_RECOVERY_RESTRICTED = "WATER_RECOVERY_RESTRICTED";
    private static final String POTABLE_SUPPLY_AVAILABLE = "POTABLE_SUPPLY_AVAILABLE";
    private static final String WATER_QUALITY_VERIFICATION_REQUIRED = "WATER_QUALITY_VERIFICATION_REQUIRED";
    private static final String CREW_LIFE_SUPPORT_OPERATIONAL = "CREW_LIFE_SUPPORT_OPERATIONAL";
    private static final String RECOVERED_WATER_ISOLATED = "RECOVERED_WATER_ISOLATED";
    private static final String REPROCESSING_PENDING_VERIFICATION = "REPROCESSING_PENDING_VERIFICATION";
    private static final String POTABLE_RESERVE_REDUCED = "POTABLE_RESERVE_REDUCED";
    private static final String WATER_CONSERVATION_ACTIVE = "WATER_CONSERVATION_ACTIVE";
    private static final String WATER_ALERT_PENDING_DECISION = "WATER_ALERT_PENDING_DECISION";

    private static final String STORED_FOOD_LOW = "LOW";
    private static final String CROP_PRODUCTION_AVAILABLE = "AVAILABLE";
    private static final String CROP_GROWTH_NOT_HARVEST_READY = "NOT_HARVEST_READY";
    private static final String FOOD_WARNING_PENDING_DECISION = "FOOD_WARNING_PENDING_DECISION";
    private static final String LIMITED_CROP_TRIAL_STARTED = "LIMITED_CROP_TRIAL_STARTED";
    private static final String PACKAGED_FOOD_DEPENDENCY = "PACKAGED_FOOD_DEPENDENCY";
    private static final String EXPANDED_CROP_PRODUCTION = "EXPANDED_CROP_PRODUCTION";
    private static final String CROP_OPERATION_NOT_STARTED = "NO_NEW_CROP_CYCLE_STARTED";
    private static final String CROP_OPERATION_LIMITED = "LIMITED_OPERATION_STARTED";
    private static final String CROP_OPERATION_PRESERVED = "NO_NEW_CROP_CYCLE";
    private static final String CROP_OPERATION_EXPANDED = "EXPANDED_OPERATION_INITIATED";
    private static final String NO_OPERATIONAL_CONSTRAINT = "NO_OPERATIONAL_CONSTRAINT_RECORDED";
    private static final String UNVERIFIED_WATER_NOT_USED = "UNVERIFIED_WATER_NOT_USED";

    private static final String APPROVED_WATER_PENDING_VERIFICATION = "NOT_APPROVED_PENDING_VERIFICATION";
    private static final String APPROVED_WATER_POTABLE_RESERVE = "AVAILABLE_FROM_POTABLE_RESERVE";
    private static final String APPROVED_WATER_CONSERVATION = "AVAILABLE_WITH_CONSERVATION_ACTIVE";
    private static final String POWER_CONSTRAINED_BACKUP = "CONSTRAINED_BACKUP_IN_USE";
    private static final String POWER_CONSTRAINED_GENERATION = "CONSTRAINED_NO_IMMEDIATE_GENERATION";
    private static final String POWER_PRIORITIZED = "ESSENTIAL_OPERATIONS_PRIORITIZED";

    private static final String EVA_STOPPED = "STOPPED";
    private static final String CREW_LOCATION_STORM_SHELTER = "STORM_SHELTER";
    private static final String PRIMARY_SHIELDING_AVAILABLE = "AVAILABLE";
    private static final String SUPPLEMENTARY_SHIELDING_READY = "READY_FOR_RESOURCE_ALLOCATION";
    private static final String SOLAR_RADIATION_ALERT_ACTIVE = "SOLAR_RADIATION_ALERT_ACTIVE";
    private static final String WATER_SUPPLIES_POSITIONED = "WATER_SUPPLIES_POSITIONED_FOR_SHIELDING";
    private static final String WATER_SUPPLIES_UNAVAILABLE = "WATER_SUPPLIES_UNAVAILABLE";
    private static final String FOOD_SUPPLIES_POSITIONED = "FOOD_SUPPLIES_POSITIONED_FOR_SHIELDING";
    private static final String FOOD_SUPPLIES_LIMITED = "FOOD_SUPPLIES_LIMITED";
    private static final String PRIMARY_SHIELDING_MAINTAINED = "PRIMARY_SHIELDING_MAINTAINED";
    private static final String WATER_UNVERIFIED_FOR_SHIELDING = "UNVERIFIED_RECOVERED_WATER_UNAVAILABLE";
    private static final String FOOD_CROPS_NOT_AVAILABLE = "IMMATURE_CROPS_NOT_AVAILABLE";

    private static final List<Choice> DAY_ONE_CHOICES = List.of(
            new Choice(
                    "use_stored_energy",
                    "USE STORED ENERGY",
                    "Use energy stored in the backup batteries to support important base operations while solar generation is reduced.",
                    "Important systems can continue receiving support temporarily.",
                    "The backup energy reserve is being used, and the solar-generation problem remains unresolved."
            ),
            new Choice(
                    "begin_vsat_deployment",
                    "BEGIN VERTICAL SOLAR ARRAY DEPLOYMENT",
                    "Begin preparing a vertical solar-array system designed to improve access to sunlight where the Sun stays low near the horizon.",
                    "The crew begins preparing a potential longer-term power solution.",
                    "The new array does not generate power immediately. Preparation is not deployment completion, and the current reduction remains."
            ),
            new Choice(
                    "reduce_non_essential_loads",
                    "REDUCE NON-ESSENTIAL LOADS",
                    "Reduce electricity demand by pausing equipment and activities that are not essential right now.",
                    "The base reduces non-essential demand while essential operations retain priority.",
                    "Optional activities such as research or other non-critical experiments may be delayed."
            )
    );

    private static final List<Choice> DAY_TWO_CHOICES = List.of(
            new Choice(
                    "inspect_reprocess_water",
                    "INSPECT & REPROCESS WATER",
                    "Keep the water that failed verification isolated. Inspect the recovery system and start reprocessing.",
                    "Attempts to restore the water-recovery process instead of relying entirely on the existing potable reserve.",
                    "Inspection and reprocessing require time and power. Starting reprocessing does not mean the water is immediately safe; it must remain isolated until it passes quality verification."
            ),
            new Choice(
                    "use_stored_potable_water",
                    "USE STORED POTABLE WATER",
                    "Temporarily rely on the potable water reserve that is already available. Keep the water that failed verification isolated.",
                    "Maintains access to approved potable water while the recovery process is restricted.",
                    "The available potable reserve is reduced for subsequent days, and the original recovery issue is not resolved."
            ),
            new Choice(
                    "conserve_water",
                    "CONSERVE WATER",
                    "Reduce non-essential water use and postpone optional activities that require water. Keep essential crew needs as the priority.",
                    "Slows the consumption of the available potable reserve.",
                    "The water-recovery restriction remains unresolved and optional activities are delayed. Essential drinking and hygiene needs remain protected."
            )
    );

    private static final List<Choice> DAY_THREE_CHOICES = List.of(
            new Choice(
                    "START_LIMITED_CROP_TRIAL",
                    "START A LIMITED CROP TRIAL",
                    "Start a small indoor crop-growing cycle using appropriate grow lights, approved water, nutrients, and monitoring.",
                    "Starts a limited future food-production effort with a smaller growing scope.",
                    "It needs power, approved water, nutrients, and continued care. It does not provide an immediate meal or guarantee a Day 4 harvest."
            ),
            new Choice(
                    "PRESERVE_STORED_FOOD",
                    "PRESERVE STORED FOOD",
                    "Prioritize management of the remaining ready-to-eat food, reduce avoidable waste, and postpone optional food activities where safe.",
                    "Avoids allocating additional power and water to a new crop cycle now.",
                    "No new crop production starts, so the base remains dependent on the declining stored-food supply."
            ),
            new Choice(
                    "EXPAND_CROP_PRODUCTION",
                    "EXPAND CROP PRODUCTION",
                    "Initiate a broader indoor crop-production effort intended to support a larger future food supply.",
                    "Offers a greater potential contribution to future food supply if resources and continued care are available.",
                    "It needs more power, approved water, nutrients, and monitoring than a limited trial. Resource constraints may restrict planned capacity."
            )
    );

    private static final List<Choice> DAY_FOUR_CHOICES = List.of(
            new Choice(
                    "REPOSITION_WATER_SUPPLIES",
                    "REPOSITION WATER SUPPLIES",
                    "Position suitable, approved water containers in the designated supplementary shielding locations around the crew shelter.",
                    "Uses available water mass as supplementary shielding material while retaining the shelter's primary shielding.",
                    "Positioned water becomes less accessible during the emergency, and crew water needs remain the priority."
            ),
            new Choice(
                    "REPOSITION_FOOD_SUPPLIES",
                    "REPOSITION FOOD SUPPLIES",
                    "Position available packaged food supplies in the designated supplementary shielding locations.",
                    "Uses available packaged food mass without consuming water.",
                    "Some food supplies become less accessible during the emergency. Crops that are not harvest-ready are not emergency food."
            ),
            new Choice(
                    "MAINTAIN_EXISTING_SHIELDING",
                    "MAINTAIN EXISTING SHIELDING",
                    "Keep the existing primary shelter shielding and preserve available water and food supplies for the crew.",
                    "Preserves resource accessibility and avoids repositioning supplies during the emergency.",
                    "No supplementary shielding is added."
            )
    );

    private static final List<ScienceSource> DAY_ONE_SCIENCE_SOURCES = List.of(
            new ScienceSource("NASA — The Lunar South Pole Region", "https://www.nasa.gov/reference/moonbase-environment/"),
            new ScienceSource("NASA Science — Shadows near the Moon's South Pole", "https://science.nasa.gov/resource/shadows-near-the-moons-south-pole/"),
            new ScienceSource("NASA — Moon Base Systems", "https://www.nasa.gov/moonbase-systems/"),
            new ScienceSource("NASA — Lunar Surface Technology", "https://www.nasa.gov/lunar-surface-technology/"),
            new ScienceSource("NASA TechPort — Vertical Solar Array Technology", "https://techport.nasa.gov/projects/116305"),
            new ScienceSource("NASA — Moon Base awards and miniCAST announcement", "https://www.nasa.gov/news-release/nasa-awards-moon-base-transportation-technology-science-projects/")
    );

    private static final List<ScienceSource> DAY_TWO_SCIENCE_SOURCES = List.of(
            new ScienceSource("NASA — Environmental Control and Life Support Systems (ECLSS)", "https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/"),
            new ScienceSource("NASA — Life Support Subsystems", "https://www.nasa.gov/reference/jsc-life-support-subsystems/"),
            new ScienceSource("NASA — Water Recovery Milestone on the International Space Station", "https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/"),
            new ScienceSource("NASA — Moon Base Systems", "https://www.nasa.gov/moonbase-systems/")
    );

    private static final List<SystemStatus> DAY_TWO_SYSTEM_REPORT = List.of(
            new SystemStatus("Water recovery", "RESTRICTED"),
            new SystemStatus("Potable water supply", "AVAILABLE"),
            new SystemStatus("Water quality verification", "REQUIRED"),
            new SystemStatus("Crew life support", "OPERATIONAL")
    );

    private static final List<SystemStatus> DAY_FOUR_SYSTEM_REPORT = List.of(
            new SystemStatus("EVA status", EVA_STOPPED),
            new SystemStatus("Crew location", CREW_LOCATION_STORM_SHELTER),
            new SystemStatus("Primary shielding", PRIMARY_SHIELDING_AVAILABLE),
            new SystemStatus("Supplementary shielding", SUPPLEMENTARY_SHIELDING_READY)
    );

    private static final List<ScienceSource> DAY_THREE_SCIENCE_SOURCES = List.of(
            new ScienceSource("NASA Science — Veggie", "https://science.nasa.gov/mission/veggie/"),
            new ScienceSource("NASA — Growing Plants in Space", "https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/"),
            new ScienceSource("NASA Science — Advanced Plant Habitat", "https://science.nasa.gov/mission/advanced-plant-habitat/"),
            new ScienceSource("NASA Science — Space Crop Production", "https://science.nasa.gov/biological-physical/space-crops/"),
            new ScienceSource("NASA Science — International Partners Advance Work on Space Crops", "https://science.nasa.gov/science-research/biological-physical-sciences/nasa-international-partners-advance-work-on-space-crops/")
    );

    public MissionResponse startMission() {
        return response(ACTIVE, DAY_ONE, dayOneEvent(), initialState(), List.of(), List.of(), null, null);
    }

    /** Replays the ordered history from the canonical Day 1 state. */
    public MissionResponse replay(DecisionHistoryRequest request) {
        validateHistory(request);

        DecisionInput dayOneInput = request.decisions().get(0);
        Choice dayOneChoice = dayOneChoiceFor(dayOneInput.choiceId());
        QualitativeState afterDayOne = outcomeFor(dayOneChoice.id());
        ActiveEffect dayOneEffect = effectFor(dayOneChoice.id());
        DecisionFeedback dayOneFeedback = feedbackFor(dayOneChoice.id(), dayOneChoice.title(), afterDayOne, dayOneEffect);
        ResolvedChoice dayOneResolved = new ResolvedChoice(DAY_ONE, dayOneChoice.id(), dayOneChoice.title());
        MissionResult dayOneResult = dayOneResult(dayOneResolved, dayOneFeedback, dayOneEffect);
        List<DecisionInput> history = List.copyOf(request.decisions());

        if (history.size() == 1) {
            return response(
                    ACTIVE,
                    DAY_TWO,
                    dayTwoEvent(dayOneChoice.id()),
                    dayTwoInitialState(afterDayOne),
                    history,
                    List.of(dayOneEffect),
                    dayOneFeedback,
                    dayOneResult
            );
        }

        DecisionInput dayTwoInput = history.get(1);
        Choice dayTwoChoice = dayTwoChoiceFor(dayTwoInput.choiceId());
        QualitativeState afterDayTwo = dayTwoOutcome(afterDayOne, dayTwoChoice.id());
        ActiveEffect dayTwoEffect = dayTwoEffectFor(dayTwoChoice.id());
        DecisionFeedback dayTwoFeedback = dayTwoFeedbackFor(dayTwoChoice.id(), dayTwoChoice.title(), afterDayTwo, dayTwoEffect);
        ResolvedChoice dayTwoResolved = new ResolvedChoice(DAY_TWO, dayTwoChoice.id(), dayTwoChoice.title());
        MissionResult dayTwoResult = dayTwoResult(dayTwoResolved, dayTwoFeedback, List.of(dayOneEffect, dayTwoEffect));

        if (history.size() == 2) {
            QualitativeState beforeDayThree = dayThreeInitialState(afterDayTwo);
            return response(
                    ACTIVE,
                    DAY_THREE,
                    dayThreeEvent(beforeDayThree),
                    beforeDayThree,
                    history,
                    List.of(dayOneEffect, dayTwoEffect),
                    dayTwoFeedback,
                    dayTwoResult
            );
        }

        DecisionInput dayThreeInput = history.get(2);
        Choice dayThreeChoice = dayThreeChoiceFor(dayThreeInput.choiceId());
        QualitativeState beforeDayThree = dayThreeInitialState(afterDayTwo);
        QualitativeState afterDayThree = dayThreeOutcome(beforeDayThree, dayThreeChoice.id());
        ActiveEffect dayThreeEffect = dayThreeEffectFor(dayThreeChoice.id(), afterDayThree);
        DecisionFeedback dayThreeFeedback = dayThreeFeedbackFor(dayThreeChoice.id(), dayThreeChoice.title(), afterDayThree, dayThreeEffect);
        ResolvedChoice dayThreeResolved = new ResolvedChoice(DAY_THREE, dayThreeChoice.id(), dayThreeChoice.title());
        MissionResult dayThreeResult = dayThreeResult(dayThreeResolved, dayThreeFeedback, afterDayThree,
                List.of(dayOneEffect, dayTwoEffect, dayThreeEffect));

        if (history.size() == 3) {
            QualitativeState beforeDayFour = dayFourInitialState(afterDayThree);
            return response(
                    ACTIVE,
                    DAY_FOUR,
                    dayFourEvent(beforeDayFour),
                    beforeDayFour,
                    history,
                    List.of(dayOneEffect, dayTwoEffect, dayThreeEffect),
                    dayThreeFeedback,
                    dayThreeResult
            );
        }

        DecisionInput dayFourInput = history.get(3);
        Choice dayFourChoice = dayFourChoiceFor(dayFourInput.choiceId());
        QualitativeState beforeDayFour = dayFourInitialState(afterDayThree);
        QualitativeState afterDayFour = dayFourOutcome(beforeDayFour, dayFourChoice.id());
        ActiveEffect dayFourEffect = dayFourEffectFor(dayFourChoice.id(), afterDayFour);
        DecisionFeedback dayFourFeedback = dayFourFeedbackFor(dayFourChoice.id(), dayFourChoice.title(), afterDayFour, dayFourEffect);
        ResolvedChoice dayFourResolved = new ResolvedChoice(DAY_FOUR, dayFourChoice.id(), dayFourChoice.title());
        MissionResult dayFourResult = dayFourResult(dayFourResolved, dayFourFeedback, afterDayFour,
                List.of(dayOneEffect, dayTwoEffect, dayThreeEffect, dayFourEffect));

        return response(
                DAY_FOUR_COMPLETE,
                DAY_FOUR,
                null,
                afterDayFour,
                history,
                List.of(dayOneEffect, dayTwoEffect, dayThreeEffect, dayFourEffect),
                dayFourFeedback,
                dayFourResult
        );
    }

    private void validateHistory(DecisionHistoryRequest request) {
        if (request == null || request.decisions() == null || request.decisions().isEmpty()) {
            throw new GameRequestException("EMPTY_HISTORY", "Choose a Day 1 response before confirming the decision.");
        }
        if (request.decisions().size() > 4) {
            throw new GameRequestException("DECISION_AFTER_TERMINAL_STATE", "Day 4 is complete; no later mission day is available in this build.");
        }

        DecisionInput dayOne = request.decisions().get(0);
        if (dayOne == null || dayOne.day() == null) {
            throw new GameRequestException("INVALID_DAY", "Every decision must include a mission day.");
        }
        if (dayOne.day() == DAY_TWO) {
            throw new GameRequestException("DAY_ONE_REQUIRED", "Complete the Day 1 decision before deciding the Day 2 water response.");
        }
        if (dayOne.day() != DAY_ONE) {
            throw new GameRequestException("INVALID_DAY", "The first mission decision must use day 1.");
        }
        if (dayOne.choiceId() == null || dayOne.choiceId().isBlank()) {
            throw new GameRequestException("INVALID_HISTORY", "The Day 1 decision must include a choice ID.");
        }
        dayOneChoiceFor(dayOne.choiceId());

        if (request.decisions().size() == 1) return;

        DecisionInput dayTwo = request.decisions().get(1);
        if (dayTwo == null || dayTwo.day() == null) {
            throw new GameRequestException("INVALID_DAY", "Every decision must include a mission day.");
        }
        if (dayTwo.day() == DAY_ONE) {
            throw new GameRequestException("DUPLICATE_DECISION", "Day 1 can only be resolved once.");
        }
        if (dayTwo.day() != DAY_TWO) {
            throw new GameRequestException("INCORRECT_DAY", "The second decision must use day 2.");
        }
        if (dayTwo.choiceId() == null || dayTwo.choiceId().isBlank()) {
            throw new GameRequestException("INVALID_HISTORY", "The Day 2 decision must include a choice ID.");
        }
        dayTwoChoiceFor(dayTwo.choiceId());

        if (request.decisions().size() == 2) return;

        DecisionInput dayThree = request.decisions().get(2);
        if (dayThree == null || dayThree.day() == null) {
            throw new GameRequestException("INVALID_DAY", "Every decision must include a mission day.");
        }
        if (dayThree.day() != DAY_THREE) {
            throw new GameRequestException("INCORRECT_DAY", "The third decision must use day 3.");
        }
        if (dayThree.choiceId() == null || dayThree.choiceId().isBlank()) {
            throw new GameRequestException("INVALID_HISTORY", "The Day 3 decision must include a choice ID.");
        }
        dayThreeChoiceFor(dayThree.choiceId());

        if (request.decisions().size() == 3) return;

        DecisionInput dayFour = request.decisions().get(3);
        if (dayFour == null || dayFour.day() == null) {
            throw new GameRequestException("INVALID_DAY", "Every decision must include a mission day.");
        }
        if (dayFour.day() != DAY_FOUR) {
            throw new GameRequestException("INCORRECT_DAY", "The fourth decision must use day 4.");
        }
        if (dayFour.choiceId() == null || dayFour.choiceId().isBlank()) {
            throw new GameRequestException("INVALID_HISTORY", "The Day 4 decision must include a choice ID.");
        }
        dayFourChoiceFor(dayFour.choiceId());
    }

    private Choice dayOneChoiceFor(String choiceId) {
        return choiceFor(DAY_ONE_CHOICES, choiceId, "Day 1");
    }

    private Choice dayTwoChoiceFor(String choiceId) {
        return choiceFor(DAY_TWO_CHOICES, choiceId, "Day 2");
    }

    private Choice dayThreeChoiceFor(String choiceId) {
        return choiceFor(DAY_THREE_CHOICES, choiceId, "Day 3");
    }

    private Choice dayFourChoiceFor(String choiceId) {
        return choiceFor(DAY_FOUR_CHOICES, choiceId, "Day 4");
    }

    private Choice choiceFor(List<Choice> choices, String choiceId, String dayLabel) {
        return choices.stream()
                .filter(candidate -> candidate.id().equals(choiceId))
                .findFirst()
                .orElseThrow(() -> new GameRequestException("INVALID_CHOICE", "That response is not available for " + dayLabel + "."));
    }

    private MissionResponse response(String status, int day, Event event, QualitativeState state,
                                     List<DecisionInput> history, List<ActiveEffect> effects,
                                     DecisionFeedback feedback, MissionResult result) {
        return new MissionResponse(status, day, TOTAL_DAYS, event, state,
                List.copyOf(effects), List.copyOf(history), feedback, result);
    }

    private Event dayOneEvent() {
        return new Event(
                DAY_ONE,
                "POWER DROP",
                "Solar power generation is decreasing. Your solar array inspection found no visible damage. Terrain shadows are reducing the sunlight reaching the array. Mission Control needs you to choose how the base should respond.",
                "Near the Moon's South Pole, the Sun stays close to the horizon. Hills and mountains can cast long shadows across the surface. These shadows can reduce the sunlight reaching solar equipment.",
                "TERRAIN_SHADOW",
                new InspectionReport("No visible damage detected", "Reduced", "Reduced", "Terrain shadow"),
                DAY_ONE_SCIENCE_SOURCES,
                DAY_ONE_CHOICES,
                DATA_STATUS,
                VALUE_ORIGIN
        );
    }

    private Event dayTwoEvent(String dayOneChoiceId) {
        return new Event(
                DAY_TWO,
                "WATER QUALITY ALERT",
                "The water recovery system has detected an unacceptable water-quality reading. The recovered water has been isolated from the potable water supply until it can be inspected, reprocessed, and verified.",
                "NASA describes water recovery, air revitalization, and oxygen generation as distinct life-support subsystems. In this fictional mission event, the quality reading is unacceptable, but it does not prove contamination or a broken recovery machine. The isolated water must stay out of the potable supply until verification passes.",
                "WATER_QUALITY_ALERT",
                null,
                DAY_TWO_SCIENCE_SOURCES,
                DAY_TWO_CHOICES,
                DATA_STATUS,
                VALUE_ORIGIN,
                DAY_TWO_SYSTEM_REPORT,
                dayTwoContext(dayOneChoiceId)
        );
    }

    private Event dayThreeEvent(QualitativeState state) {
        List<SystemStatus> report = List.of(
                new SystemStatus("Stored food supply", state.storedFoodSupply()),
                new SystemStatus("Crop production unit", state.cropProductionUnit()),
                new SystemStatus("Crop growth", state.cropGrowth()),
                new SystemStatus("Approved water for crops", state.approvedWaterForCrops()),
                new SystemStatus("Power availability", state.powerAvailability())
        );
        return new Event(
                DAY_THREE,
                "FOOD SUPPLY WARNING",
                "The stored ready-to-eat food supply inside the lunar habitat is running low. The crop production unit is available, but growing crops takes time and will not provide an immediate meal.",
                "Plants in space need appropriate light, water, nutrients, and monitoring. NASA's Veggie and Advanced Plant Habitat are ISS research systems, not operational lunar farms. This fictional event uses qualitative states and does not claim a crop will be harvest-ready in one mission round.",
                "FOOD_SUPPLY_WARNING",
                null,
                DAY_THREE_SCIENCE_SOURCES,
                DAY_THREE_CHOICES,
                DATA_STATUS,
                VALUE_ORIGIN,
                report,
                dayThreeContext(state)
        );
    }

    private Event dayFourEvent(QualitativeState state) {
        return new Event(
                DAY_FOUR,
                "SOLAR RADIATION ALERT",
                "A solar particle event warning has been received. The crew must stop all external activity and move to the designated storm shelter.",
                "This is a simulated mission event, not live NASA telemetry. The existing Storm Shelter has fixed primary shielding. The game does not calculate radiation dose, shielding effectiveness, exposure duration, or a scientific safety threshold.",
                "SOLAR_RADIATION_ALERT",
                null,
                List.of(),
                DAY_FOUR_CHOICES,
                "EDUCATIONAL_SCENARIO_PENDING_SCIENCE_REVIEW",
                VALUE_ORIGIN,
                DAY_FOUR_SYSTEM_REPORT,
                dayFourContext(state)
        );
    }

    private String dayThreeContext(QualitativeState state) {
        return "Day 1 power state: " + state.powerAvailability()
                + ". Day 2 water state for crops: " + state.approvedWaterForCrops()
                + ". Any unverified recovered water remains isolated and unavailable for crop production.";
    }

    private String dayFourContext(QualitativeState state) {
        return "Day 1 power state: " + state.powerAvailability()
                + ". Day 2 water state: " + state.dayTwoPersistentState()
                + ". Day 3 food state: " + state.dayThreePersistentState()
                + ". Crops remain " + state.cropGrowth()
                + "; no harvest is assumed. " + state.dayFourOperationalConstraint()
                + " This is a simulated mission event, not live NASA telemetry.";
    }

    private String dayTwoContext(String dayOneChoiceId) {
        return switch (dayOneChoiceId) {
            case "use_stored_energy" -> "Day 1 used stored energy. Energy management is more constrained while the crew inspects and reprocesses water; no battery amount or operating time is assumed.";
            case "begin_vsat_deployment" -> "Day 1 began vertical solar-array deployment preparation. Preparation is still ongoing and has not increased solar power generation.";
            case "reduce_non_essential_loads" -> "Day 1 reduced non-essential electrical loads. Essential systems remain prioritized while the water system is inspected.";
            default -> "Day 1 state is carried forward by the mission rules.";
        };
    }

    private QualitativeState initialState() {
        return new QualitativeState(SOLAR_INPUT_REDUCED, ARRAY_INTACT, "REDUCED", "TERRAIN_SHADOW",
                BACKUP_AVAILABLE, POWER_DEMAND_NORMAL, POWER_ALLOCATION_PENDING, VSAT_NOT_STARTED,
                DATA_STATUS, VALUE_ORIGIN);
    }

    private QualitativeState outcomeFor(String choiceId) {
        return switch (choiceId) {
            case "use_stored_energy" -> new QualitativeState(SOLAR_INPUT_REDUCED, ARRAY_INTACT, "REDUCED", "TERRAIN_SHADOW", BACKUP_IN_USE, POWER_DEMAND_NORMAL, STORED_ENERGY_SUPPORT, VSAT_NOT_STARTED, DATA_STATUS, VALUE_ORIGIN);
            case "begin_vsat_deployment" -> new QualitativeState(SOLAR_INPUT_REDUCED, ARRAY_INTACT, "REDUCED", "TERRAIN_SHADOW", BACKUP_UNCHANGED, POWER_DEMAND_NORMAL, POWER_ALLOCATION_PENDING, VSAT_PREPARATION, DATA_STATUS, VALUE_ORIGIN);
            case "reduce_non_essential_loads" -> new QualitativeState(SOLAR_INPUT_REDUCED, ARRAY_INTACT, "REDUCED", "TERRAIN_SHADOW", BACKUP_UNCHANGED, POWER_DEMAND_REDUCED, ESSENTIAL_OPERATIONS_PRIORITY, VSAT_NOT_STARTED, DATA_STATUS, VALUE_ORIGIN);
            default -> throw new IllegalArgumentException("Unknown Day 1 choice: " + choiceId);
        };
    }

    private QualitativeState dayTwoInitialState(QualitativeState dayOneState) {
        return withWaterState(dayOneState, WATER_ALERT_PENDING_DECISION);
    }

    private QualitativeState dayTwoOutcome(QualitativeState dayOneState, String choiceId) {
        String persistentState = switch (choiceId) {
            case "inspect_reprocess_water" -> REPROCESSING_PENDING_VERIFICATION;
            case "use_stored_potable_water" -> POTABLE_RESERVE_REDUCED;
            case "conserve_water" -> WATER_CONSERVATION_ACTIVE;
            default -> throw new IllegalArgumentException("Unknown Day 2 choice: " + choiceId);
        };
        return withWaterState(dayOneState, persistentState);
    }

    private QualitativeState withWaterState(QualitativeState state, String persistentState) {
        return new QualitativeState(state.solarInput(), state.arrayCondition(), state.sunlightExposure(),
                state.eventCause(), state.backupReserve(), state.powerDemand(), state.powerAllocation(),
                state.verticalArrayStatus(), state.dataStatus(), state.valueOrigin(),
                WATER_RECOVERY_RESTRICTED, POTABLE_SUPPLY_AVAILABLE, WATER_QUALITY_VERIFICATION_REQUIRED,
                CREW_LIFE_SUPPORT_OPERATIONAL, RECOVERED_WATER_ISOLATED, persistentState,
                state.storedFoodSupply(), state.cropProductionUnit(), state.cropGrowth(),
                state.approvedWaterForCrops(), state.powerAvailability(), state.dayThreePersistentState(),
                state.cropOperationStatus(), state.cropOperationalConstraint());
    }

    private QualitativeState dayThreeInitialState(QualitativeState state) {
        String approvedWater = switch (state.dayTwoPersistentState()) {
            case REPROCESSING_PENDING_VERIFICATION -> APPROVED_WATER_PENDING_VERIFICATION;
            case POTABLE_RESERVE_REDUCED -> APPROVED_WATER_POTABLE_RESERVE;
            case WATER_CONSERVATION_ACTIVE -> APPROVED_WATER_CONSERVATION;
            default -> "NOT_REPORTED";
        };
        String powerAvailability = switch (state.backupReserve()) {
            case BACKUP_IN_USE -> POWER_CONSTRAINED_BACKUP;
            case BACKUP_UNCHANGED -> powerAvailabilityFor(state);
            default -> "NOT_REPORTED";
        };
        return new QualitativeState(
                state.solarInput(), state.arrayCondition(), state.sunlightExposure(), state.eventCause(),
                state.backupReserve(), state.powerDemand(), state.powerAllocation(), state.verticalArrayStatus(),
                state.dataStatus(), state.valueOrigin(), state.waterRecoveryStatus(), state.potableWaterSupply(),
                state.waterQualityVerification(), state.crewLifeSupport(), state.recoveredWaterDisposition(),
                state.dayTwoPersistentState(), STORED_FOOD_LOW, CROP_PRODUCTION_AVAILABLE,
                CROP_GROWTH_NOT_HARVEST_READY, approvedWater, powerAvailability,
                FOOD_WARNING_PENDING_DECISION, CROP_OPERATION_NOT_STARTED, NO_OPERATIONAL_CONSTRAINT);
    }

    private String powerAvailabilityFor(QualitativeState state) {
        if (VSAT_PREPARATION.equals(state.verticalArrayStatus())) return POWER_CONSTRAINED_GENERATION;
        if (POWER_DEMAND_REDUCED.equals(state.powerDemand())) return POWER_PRIORITIZED;
        return POWER_CONSTRAINED_GENERATION;
    }

    private QualitativeState dayThreeOutcome(QualitativeState state, String choiceId) {
        String persistentState = switch (choiceId) {
            case "START_LIMITED_CROP_TRIAL" -> LIMITED_CROP_TRIAL_STARTED;
            case "PRESERVE_STORED_FOOD" -> PACKAGED_FOOD_DEPENDENCY;
            case "EXPAND_CROP_PRODUCTION" -> EXPANDED_CROP_PRODUCTION;
            default -> throw new IllegalArgumentException("Unknown Day 3 choice: " + choiceId);
        };
        String operation = switch (choiceId) {
            case "START_LIMITED_CROP_TRIAL" -> CROP_OPERATION_LIMITED;
            case "PRESERVE_STORED_FOOD" -> CROP_OPERATION_PRESERVED;
            case "EXPAND_CROP_PRODUCTION" -> CROP_OPERATION_EXPANDED;
            default -> throw new IllegalArgumentException("Unknown Day 3 choice: " + choiceId);
        };
        return new QualitativeState(
                state.solarInput(), state.arrayCondition(), state.sunlightExposure(), state.eventCause(),
                state.backupReserve(), state.powerDemand(), state.powerAllocation(), state.verticalArrayStatus(),
                state.dataStatus(), state.valueOrigin(), state.waterRecoveryStatus(), state.potableWaterSupply(),
                state.waterQualityVerification(), state.crewLifeSupport(), state.recoveredWaterDisposition(),
                state.dayTwoPersistentState(), state.storedFoodSupply(), state.cropProductionUnit(),
                CROP_GROWTH_NOT_HARVEST_READY, state.approvedWaterForCrops(), state.powerAvailability(),
                persistentState, operation, cropOperationalConstraint(state, choiceId));
    }

    private String cropOperationalConstraint(QualitativeState state, String choiceId) {
        if ("PRESERVE_STORED_FOOD".equals(choiceId)) return "OPTIONAL_CROP_OPERATION_POSTPONED";
        if (APPROVED_WATER_PENDING_VERIFICATION.equals(state.approvedWaterForCrops())) {
            return UNVERIFIED_WATER_NOT_USED + "; APPROVED_WATER_REQUIRED";
        }
        if (POWER_CONSTRAINED_BACKUP.equals(state.powerAvailability())
                || POWER_CONSTRAINED_GENERATION.equals(state.powerAvailability())
                || POWER_PRIORITIZED.equals(state.powerAvailability())) {
            return "POWER_CONSTRAINT_RECORDED; ESSENTIAL_OPERATIONS_REMAIN_PRIORITIZED";
        }
        return NO_OPERATIONAL_CONSTRAINT;
    }

    private QualitativeState dayFourInitialState(QualitativeState state) {
        return new QualitativeState(
                state.solarInput(), state.arrayCondition(), state.sunlightExposure(), state.eventCause(),
                state.backupReserve(), state.powerDemand(), state.powerAllocation(), state.verticalArrayStatus(),
                state.dataStatus(), state.valueOrigin(), state.waterRecoveryStatus(), state.potableWaterSupply(),
                state.waterQualityVerification(), state.crewLifeSupport(), state.recoveredWaterDisposition(),
                state.dayTwoPersistentState(), state.storedFoodSupply(), state.cropProductionUnit(),
                state.cropGrowth(), state.approvedWaterForCrops(), state.powerAvailability(),
                state.dayThreePersistentState(), state.cropOperationStatus(), state.cropOperationalConstraint(),
                approvedWaterForShielding(state), packagedFoodForShielding(state), EVA_STOPPED,
                CREW_LOCATION_STORM_SHELTER, PRIMARY_SHIELDING_AVAILABLE, SUPPLEMENTARY_SHIELDING_READY,
                SOLAR_RADIATION_ALERT_ACTIVE, dayFourOperationalConstraint(state));
    }

    private String approvedWaterForShielding(QualitativeState state) {
        return switch (state.dayTwoPersistentState()) {
            case REPROCESSING_PENDING_VERIFICATION -> WATER_UNVERIFIED_FOR_SHIELDING;
            case POTABLE_RESERVE_REDUCED -> "APPROVED_WATER_LIMITED_POTABLE_RESERVE_REDUCED";
            case WATER_CONSERVATION_ACTIVE -> "APPROVED_WATER_LIMITED_WATER_CONSERVATION_ACTIVE";
            default -> "APPROVED_WATER_STATUS_NOT_REPORTED";
        };
    }

    private String packagedFoodForShielding(QualitativeState state) {
        if (PACKAGED_FOOD_DEPENDENCY.equals(state.dayThreePersistentState())) {
            return "LIMITED_PACKAGED_FOOD_AVAILABLE";
        }
        return "STORED_FOOD_LOW; " + FOOD_CROPS_NOT_AVAILABLE;
    }

    private String dayFourOperationalConstraint(QualitativeState state) {
        return "Power availability: " + state.powerAvailability()
                + ". Water for shielding: " + approvedWaterForShielding(state)
                + ". Food for shielding: " + packagedFoodForShielding(state)
                + ". Primary shielding remains available; no radiation safety threshold is calculated.";
    }

    private boolean approvedWaterAvailableForShielding(QualitativeState state) {
        return "APPROVED_WATER_LIMITED_POTABLE_RESERVE_REDUCED".equals(state.approvedWaterForShielding())
                || "APPROVED_WATER_LIMITED_WATER_CONSERVATION_ACTIVE".equals(state.approvedWaterForShielding());
    }

    private boolean packagedFoodAvailableForShielding(QualitativeState state) {
        return "LIMITED_PACKAGED_FOOD_AVAILABLE".equals(state.packagedFoodForShielding());
    }

    private QualitativeState dayFourOutcome(QualitativeState state, String choiceId) {
        String persistentState = switch (choiceId) {
            case "REPOSITION_WATER_SUPPLIES" -> approvedWaterAvailableForShielding(state)
                    ? WATER_SUPPLIES_POSITIONED : WATER_SUPPLIES_UNAVAILABLE;
            case "REPOSITION_FOOD_SUPPLIES" -> packagedFoodAvailableForShielding(state)
                    ? FOOD_SUPPLIES_POSITIONED : FOOD_SUPPLIES_LIMITED;
            case "MAINTAIN_EXISTING_SHIELDING" -> PRIMARY_SHIELDING_MAINTAINED;
            default -> throw new IllegalArgumentException("Unknown Day 4 choice: " + choiceId);
        };
        String constraint = switch (choiceId) {
            case "REPOSITION_WATER_SUPPLIES" -> approvedWaterAvailableForShielding(state)
                    ? state.approvedWaterForShielding() + "; CREW_WATER_NEEDS_REMAIN_PRIORITY"
                    : state.approvedWaterForShielding() + "; APPROVED_WATER_REQUIRED"
                    + "; UNVERIFIED_RECOVERED_WATER_NOT_USED";
            case "REPOSITION_FOOD_SUPPLIES" -> packagedFoodAvailableForShielding(state)
                    ? state.packagedFoodForShielding() + "; FOOD_ACCESS_REDUCED_DURING_EMERGENCY"
                    : state.packagedFoodForShielding() + "; NO_HARVEST_READY_CROPS_USED";
            case "MAINTAIN_EXISTING_SHIELDING" -> "NO_SUPPLEMENTARY_RESOURCE_REPOSITIONING_REQUESTED"
                    + "; PRIMARY_SHIELDING_REMAINS_AVAILABLE";
            default -> throw new IllegalArgumentException("Unknown Day 4 choice: " + choiceId);
        };
        return new QualitativeState(
                state.solarInput(), state.arrayCondition(), state.sunlightExposure(), state.eventCause(),
                state.backupReserve(), state.powerDemand(), state.powerAllocation(), state.verticalArrayStatus(),
                state.dataStatus(), state.valueOrigin(), state.waterRecoveryStatus(), state.potableWaterSupply(),
                state.waterQualityVerification(), state.crewLifeSupport(), state.recoveredWaterDisposition(),
                state.dayTwoPersistentState(), state.storedFoodSupply(), state.cropProductionUnit(),
                state.cropGrowth(), state.approvedWaterForCrops(), state.powerAvailability(),
                state.dayThreePersistentState(), state.cropOperationStatus(), state.cropOperationalConstraint(),
                state.approvedWaterForShielding(), state.packagedFoodForShielding(), state.evaStatus(),
                state.crewLocation(), state.primaryShielding(), persistentState, persistentState, constraint);
    }

    private ActiveEffect effectFor(String choiceId) {
        return switch (choiceId) {
            case "use_stored_energy" -> new ActiveEffect("backup_reserve_in_use", "Backup reserve", BACKUP_IN_USE, "Stored energy is supporting important operations while solar input remains reduced.");
            case "begin_vsat_deployment" -> new ActiveEffect("vsat_preparation_started", "Vertical array preparation", VSAT_PREPARATION, "Preparation has started; the vertical array is not deployed or generating power.");
            case "reduce_non_essential_loads" -> new ActiveEffect("non_essential_demand_reduced", "Non-essential demand", POWER_DEMAND_REDUCED, "Optional equipment and activities may be delayed while essential operations keep priority.");
            default -> throw new IllegalArgumentException("Unknown Day 1 choice: " + choiceId);
        };
    }

    private ActiveEffect dayTwoEffectFor(String choiceId) {
        return switch (choiceId) {
            case "inspect_reprocess_water" -> new ActiveEffect("water_reprocessing_pending_verification", "Water recovery plan", REPROCESSING_PENDING_VERIFICATION, "Reprocessing has started. The recovered water remains isolated until it passes quality verification.");
            case "use_stored_potable_water" -> new ActiveEffect("potable_reserve_reduced", "Potable reserve", POTABLE_RESERVE_REDUCED, "The crew is using stored potable water. The available reserve has been reduced.");
            case "conserve_water" -> new ActiveEffect("water_conservation_active", "Water conservation", WATER_CONSERVATION_ACTIVE, "Non-essential water use has been reduced. Essential crew needs remain the priority.");
            default -> throw new IllegalArgumentException("Unknown Day 2 choice: " + choiceId);
        };
    }

    private ActiveEffect dayThreeEffectFor(String choiceId, QualitativeState state) {
        String persistentState = switch (choiceId) {
            case "START_LIMITED_CROP_TRIAL" -> LIMITED_CROP_TRIAL_STARTED;
            case "PRESERVE_STORED_FOOD" -> PACKAGED_FOOD_DEPENDENCY;
            case "EXPAND_CROP_PRODUCTION" -> EXPANDED_CROP_PRODUCTION;
            default -> throw new IllegalArgumentException("Unknown Day 3 choice: " + choiceId);
        };
        String description = switch (choiceId) {
            case "START_LIMITED_CROP_TRIAL" -> "A limited crop trial has started. The plants need time and continued care before they can provide food. Operational constraint: " + state.cropOperationalConstraint() + ".";
            case "PRESERVE_STORED_FOOD" -> "The crew is prioritizing stored food and reducing avoidable waste. No new crop cycle has started.";
            case "EXPAND_CROP_PRODUCTION" -> "Expanded crop production has been initiated. Resource limitations may restrict how much of the planned growing capacity can operate. Operational constraint: " + state.cropOperationalConstraint() + ".";
            default -> throw new IllegalArgumentException("Unknown Day 3 choice: " + choiceId);
        };
        return new ActiveEffect("day_three_food_strategy", "Food production strategy", persistentState, description);
    }

    private ActiveEffect dayFourEffectFor(String choiceId, QualitativeState state) {
        return new ActiveEffect(
                "day_four_supplementary_shielding",
                "Supplementary shielding strategy",
                state.dayFourPersistentState(),
                "The crew stopped EVA and entered the existing Storm Shelter. " + state.dayFourOperationalConstraint());
    }

    private DecisionFeedback feedbackFor(String choiceId, String title, QualitativeState outcome, ActiveEffect effect) {
        return switch (choiceId) {
            case "use_stored_energy" -> new DecisionFeedback(DAY_ONE, choiceId, title,
                    "Stored energy is now supporting important operations. The backup reserve has been reduced.",
                    "Mission Control accepted stored-energy support for important operations while solar generation remains reduced.",
                    "Important base operations.",
                    "The backup energy reserve is in use; the solar-generation problem remains unresolved.",
                    outcome.backupReserve(), effect.description(),
                    "Solar power depends on the array's location and illumination, not only on whether the panel looks intact.");
            case "begin_vsat_deployment" -> new DecisionFeedback(DAY_ONE, choiceId, title,
                    "Vertical solar-array deployment preparation has started. The new array is not generating power yet.",
                    "Mission Control recorded preparation for a potential vertical solar-array solution inspired by NASA's VSAT prototype work.",
                    "The crew begins preparing a potential longer-term power solution.",
                    "Solar input remains reduced and the preparation is not considered deployed or operational.",
                    outcome.backupReserve(), effect.description(),
                    "A technology concept can be useful for a future plan without being presented as equipment already operating on the Moon.");
            case "reduce_non_essential_loads" -> new DecisionFeedback(DAY_ONE, choiceId, title,
                    "Non-essential loads have been reduced. Essential operations keep priority while optional activities are delayed.",
                    "Mission Control reduced electricity demand without shutting down life-support systems or changing solar generation.",
                    "Essential base operations.",
                    "Optional activities and non-essential equipment may be delayed.",
                    outcome.backupReserve(), effect.description(),
                    "A power system must manage both energy generation and energy demand.");
            default -> throw new IllegalArgumentException("Unknown Day 1 choice: " + choiceId);
        };
    }

    private DecisionFeedback dayTwoFeedbackFor(String choiceId, String title, QualitativeState outcome, ActiveEffect effect) {
        return switch (choiceId) {
            case "inspect_reprocess_water" -> new DecisionFeedback(DAY_TWO, choiceId, title,
                    "Reprocessing has started. The recovered water remains isolated until it passes quality verification.",
                    "Mission Control is trying to restore the water-recovery process while keeping unverified water out of the potable supply.",
                    "Potable water remains available, and crew life support remains operational.",
                    "Inspection and reprocessing require time and power. The water is not approved yet.",
                    outcome.backupReserve(), effect.description(),
                    "An unacceptable quality reading is not proof of contamination or hardware failure. Verification must come before use.");
            case "use_stored_potable_water" -> new DecisionFeedback(DAY_TWO, choiceId, title,
                    "The crew is using stored potable water. The available reserve has been reduced.",
                    "Mission Control is relying on already approved potable water while the restricted recovery process remains isolated.",
                    "Approved potable water is available for essential crew needs, and life support remains operational.",
                    "The available potable reserve is reduced for subsequent days; the original recovery issue is unresolved.",
                    outcome.backupReserve(), effect.description(),
                    "Water that has not passed quality verification must stay isolated, even when another approved supply is available.");
            case "conserve_water" -> new DecisionFeedback(DAY_TWO, choiceId, title,
                    "Non-essential water use has been reduced. Essential crew needs remain the priority.",
                    "Mission Control is slowing potable-water use without reducing essential drinking or hygiene needs.",
                    "Essential crew needs remain the priority, and approved potable water remains available.",
                    "The recovery restriction remains unresolved and optional water activities are delayed.",
                    outcome.backupReserve(), effect.description(),
                    "Conservation can protect an approved reserve, but it does not make unverified recovered water safe to use.");
            default -> throw new IllegalArgumentException("Unknown Day 2 choice: " + choiceId);
        };
    }

    private DecisionFeedback dayThreeFeedbackFor(String choiceId, String title, QualitativeState outcome, ActiveEffect effect) {
        return switch (choiceId) {
            case "START_LIMITED_CROP_TRIAL" -> new DecisionFeedback(
                    DAY_THREE, choiceId, title,
                    "A limited crop trial has started. The plants need time and continued care before they can provide food.",
                    "Mission Control accepted the limited trial. The crop unit is available, but no immediate meal or harvest has been recorded.",
                    "A smaller future food-production effort is now recorded.",
                    "Power, approved water, nutrients, and continued care remain necessary; crop growth is not harvest-ready. No immediate harvest is recorded.",
                    outcome.backupReserve(), effect.description(),
                    "Plants in space need controlled light, water, nutrients, and monitoring. ISS research systems are not operational lunar farms.");
            case "PRESERVE_STORED_FOOD" -> new DecisionFeedback(
                    DAY_THREE, choiceId, title,
                    "The crew is prioritizing stored food and reducing avoidable waste. No new crop cycle has started.",
                    "Mission Control accepted the packaged-food plan and did not allocate a new crop cycle.",
                    "Remaining ready-to-eat food management and essential crew needs.",
                    "No new crop production starts; the base remains dependent on the low stored-food supply. No immediate harvest is recorded.",
                    outcome.backupReserve(), effect.description(),
                    "Growing crops takes time, so stored food still supports the crew while a crop cycle develops.");
            case "EXPAND_CROP_PRODUCTION" -> new DecisionFeedback(
                    DAY_THREE, choiceId, title,
                    "Expanded crop production has been initiated. Resource limitations may restrict how much of the planned growing capacity can operate.",
                    "Mission Control accepted the expansion decision. It was not blocked by the current power or approved-water constraints.",
                    "A broader future food-production effort is now recorded.",
                    "The operation is constrained by the returned power and approved-water states; unverified recovered water is not used, and no immediate harvest is recorded.",
                    outcome.backupReserve(), effect.description(),
                    "A risky plan can be accepted while its operating constraints are made visible. Crop research on the ISS is not proof of a ready lunar farm.");
            default -> throw new IllegalArgumentException("Unknown Day 3 choice: " + choiceId);
        };
    }

    private DecisionFeedback dayFourFeedbackFor(String choiceId, String title, QualitativeState outcome, ActiveEffect effect) {
        return switch (choiceId) {
            case "REPOSITION_WATER_SUPPLIES" -> new DecisionFeedback(
                    DAY_FOUR, choiceId, title,
                    approvedWaterAvailableForShielding(outcome)
                            ? "EVA was stopped and the crew entered the Storm Shelter. Suitable approved water supplies were repositioned for supplementary shielding."
                            : "EVA was stopped and the crew entered the Storm Shelter. The water-repositioning decision was recorded, but suitable approved water was unavailable for supplementary shielding.",
                    approvedWaterAvailableForShielding(outcome)
                            ? "The action used only approved water represented by the current qualitative state; unverified recovered water was not used."
                            : "Recovered water pending verification remained isolated, and the available approved-water state did not support the requested supplementary shielding action.",
                    "Primary shelter shielding remains available.",
                    outcome.dayFourOperationalConstraint(),
                    outcome.crewLocation() + "; " + outcome.evaStatus(),
                    effect.description(),
                    "This is a simulated mission event, not live NASA telemetry. No radiation dose, shielding percentage, or scientific safety conclusion was calculated.");
            case "REPOSITION_FOOD_SUPPLIES" -> new DecisionFeedback(
                    DAY_FOUR, choiceId, title,
                    packagedFoodAvailableForShielding(outcome)
                            ? "EVA was stopped and the crew entered the Storm Shelter. Available packaged food supplies were repositioned for supplementary shielding."
                            : "EVA was stopped and the crew entered the Storm Shelter. The food-repositioning decision was recorded, but suitable packaged food was limited.",
                    packagedFoodAvailableForShielding(outcome)
                            ? "The action used limited packaged food supplies. Crops that were not harvest-ready were not treated as emergency food."
                            : "Stored food was LOW and crops were not harvest-ready, so no crop harvest was treated as available emergency food.",
                    "Primary shelter shielding remains available.",
                    outcome.dayFourOperationalConstraint(),
                    outcome.crewLocation() + "; " + outcome.evaStatus(),
                    effect.description(),
                    "This is a simulated mission event, not live NASA telemetry. No radiation dose, shielding percentage, or scientific safety conclusion was calculated.");
            case "MAINTAIN_EXISTING_SHIELDING" -> new DecisionFeedback(
                    DAY_FOUR, choiceId, title,
                    "EVA was stopped and the crew entered the Storm Shelter. Existing primary shielding is being maintained while water and food remain accessible.",
                    "The crew chose the existing shelter protection without repositioning supplies. This is a valid strategic choice, not a mission failure.",
                    "Primary shelter shielding remains available, and crew supplies remain accessible.",
                    outcome.dayFourOperationalConstraint(),
                    outcome.crewLocation() + "; " + outcome.evaStatus(),
                    effect.description(),
                    "This is a simulated mission event, not live NASA telemetry. No radiation dose, shielding percentage, or scientific safety conclusion was calculated.");
            default -> throw new IllegalArgumentException("Unknown Day 4 choice: " + choiceId);
        };
    }

    private MissionResult dayOneResult(ResolvedChoice selected, DecisionFeedback feedback, ActiveEffect effect) {
        return new MissionResult(
                "DAY_1_COMPLETE",
                "DAY 1 COMPLETE",
                "The Day 1 power response was recorded for the fictional lunar base scenario.",
                selected,
                feedback.preserved(),
                feedback.reducedOrDelayed(),
                "Solar input remains reduced because terrain shadows are blocking part of the low-angle sunlight.",
                feedback.backupReserve(),
                List.of(effect),
                feedback.scientificTakeaway(),
                true,
                "Day 2 briefing ready: enter the lunar habitat and inspect the Water Recovery Station."
        );
    }

    private MissionResult dayTwoResult(ResolvedChoice selected, DecisionFeedback feedback, List<ActiveEffect> effects) {
        return new MissionResult(
                DAY_TWO_COMPLETE,
                "DAY 2 COMPLETE",
                feedback.resultMessage(),
                selected,
                feedback.preserved(),
                feedback.reducedOrDelayed(),
                "Crew life support remains operational; water recovery is restricted.",
                feedback.backupReserve(),
                effects,
                feedback.scientificTakeaway(),
                true,
                "Day 3 briefing ready: enter the Crop Production Unit and inspect the food and crop systems. Reprocessing success has not been assumed."
        );
    }

    private MissionResult dayThreeResult(ResolvedChoice selected, DecisionFeedback feedback,
                                         QualitativeState state, List<ActiveEffect> effects) {
        return new MissionResult(
                DAY_THREE_COMPLETE,
                "DAY 3 COMPLETE",
                feedback.resultMessage(),
                selected,
                feedback.preserved(),
                feedback.reducedOrDelayed(),
                "Power availability: " + state.powerAvailability(),
                feedback.backupReserve(),
                effects,
                feedback.scientificTakeaway(),
                true,
                "Day 4 briefing ready: stop EVA operations, enter the designated Storm Shelter, and review the supplementary-shielding choices. No immediate harvest is recorded."
        );
    }

    private MissionResult dayFourResult(ResolvedChoice selected, DecisionFeedback feedback,
                                        QualitativeState state, List<ActiveEffect> effects) {
        return new MissionResult(
                DAY_FOUR_COMPLETE,
                "DAY 4 COMPLETE",
                feedback.resultMessage(),
                selected,
                feedback.preserved(),
                feedback.reducedOrDelayed(),
                "Day 1 power state: " + state.powerAvailability() + "; no Day 4 power consumption was calculated.",
                "Primary shielding: " + state.primaryShielding(),
                effects,
                feedback.scientificTakeaway(),
                false,
                "Day 4 is recorded descriptively. No radiation dose, shielding percentage, scientific safety threshold, or final success/failure classification was calculated; further NASA data review remains pending after November 13, 2026."
        );
    }

    public static class GameRequestException extends RuntimeException {
        private final String code;

        public GameRequestException(String code, String message) {
            super(message);
            this.code = code;
        }

        public String code() {
            return code;
        }
    }
}
