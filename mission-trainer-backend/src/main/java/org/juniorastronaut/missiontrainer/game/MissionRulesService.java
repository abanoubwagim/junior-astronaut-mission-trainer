package org.juniorastronaut.missiontrainer.game;

import lombok.AllArgsConstructor;
import org.juniorastronaut.missiontrainer.api.MissionDtos.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@AllArgsConstructor
public class MissionRulesService {
    private static final int DAYS = 4;
    private static final int MIN = 0;
    private static final int MAX = 12;
    private static final int BACKUP_WATER_PACK_POWER_COST = -2;
    private static final int BACKUP_WATER_PACK_WATER_GAIN = 5;
    private static final int GROW_HARVEST_WATER_THRESHOLD = 5;
    private static final int GROW_HARVEST_REDUCED = 2;
    private static final int GROW_HARVEST_NORMAL = 4;
    private static final String SUCCESS = "SUCCEEDED";
    private static final String FAILURE = "FAILED";
    private static final String ACTIVE = "ACTIVE";

    private static final String POWER_ZERO = "POWER_REACHED_ZERO";
    private static final String WATER_ZERO = "WATER_REACHED_ZERO";
    private static final String FOOD_ZERO = "FOOD_REACHED_ZERO";
    private static final String SHELTER_ZERO = "SHELTER_READINESS_REACHED_ZERO";
    private static final String PASSIVE_REQUIRES_PREPARATION =
            "PASSIVE_SHELTER_REQUIRES_PREPARED_SHIELDING";
    private static final String SHELTER_BELOW_THRESHOLD = "SHELTER_READINESS_BELOW_THRESHOLD";
    private static final String SHELTER_NOT_ACTIVATED = "SHELTER_NOT_ACTIVATED";
    private static final String PROTECTION_NOT_READY = "PROTECTION_NOT_READY";

    private static final List<ResourceDefinition> RESOURCE_DEFINITIONS = List.of(
            new ResourceDefinition("power", "Power", MIN, MAX, "game units",
                    "Runs the habitat and support systems. This is a simplified game value."),
            new ResourceDefinition("water", "Water", MIN, MAX, "game units",
                    "Keeps the crew supplied; recovery can stretch the reserve."),
            new ResourceDefinition("food", "Food", MIN, MAX, "game units",
                    "The crew uses food each mission day; production can be delayed."),
            new ResourceDefinition("shelterReadiness", "Shelter readiness", MIN, MAX, "game units",
                    "An abstract readiness value, not a radiation dose or shielding percentage.")
    );

    private static final String DUST_SOURCE_TITLE =
            "Lunar Dust Considerations for Vertical Solar Arrays Volume 1: Lunar Environment and Dust Interactions";
    private static final String DUST_SOURCE_URL = "https://ntrs.nasa.gov/citations/20240003496";
    private static final String ARRAY_DUST_SOURCE_TITLE = "Dust Mitigation for Flexible Solar Arrays (DMFlex-ACO)";
    private static final String ARRAY_DUST_SOURCE_URL = "https://techport.nasa.gov/projects/116295";
    private static final String WATER_SOURCE_TITLE =
            "NASA Achieves Water Recovery Milestone on International Space Station";
    private static final String WATER_SOURCE_URL =
            "https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/";
    private static final String ECLSS_SOURCE_TITLE =
            "Environmental Control and Life Support Systems (ECLSS)";
    private static final String ECLSS_SOURCE_URL =
            "https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/";
    private static final String PLANT_SOURCE_TITLE = "Advanced Plant Habitat";
    private static final String PLANT_SOURCE_URL = "https://science.nasa.gov/mission/advanced-plant-habitat/";
    private static final String RADIATION_SOURCE_TITLE =
            "How NASA Will Protect Astronauts From Space Radiation at the Moon";
    private static final String RADIATION_SOURCE_URL =
            "https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/";

    public MissionResponse startMission() {
        State state = new State();
        return response(ACTIVE, 1, state, eventForDay(1), List.of(), null, null);
    }

