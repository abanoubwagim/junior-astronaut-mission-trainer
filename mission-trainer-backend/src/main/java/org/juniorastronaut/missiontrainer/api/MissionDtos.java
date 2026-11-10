package org.juniorastronaut.missiontrainer.api;

import java.util.List;

public final class MissionDtos {
    private MissionDtos() {
    }

    public record HealthResponse(String status) {
    }

    public record DecisionHistoryRequest(List<DecisionInput> decisions) {
    }

    public record DecisionInput(Integer day, String choiceId) {
    }

    public record Choice(String id, String title, String description, String tradeoff) {
    }

    public record ScienceSource(String title, String url) {
    }

    public record Event(
            int day,
            String title,
            String situation,
            String scienceFact,
            List<ScienceSource> scienceSources,
            List<Choice> choices,
            String dataStatus
    ) {
    }

    /**
     * Qualitative game state only. These labels are not measurements and are
     * intentionally kept separate from the NASA data integration point.
     */
    public record QualitativeState(
            String solarInput,
            String powerAllocation,
            String backupReserve,
            String crewSupport,
            String dataStatus,
            String valueOrigin
    ) {
    }

    public record DecisionFeedback(
            int day,
            String choiceId,
            String choiceTitle,
            String headline,
            String explanation,
            String whyItMatters,
            String futureEffect,
            String preserved,
            String reducedOrDelayed,
            String reserveState
    ) {
    }

    public record ResolvedChoice(int day, String title, String lesson) {
    }

    public record MissionResult(
            String status,
            String title,
            String summary,
            String limitingResource,
            String primaryFailureReason,
            List<String> secondaryFailureReasons,
            List<String> takeaways,
            List<ResolvedChoice> decisions
    ) {
    }

    public record MissionResponse(
            String status,
            int day,
            int totalDays,
            Event event,
            QualitativeState qualitativeState,
            List<String> activeEffects,
            List<DecisionInput> decisionHistory,
            DecisionFeedback latestDecision,
            MissionResult result
    ) {
    }
}
