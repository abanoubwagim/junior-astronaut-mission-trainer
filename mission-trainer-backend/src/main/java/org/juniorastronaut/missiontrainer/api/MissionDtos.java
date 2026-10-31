package org.juniorastronaut.missiontrainer.api;

import java.util.List;
import java.util.Map;

public final class MissionDtos {
    private MissionDtos() {
    }

    public record HealthResponse(String status) {
    }

    public record DecisionHistoryRequest(List<DecisionInput> decisions) {
    }

    public record DecisionInput(Integer day, String choiceId) {
    }

    public record ResourceValues(int power, int water, int food, int shelterReadiness) {
    }

    public record ResourceDefinition(
            String key,
            String label,
            int minimum,
            int maximum,
            String unit,
            String purpose
    ) {
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
            List<Choice> choices
    ) {
    }

    public record ResourceBreakdown(int before, int daily, int delayed, int event, int choice, int after, int change) {
    }

    public record DecisionFeedback(
            int day,
            String choiceId,
            String choiceTitle,
            String headline,
            String explanation,
            String whyItMatters,
            String futureEffect,
            Map<String, ResourceBreakdown> resourceBreakdown
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
            ResourceValues resources,
            List<ResourceDefinition> resourceDefinitions,
            Event event,
            List<String> activeEffects,
            List<DecisionInput> decisionHistory,
            SystemState systems,
            DecisionFeedback latestDecision,
            MissionResult result
    ) {
    }

    public record SystemState(
            boolean airLoopServiced,
            boolean shieldingPrepared,
            boolean shelterActivated,
            String shelterMode,
            boolean emergencyProtectionActivated,
            boolean protectionReady
    ) {
    }

}