    public MissionResponse replay(DecisionHistoryRequest request) {
        if (request == null || request.decisions() == null || request.decisions().isEmpty()) {
            throw new GameRequestException("EMPTY_HISTORY", "Choose an option for Day 1 before sending decisions.");
        }
        if (request.decisions().size() > DAYS) {
            throw new GameRequestException("INVALID_HISTORY", "A mission can contain only four daily decisions.");
        }

        State state = new State();
        List<ResolvedChoice> resolvedChoices = new ArrayList<>();
        List<DecisionInput> acceptedHistory = new ArrayList<>();
        DecisionFeedback latestFeedback = null;
        MissionResult result = null;
        String status = ACTIVE;
        int responseDay = 1;
        Event currentEvent = eventForDay(1);

        for (int index = 0; index < request.decisions().size(); index++) {
            DecisionInput decision = request.decisions().get(index);
            int expectedDay = index + 1;
            validateDecision(decision, expectedDay);
            if (!ACTIVE.equals(status)) {
                throw new GameRequestException("POST_TERMINAL_DECISION",
                        "The mission already ended. Start a new mission before sending another choice.");
            }

            Choice selected = findChoice(expectedDay, decision.choiceId());
            if (selected == null) {
                throw new GameRequestException("INVALID_CHOICE", "That choice is not available for this day.");
            }

            acceptedHistory.add(decision);
            latestFeedback = resolveDay(state, expectedDay, selected);
            resolvedChoices.add(new ResolvedChoice(expectedDay, selected.title(), lessonForChoice(selected.id())));
            responseDay = expectedDay;

            Failure failure = failureFor(state, expectedDay);
            if (failure != null) {
                status = FAILURE;
                result = failureResult(expectedDay, failure, resolvedChoices);
                currentEvent = null;
                if (index < request.decisions().size() - 1) {
                    throw new GameRequestException("POST_TERMINAL_DECISION",
                            "The mission ended before the end of that decision history.");
                }
            } else if (expectedDay == DAYS) {
                status = SUCCESS;
                result = successResult(resolvedChoices);
                currentEvent = null;
            } else {
                responseDay = expectedDay + 1;
                currentEvent = eventForDay(responseDay);
            }
        }

        return response(status, responseDay, state, currentEvent, acceptedHistory, latestFeedback, result);
    }

    private void validateDecision(DecisionInput decision, int expectedDay) {
        if (decision == null || decision.day() == null || decision.day() != expectedDay
                || decision.choiceId() == null || decision.choiceId().isBlank()) {
            throw new GameRequestException("INVALID_HISTORY",
                    "Decisions must contain one choice for each day, in order, starting at Day 1.");
        }
    }

