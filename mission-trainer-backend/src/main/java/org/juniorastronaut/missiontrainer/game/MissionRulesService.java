package org.juniorastronaut.missiontrainer.game;

import org.juniorastronaut.missiontrainer.api.MissionDtos.Choice;
import org.juniorastronaut.missiontrainer.api.MissionDtos.DecisionFeedback;
import org.juniorastronaut.missiontrainer.api.MissionDtos.DecisionHistoryRequest;
import org.juniorastronaut.missiontrainer.api.MissionDtos.DecisionInput;
import org.juniorastronaut.missiontrainer.api.MissionDtos.Event;
import org.juniorastronaut.missiontrainer.api.MissionDtos.MissionResponse;
import org.juniorastronaut.missiontrainer.api.MissionDtos.MissionResult;
import org.juniorastronaut.missiontrainer.api.MissionDtos.QualitativeState;
import org.juniorastronaut.missiontrainer.api.MissionDtos.ResolvedChoice;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MissionRulesService {
    private static final int DAY_ONE = 1;
    private static final int TOTAL_DAYS = 4;
    private static final String ACTIVE = "ACTIVE";
    private static final String COMPLETE = "DAY_1_COMPLETE";
    private static final String DATA_UNAVAILABLE = "DATA_UNAVAILABLE";
    private static final String SIMULATION = "GAME_SIMULATION";

    private static final String REDUCED_SOLAR_INPUT = "REDUCED_SOLAR_INPUT";
    private static final String ESSENTIAL_PRIORITY = "ESSENTIAL_OPERATIONS_PRIORITY";

    private static final List<Choice> DAY_ONE_CHOICES = List.of(
            new Choice(
                    "reduce_non_essential_loads",
                    "Reduce Non-Essential Loads",
                    "Turn off equipment that is not essential right now to reduce the base's energy demand.",
                    "Trade-off: Essential operations keep priority, but optional activities may be delayed."
            ),
            new Choice(
                    "switch_to_backup_batteries",
                    "Switch to Backup Batteries",
                    "Use stored energy to keep important base systems running while solar production is reduced.",
                    "Trade-off: The base can continue operating for now, but its backup energy reserve is being used."
            ),
            new Choice(
                    "prioritize_life_support",
                    "Prioritize Life Support",
                    "Give life-support systems priority when distributing the available energy.",
                    "Trade-off: Critical crew-support systems receive priority, while lower-priority equipment and activities may be paused."
            )
    );

    public MissionResponse startMission() {
        return response(ACTIVE, DAY_ONE, dayOneEvent(), startState(), List.of(), List.of(), null, null);
    }

    public MissionResponse replay(DecisionHistoryRequest request) {
        if (request == null || request.decisions() == null || request.decisions().isEmpty()) {
            throw new GameRequestException("EMPTY_HISTORY", "Choose one Day 1 solution before confirming the decision.");
        }
        if (request.decisions().size() != 1) {
            throw new GameRequestException("DAY_1_ONLY", "Day 1 accepts exactly one decision. Days 2–4 are not available yet.");
        }

        DecisionInput input = request.decisions().get(0);
        if (input == null || !Integer.valueOf(DAY_ONE).equals(input.day())
                || input.choiceId() == null || input.choiceId().isBlank()) {
            throw new GameRequestException("INVALID_HISTORY", "The Day 1 decision must contain one valid choice for Day 1.");
        }

        Choice choice = DAY_ONE_CHOICES.stream()
                .filter(candidate -> candidate.id().equals(input.choiceId()))
                .findFirst()
                .orElseThrow(() -> new GameRequestException("INVALID_CHOICE", "That solution is not available for Day 1."));

        DecisionFeedback feedback = feedbackFor(choice);
        QualitativeState outcome = outcomeFor(choice.id());
        ResolvedChoice resolved = new ResolvedChoice(DAY_ONE, choice.title(), lessonFor(choice.id()));
        MissionResult result = new MissionResult(
                COMPLETE,
                "ESTABLISH THE BASE",
                "Day 1 is complete. The crew recorded a qualitative power plan for the fictional base scenario.",
                null,
                null,
                List.of(),
                List.of(
                        "The crew must protect essential systems when available energy changes.",
                        "Each solution makes a different trade-off; none is a NASA-prescribed procedure.",
                        "NASA-backed readings for this event are DATA UNAVAILABLE until the verified data package is added."
                ),
                List.of(resolved)
        );

        return response(
                COMPLETE,
                DAY_ONE,
                null,
                outcome,
                List.of(input),
                List.of("Solar-array objective inspected", "Qualitative power plan recorded"),
                feedback,
                result
        );
    }

    private MissionResponse response(
            String status,
            int day,
            Event event,
            QualitativeState state,
            List<DecisionInput> history,
            List<String> effects,
            DecisionFeedback feedback,
            MissionResult result
    ) {
        return new MissionResponse(status, day, TOTAL_DAYS, event, state, List.copyOf(effects),
                List.copyOf(history), feedback, result);
    }

    private Event dayOneEvent() {
        return new Event(
                DAY_ONE,
                "POWER DROP",
                "The base is receiving less solar power than expected. The crew must decide how to use the available energy. Some systems are essential for keeping the crew safe, while other activities can wait.",
                "DATA UNAVAILABLE — The verified NASA data package expected November 13, 2026 is not available yet. This is a fictional equipment condition for the educational simulation, not a live lunar event.",
                List.of(),
                DAY_ONE_CHOICES,
                DATA_UNAVAILABLE
        );
    }

    private QualitativeState startState() {
        return new QualitativeState(REDUCED_SOLAR_INPUT, "POWER_PLAN_PENDING", "AVAILABLE_NOT_MEASURED",
                "STANDARD_PRIORITY", DATA_UNAVAILABLE, SIMULATION);
    }

    private QualitativeState outcomeFor(String choiceId) {
        return switch (choiceId) {
            case "reduce_non_essential_loads" -> new QualitativeState(REDUCED_SOLAR_INPUT,
                    "NON_ESSENTIAL_LOADS_REDUCED", "HELD", ESSENTIAL_PRIORITY, DATA_UNAVAILABLE, SIMULATION);
            case "switch_to_backup_batteries" -> new QualitativeState(REDUCED_SOLAR_INPUT,
                    "BACKUP_POWER_SUPPORTING_OPERATIONS", "IN_USE", ESSENTIAL_PRIORITY, DATA_UNAVAILABLE, SIMULATION);
            case "prioritize_life_support" -> new QualitativeState(REDUCED_SOLAR_INPUT,
                    "LIFE_SUPPORT_PRIORITY", "HELD", "LIFE_SUPPORT_PRIORITY", DATA_UNAVAILABLE, SIMULATION);
            default -> throw new IllegalArgumentException("Unknown Day 1 choice: " + choiceId);
        };
    }

    private DecisionFeedback feedbackFor(Choice choice) {
        return switch (choice.id()) {
            case "reduce_non_essential_loads" -> new DecisionFeedback(
                    DAY_ONE, choice.id(), choice.title(), "Power plan recorded: reduce non-essential loads",
                    "Essential operations keep priority, but optional activities such as research or growing experiments may be delayed.",
                    "Reducing demand gives essential habitat systems room to keep working during the fictional power drop.",
                    "The base is ready for the next mission chapter; no NASA-backed measurement was changed.",
                    "Essential habitat operations", "Research and growing experiments may be delayed", "Backup reserve held");
            case "switch_to_backup_batteries" -> new DecisionFeedback(
                    DAY_ONE, choice.id(), choice.title(), "Power plan recorded: switch to backup batteries",
                    "The base can continue operating for now, but its backup energy reserve is being used.",
                    "Stored energy supports important systems while solar production is reduced in the fictional scenario.",
                    "The base is ready for the next mission chapter; the reserve state is qualitative, not a measured capacity.",
                    "Important base systems for now", "Backup energy reserve is being used", "Backup reserve in use");
            case "prioritize_life_support" -> new DecisionFeedback(
                    DAY_ONE, choice.id(), choice.title(), "Power plan recorded: prioritize life support",
                    "Critical crew-support systems receive priority, while lower-priority equipment and activities may be paused.",
                    "The crew chose to direct the available energy toward systems that help keep people safe.",
                    "The base is ready for the next mission chapter; this is an educational simulation state, not an operational NASA recommendation.",
                    "Critical crew-support systems", "Lower-priority equipment and activities may be paused", "Backup reserve held");
            default -> throw new IllegalArgumentException("Unknown Day 1 choice: " + choice.id());
        };
    }

    private String lessonFor(String choiceId) {
        return switch (choiceId) {
            case "reduce_non_essential_loads" -> "Reducing demand can protect essential operations when available energy changes.";
            case "switch_to_backup_batteries" -> "Stored energy can support important systems, but using it changes the reserve state.";
            case "prioritize_life_support" -> "A crew can prioritize life-support systems while pausing lower-priority activities.";
            default -> "The crew recorded a power-budgeting decision.";
        };
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