    private DecisionFeedback resolveDay(State state, int day, Choice choice) {
        ResourceValues before = state.resources();

        // Canonical processing order: upkeep, scheduled effects, Day 4 event, choice, clamp, checks.
        int dailyPower = state.airLoopServiced && day >= 3 ? -1 : -2;
        int dailyWater = -2;
        int dailyFood = -2;
        int dailyShelter = state.shieldingPrepared && day >= 2 ? 0 : -1;

        int delayedPower = state.solarArrayReady && day >= 2 ? 1 : 0;
        int delayedWater = state.waterSaver && day >= 3 ? 1 : 0;
        int waterAfterScheduledEffects = clamp(before.water() + dailyWater + delayedWater);
        int delayedFood = state.growLightHarvestPending && day == DAYS
                ? growHarvestForWater(waterAfterScheduledEffects) : 0;
        int eventShelter = day == DAYS ? -2 : 0;

        int choicePower = 0;
        int choiceWater = 0;
        int choiceFood = 0;
        int choiceShelter = 0;

        switch (choice.id()) {
            case "clean_solar_array" -> {
                choicePower = -1;
                state.solarArrayReady = true;
            }
            case "connect_spare_battery" -> choicePower = 1;
            case "prepare_storm_shelter" -> {
                choicePower = -1;
                choiceShelter = 2;
                state.shieldingPrepared = true;
            }
            case "service_water_recycler" -> {
                choicePower = -1;
                choiceWater = 1;
                state.waterSaver = true;
            }
            case "use_backup_water_pack" -> {
                choicePower = BACKUP_WATER_PACK_POWER_COST;
                choiceWater = BACKUP_WATER_PACK_WATER_GAIN;
            }
            case "inspect_co2_removal_loop" -> {
                choicePower = -1;
                state.airLoopServiced = true;
            }
            case "start_grow_light_tray" -> {
                choicePower = -2;
                choiceWater = -1;
                state.growLightHarvestPending = true;
            }
            case "open_meal_crate" -> {
                choicePower = -1;
                choiceFood = 3;
            }
            case "full_storm_shelter" -> {
                choicePower = state.shieldingPrepared ? -1 : -2;
                choiceShelter = 4;
                state.shelterActivated = true;
                state.shelterMode = ShelterMode.FULL;
                if (!state.shieldingPrepared) {
                    state.emergencyProtectionActivated = true;
                }
            }
            case "passive_storm_shelter" -> {
                choiceShelter = 2;
                state.shelterActivated = true;
                state.shelterMode = ShelterMode.PASSIVE;
            }
            default -> throw new IllegalStateException("Choice was validated before resolution.");
        }

        int nextPower = clamp(before.power() + dailyPower + delayedPower + choicePower);
        int nextWater = clamp(before.water() + dailyWater + delayedWater + choiceWater);
        int nextFood = clamp(before.food() + dailyFood + delayedFood + choiceFood);
        int nextShelter = clamp(before.shelterReadiness() + dailyShelter + eventShelter + choiceShelter);
        state.power = nextPower;
        state.water = nextWater;
        state.food = nextFood;
        state.shelterReadiness = nextShelter;
        if (day == DAYS) {
            state.growLightHarvestPending = false;
        }

        Map<String, ResourceBreakdown> breakdown = new LinkedHashMap<>();
        breakdown.put("power", new ResourceBreakdown(before.power(), dailyPower, delayedPower, 0, choicePower,
                nextPower, nextPower - before.power()));
        breakdown.put("water", new ResourceBreakdown(before.water(), dailyWater, delayedWater, 0, choiceWater,
                nextWater, nextWater - before.water()));
        breakdown.put("food", new ResourceBreakdown(before.food(), dailyFood, delayedFood, 0, choiceFood,
                nextFood, nextFood - before.food()));
        breakdown.put("shelterReadiness", new ResourceBreakdown(
                before.shelterReadiness(), dailyShelter, 0, eventShelter, choiceShelter,
                nextShelter, nextShelter - before.shelterReadiness()));

        String harvestMessage = delayedFood > 0 ? growHarvestMessage(delayedFood) : "";
        String explanation = explanationForChoice(choice.id())
                + (harvestMessage.isBlank() ? "" : " " + harvestMessage);
        String futureEffect = delayedFood > 0 ? harvestMessage : futureEffectForChoice(day, choice.id());

        return new DecisionFeedback(day, choice.id(), choice.title(), "Day " + day + " decision complete",
                explanation,
                "Every resource is a simplified game value. Compare what helps now with what helps later.",
                futureEffect, Map.copyOf(breakdown));
    }

    private int growHarvestForWater(int waterAfterScheduledEffects) {
        return waterAfterScheduledEffects <= GROW_HARVEST_WATER_THRESHOLD
                ? GROW_HARVEST_REDUCED : GROW_HARVEST_NORMAL;
    }

    private String growHarvestMessage(int harvest) {
        if (harvest == GROW_HARVEST_REDUCED) {
            return "Your Water reserve was low, so the grow tray produced a smaller harvest: +2 Food game units.";
        }
        return "The grow tray produced its normal harvest: +4 Food game units.";
    }

    private Failure failureFor(State state, int day) {
        if (state.power == 0) {
            return new Failure(POWER_ZERO, "Power", List.of());
        }
        if (state.water == 0) {
            return new Failure(WATER_ZERO, "Water", List.of());
        }
        if (state.food == 0) {
            return new Failure(FOOD_ZERO, "Food", List.of());
        }
        if (state.shelterReadiness == 0) {
            return new Failure(SHELTER_ZERO, "Shelter readiness", List.of());
        }
        if (day != DAYS) {
            return null;
        }

        if (state.shelterMode == ShelterMode.PASSIVE && !state.shieldingPrepared) {
            List<String> secondary = state.shelterReadiness < 6
                    ? List.of(SHELTER_BELOW_THRESHOLD)
                    : List.of();
            return new Failure(PASSIVE_REQUIRES_PREPARATION, "Protection", secondary);
        }
        if (state.shelterReadiness < 6) {
            return new Failure(SHELTER_BELOW_THRESHOLD, "Shelter readiness", List.of());
        }
        if (!state.shelterActivated) {
            return new Failure(SHELTER_NOT_ACTIVATED, "Protection", List.of());
        }
        if (!protectionReady(state)) {
            return new Failure(PROTECTION_NOT_READY, "Protection", List.of());
        }
        return null;
    }

    private boolean protectionReady(State state) {
        return state.shelterActivated
                && (state.shieldingPrepared || state.emergencyProtectionActivated);
    }

    private MissionResult successResult(List<ResolvedChoice> choices) {
        return new MissionResult(SUCCESS, "Four days. One brave crew. Mission complete!",
                "The crew finished four mission days with supplies and activated protection.", null, null, List.of(),
                List.of("Air cleaning removes carbon dioxide; it is separate from oxygen generation.",
                        "Recovery systems can save supplies later, but maintenance costs Power now.",
                        "Shelter readiness is a game value, not a radiation dose."), List.copyOf(choices));
    }

    private MissionResult failureResult(int day, Failure failure, List<ResolvedChoice> choices) {
        String summary = switch (failure.reason()) {
            case POWER_ZERO -> "Power reached zero, so the crew could not continue the mission safely.";
            case WATER_ZERO -> "Water reached zero, so the crew could not continue the mission safely.";
            case FOOD_ZERO -> "Food reached zero, so the crew could not continue the mission safely.";
            case SHELTER_ZERO -> "Shelter readiness reached zero before the mission could finish.";
            case PASSIVE_REQUIRES_PREPARATION ->
                    "Passive shelter mode needs a protection plan prepared earlier.";
            case SHELTER_BELOW_THRESHOLD ->
                    "The crew reached the Day 4 alert without enough shelter readiness.";
            case SHELTER_NOT_ACTIVATED, PROTECTION_NOT_READY ->
                    "The crew did not finish an activated protection plan.";
            default -> "The mission could not continue safely.";
        };
        return new MissionResult(FAILURE, "Mission paused on Day " + day, summary,
                failure.limitingResource(), failure.reason(), failure.secondaryReasons(),
                List.of("The first failure reason is chosen using a fixed priority.",
                        "Shelter readiness and protection readiness are separate outcomes.",
                        "Compare immediate supplies with repairs that help on later days."),
                List.copyOf(choices));
    }

    private MissionResponse response(String status, int day, State state, Event event,
                                     List<DecisionInput> history, DecisionFeedback feedback,
                                     MissionResult result) {
        List<String> effects = ACTIVE.equals(status) ? activeEffects(state) : List.of();
        return new MissionResponse(status, day, DAYS, state.resources(),
                RESOURCE_DEFINITIONS, event, effects, List.copyOf(history), systemState(state), feedback, result);
    }

    private SystemState systemState(State state) {
        return new SystemState(state.airLoopServiced, state.shieldingPrepared, state.shelterActivated,
                state.shelterMode == ShelterMode.NONE ? null : state.shelterMode.name(),
                state.emergencyProtectionActivated, protectionReady(state));
    }

    private List<String> activeEffects(State state) {
        List<String> effects = new ArrayList<>();
        if (state.solarArrayReady) {
            effects.add("Solar array cleaned: +1 Power on Days 2–4.");
        }
        if (state.waterSaver) {
            effects.add("Recycler serviced: +1 Water is scheduled on Days 3–4; this is the single Water recovery effect.");
        }
        if (state.airLoopServiced) {
            effects.add("CO₂ loop serviced: daily Power upkeep is 1 lower on Days 3–4, a simplified game rule.");
        }
        if (state.growLightHarvestPending) {
            effects.add("Grow tray running: Day 4 harvest depends on Water after upkeep and scheduled recovery; it can be +2 or +4 Food game units.");
        }
        if (state.shieldingPrepared) {
            effects.add("Shielding plan prepared: later shelter wear is prevented.");
        }
        return List.copyOf(effects);
    }

    private Choice findChoice(int day, String choiceId) {
        return eventForDay(day).choices().stream()
                .filter(choice -> choice.id().equals(choiceId))
                .findFirst().orElse(null);
    }

    private String lessonForChoice(String choiceId) {
        return switch (choiceId) {
            case "clean_solar_array" -> "A repair can cost energy now and produce more energy later.";
            case "connect_spare_battery" -> "Stored energy helps immediately, but it does not improve later output.";
            case "prepare_storm_shelter" -> "Protection planning and material preparation happen before an alert.";
            case "service_water_recycler" -> "Water recovery can stretch a reserve over later days.";
            case "use_backup_water_pack" -> "A reserve pack gives water immediately but costs more Power.";
            case "inspect_co2_removal_loop" -> "CO₂ removal cleans the air; it is not the same as oxygen generation.";
            case "start_grow_light_tray" -> "Delayed production can provide more Food, but it costs Power and Water first.";
            case "open_meal_crate" -> "Stored meals help immediately and reduce current risk.";
            case "full_storm_shelter" -> "Full activation gives more readiness and can be used as an emergency setup.";
            case "passive_storm_shelter" -> "Passive shelter saves Power but needs earlier protection preparation.";
            default -> "The crew made a mission decision.";
        };
    }

    private String explanationForChoice(String choiceId) {
        return switch (choiceId) {
            case "clean_solar_array" -> "The array repair costs Power now and adds Power on Days 2–4.";
            case "connect_spare_battery" -> "The spare battery adds Power now without creating a later array bonus.";
            case "prepare_storm_shelter" -> "The crew prepared the protection plan and improved shelter readiness.";
            case "service_water_recycler" -> "The crew spent Power and gained Water. One delayed Water recovery effect is scheduled for Days 3 and 4.";
            case "use_backup_water_pack" -> "The sealed pack adds Water immediately, up to the storage limit, but costs Power.";
            case "inspect_co2_removal_loop" -> "The crew serviced the CO₂ removal loop. It does not generate Oxygen or recover Water; it avoids a simplified Power penalty on Days 3 and 4.";
            case "start_grow_light_tray" -> "The grow tray uses Power and Water today. Its Day 4 harvest depends on the Water reserve at the harvest check.";
            case "open_meal_crate" -> "The crew opened reserve meals and added Food immediately.";
            case "full_storm_shelter" -> "The crew activated the full shelter. An unprepared setup costs extra Power as a simplified emergency-work rule.";
            case "passive_storm_shelter" -> "The crew activated a low-Power shelter mode. It is valid only when protection was prepared earlier.";
            default -> "The crew completed the day's plan.";
        };
    }

    private String futureEffectForChoice(int day, String choiceId) {
        return switch (choiceId) {
            case "clean_solar_array" -> "Days 2–4: the cleaned array adds 1 Power each day.";
            case "prepare_storm_shelter" -> "Days 2–4: the prepared shelter avoids 1 point of daily readiness wear.";
            case "service_water_recycler" -> "Days 3–4: one +1 Water recovery effect is scheduled per day.";
            case "inspect_co2_removal_loop" -> "Days 3–4: daily Power upkeep is 1 lower as a simplified game rule.";
            case "start_grow_light_tray" -> "Day 4: after upkeep and scheduled Water recovery, the grow tray harvests +2 Food when Water is 5 or lower, otherwise +4 Food game units.";
            case "connect_spare_battery", "use_backup_water_pack", "open_meal_crate",
                    "full_storm_shelter", "passive_storm_shelter" -> "No extra effect is scheduled for a later day.";
            default -> "No later effect is scheduled.";
        };
    }

    private Event eventForDay(int day) {
        return switch (day) {
            case 1 -> new Event(1, "Dust on the solar array",
                    "The rover spots dust on the solar array, and mission control asks the crew to prepare for a possible solar-particle alert.",
                    "Lunar dust can affect exposed equipment. The choices in this game use simplified Power and shelter values.",
                    List.of(new ScienceSource(DUST_SOURCE_TITLE, DUST_SOURCE_URL),
                            new ScienceSource(ARRAY_DUST_SOURCE_TITLE, ARRAY_DUST_SOURCE_URL)),
                    List.of(
                            new Choice("clean_solar_array", "Brush the solar array",
                                    "Spend 1 Power now to clear the panels.",
                                    "The array adds 1 Power on each of Days 2–4."),
                            new Choice("connect_spare_battery", "Connect the spare battery",
                                    "Gain 1 Power now without spending rover power.",
                                    "You get energy right away, but there is no later array boost."),
                            new Choice("prepare_storm_shelter", "Prepare the storm shelter",
                                    "Spend 1 Power and gain 2 Shelter readiness.",
                                    "The prepared shelter avoids normal readiness wear on Days 2–4.")));
            case 2 -> new Event(2, "Water and air systems need care",
                    "The base can service the water recycler, open a sealed water pack, or inspect the CO₂ removal loop.",
                    "NASA ECLSS separates water recovery, air revitalization, and oxygen generation. This game models only simplified maintenance effects.",
                    List.of(new ScienceSource(WATER_SOURCE_TITLE, WATER_SOURCE_URL),
                            new ScienceSource(ECLSS_SOURCE_TITLE, ECLSS_SOURCE_URL)),
                    List.of(
                            new Choice("service_water_recycler", "Service the water recycler",
                                    "Spend 1 Power and gain 1 Water now.",
                                    "One +1 Water recovery effect is scheduled on Days 3 and 4."),
                            new Choice("use_backup_water_pack", "Open a backup water pack",
                                    "Spend 2 Power and gain 5 Water now, up to the storage limit.",
                                    "It uses Power, but it does not create a later recovery effect."),
                            new Choice("inspect_co2_removal_loop", "Service the CO₂ removal loop",
                                    "Spend 1 Power to service the air-cleaning loop.",
                                    "Daily Power upkeep is 1 lower on Days 3 and 4 as a simplified game rule.")));
            case 3 -> new Event(3, "Fresh food for the crew",
                    "The crew is choosing how to support the food supply. A grow tray can help later, while a meal crate helps right away.",
                    "NASA plant systems use controlled light, water, and nutrients. This game compresses a much longer growing process into one mission turn.",
                    List.of(new ScienceSource(PLANT_SOURCE_TITLE, PLANT_SOURCE_URL)),
                    List.of(
                            new Choice("start_grow_light_tray", "Start the grow tray",
                                    "Spend 2 Power and 1 Water to start the tray.",
                                    "Gain +2 or +4 Food on Day 4 depending on Water after upkeep and scheduled recovery; this is a compressed game-time effect."),
                            new Choice("open_meal_crate", "Open the meal crate",
                                    "Spend 1 Power and gain 3 Food now.",
                                    "This helps right away and creates no later harvest.")));
            case 4 -> new Event(4, "A fictional solar-particle alert",
                    "The alert reaches the base. Activate the full shelter or use the low-Power shelter procedure.",
                    "NASA studies protective shelter concepts for solar-particle events. This game's readiness and protection states are qualitative game rules, not radiation measurements.",
                    List.of(new ScienceSource(RADIATION_SOURCE_TITLE, RADIATION_SOURCE_URL)),
                    List.of(
                            new Choice("full_storm_shelter", "Activate the full shelter",
                                    "Spend 1 Power if prepared, or 2 Power for an emergency setup, and gain 4 Shelter readiness.",
                                    "Full activation works as either a prepared or emergency protection procedure."),
                            new Choice("passive_storm_shelter", "Use the passive shelter",
                                    "Keep all Power and gain 2 Shelter readiness.",
                                    "This low-Power mode is valid only when shielding was prepared earlier.")));
            default -> throw new IllegalArgumentException("A mission has only four days.");
        };
    }

    private int clamp(int value) {
        return Math.max(MIN, Math.min(MAX, value));
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

    private enum ShelterMode {
        NONE, FULL, PASSIVE
    }

    private record Failure(String reason, String limitingResource, List<String> secondaryReasons) {
    }

    private static final class State {
        private int power = 12;
        private int water = 12;
        private int food = 10;
        private int shelterReadiness = 8;
        private boolean solarArrayReady;
        private boolean waterSaver;
        private boolean growLightHarvestPending;
        private boolean airLoopServiced;
        private boolean shieldingPrepared;
        private boolean shelterActivated;
        private ShelterMode shelterMode = ShelterMode.NONE;
        private boolean emergencyProtectionActivated;

        private ResourceValues resources() {
            return new ResourceValues(power, water, food, shelterReadiness);
        }
    }
}
