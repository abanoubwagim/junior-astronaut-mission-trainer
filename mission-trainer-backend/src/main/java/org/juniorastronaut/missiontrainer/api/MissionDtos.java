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

    public record Choice(
            String id,
            String title,
            String description,
            String immediateBenefit,
            String tradeoff
    ) {
    }

    public record ScienceSource(String title, String url) {
    }

    public record EvidenceSource(
            String organization,
            String title,
            String url,
            String dataUrl
    ) {
    }

    public record ProjectedCoordinate(
            double x,
            double y
    ) {
    }

    public record DatasetHash(
            String datasetId,
            String sha256
    ) {
    }

    public record EvidenceProvenance(
            String methodologyId,
            List<String> sourceDatasetIds,
            List<String> sourceKernelIds,
            List<DatasetHash> originalDatasetHashes,
            String bundledArtifactChecksumStatus
    ) {
    }

    /**
     * Immutable, offline evidence returned with the Day 1 event. NASA source
     * provenance and team-derived interpretation are intentionally separate
     * fields; none of these values represent live telemetry or power output.
     */
    public record ScientificEvidence(
            String evidenceId,
            String manifestVersion,
            String classification,
            EvidenceSource nasaSource,
            String datasetIdentifier,
            String datasetSourcePath,
            String researchSite,
            String candidateId,
            ProjectedCoordinate projectedCoordinate,
            String projectionDescription,
            String referenceFrame,
            String epochUtc,
            List<Integer> testedHeightsM,
            String idealizedHorizonResult,
            String localTerrainObstructionResult,
            List<String> testedDemModelIds,
            String independentVerificationClassification,
            String frameReviewStatus,
            String day1ScientificDecision,
            String educationalExplanation,
            String childFriendlyExplanation,
            String teamAnalysisSummary,
            Double minimumReportedObstructionMarginDeg,
            List<String> limitationNotes,
            EvidenceProvenance provenance,
            String electricalPowerMeasurementStatus
    ) {
    }

    public record InspectionReport(
            String arrayCondition,
            String sunlightExposure,
            String powerGeneration,
            String eventCause
    ) {
    }

    public record SystemStatus(String system, String status) {
    }

    public record Event(
            int day,
            String title,
            String description,
            String scientificExplanation,
            String eventCause,
            InspectionReport inspectionReport,
            List<ScienceSource> scienceSources,
            List<Choice> choices,
            String dataStatus,
            String valueOrigin,
            List<SystemStatus> systemReport,
            String contextNote,
            ScientificEvidence scientificEvidence
    ) {
        public Event(
                int day,
                String title,
                String description,
                String scientificExplanation,
                String eventCause,
                InspectionReport inspectionReport,
                List<ScienceSource> scienceSources,
                List<Choice> choices,
                String dataStatus,
                String valueOrigin
        ) {
            this(day, title, description, scientificExplanation, eventCause, inspectionReport,
                    scienceSources, choices, dataStatus, valueOrigin, List.of(), "");
        }

        public Event(
                int day,
                String title,
                String description,
                String scientificExplanation,
                String eventCause,
                InspectionReport inspectionReport,
                List<ScienceSource> scienceSources,
                List<Choice> choices,
                String dataStatus,
                String valueOrigin,
                List<SystemStatus> systemReport,
                String contextNote
        ) {
            this(day, title, description, scientificExplanation, eventCause, inspectionReport,
                    scienceSources, choices, dataStatus, valueOrigin, systemReport, contextNote, null);
        }

        public Event(
                int day,
                String title,
                String description,
                String scientificExplanation,
                String eventCause,
                InspectionReport inspectionReport,
                List<ScienceSource> scienceSources,
                List<Choice> choices,
                String dataStatus,
                String valueOrigin,
                ScientificEvidence scientificEvidence
        ) {
            this(day, title, description, scientificExplanation, eventCause, inspectionReport,
                    scienceSources, choices, dataStatus, valueOrigin, List.of(), "", scientificEvidence);
        }
    }

    /**
     * Qualitative simulation state. These labels are game state, not NASA
     * measurements and do not carry physical units.
     */
    public record QualitativeState(
            String solarInput,
            String arrayCondition,
            String sunlightExposure,
            String eventCause,
            String backupReserve,
            String powerDemand,
            String powerAllocation,
            String verticalArrayStatus,
            String dataStatus,
            String valueOrigin,
            String waterRecoveryStatus,
            String potableWaterSupply,
            String waterQualityVerification,
            String crewLifeSupport,
            String recoveredWaterDisposition,
            String dayTwoPersistentState,
            String storedFoodSupply,
            String cropProductionUnit,
            String cropGrowth,
            String approvedWaterForCrops,
            String powerAvailability,
            String dayThreePersistentState,
            String cropOperationStatus,
            String cropOperationalConstraint,
            String approvedWaterForShielding,
            String packagedFoodForShielding,
            String evaStatus,
            String crewLocation,
            String primaryShielding,
            String supplementaryShielding,
            String dayFourPersistentState,
            String dayFourOperationalConstraint
    ) {
        public QualitativeState(
                String solarInput,
                String arrayCondition,
                String sunlightExposure,
                String eventCause,
                String backupReserve,
                String powerDemand,
                String powerAllocation,
                String verticalArrayStatus,
                String dataStatus,
                String valueOrigin,
                String waterRecoveryStatus,
                String potableWaterSupply,
                String waterQualityVerification,
                String crewLifeSupport,
                String recoveredWaterDisposition,
                String dayTwoPersistentState,
                String storedFoodSupply,
                String cropProductionUnit,
                String cropGrowth,
                String approvedWaterForCrops,
                String powerAvailability,
                String dayThreePersistentState,
                String cropOperationStatus,
                String cropOperationalConstraint
        ) {
            this(solarInput, arrayCondition, sunlightExposure, eventCause, backupReserve,
                    powerDemand, powerAllocation, verticalArrayStatus, dataStatus, valueOrigin,
                    waterRecoveryStatus, potableWaterSupply, waterQualityVerification,
                    crewLifeSupport, recoveredWaterDisposition, dayTwoPersistentState,
                    storedFoodSupply, cropProductionUnit, cropGrowth, approvedWaterForCrops,
                    powerAvailability, dayThreePersistentState, cropOperationStatus,
                    cropOperationalConstraint,
                    "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED",
                    "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED");
        }

        public QualitativeState(
                String solarInput,
                String arrayCondition,
                String sunlightExposure,
                String eventCause,
                String backupReserve,
                String powerDemand,
                String powerAllocation,
                String verticalArrayStatus,
                String dataStatus,
                String valueOrigin,
                String waterRecoveryStatus,
                String potableWaterSupply,
                String waterQualityVerification,
                String crewLifeSupport,
                String recoveredWaterDisposition,
                String dayTwoPersistentState
        ) {
            this(solarInput, arrayCondition, sunlightExposure, eventCause, backupReserve,
                    powerDemand, powerAllocation, verticalArrayStatus, dataStatus, valueOrigin,
                    waterRecoveryStatus, potableWaterSupply, waterQualityVerification,
                    crewLifeSupport, recoveredWaterDisposition, dayTwoPersistentState,
                    "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED",
                    "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED",
                    "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED",
                    "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED");
        }

        public QualitativeState(
                String solarInput,
                String arrayCondition,
                String sunlightExposure,
                String eventCause,
                String backupReserve,
                String powerDemand,
                String powerAllocation,
                String verticalArrayStatus,
                String dataStatus,
                String valueOrigin
        ) {
            this(solarInput, arrayCondition, sunlightExposure, eventCause, backupReserve,
                    powerDemand, powerAllocation, verticalArrayStatus, dataStatus, valueOrigin,
                    "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED",
                    "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED",
                    "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED",
                    "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED",
                    "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED", "NOT_REPORTED",
                    "NOT_REPORTED", "NOT_REPORTED");
        }
    }

    public record ActiveEffect(
            String id,
            String label,
            String state,
            String description
    ) {
    }

    public record DecisionFeedback(
            int day,
            String choiceId,
            String choiceTitle,
            String resultMessage,
            String explanation,
            String preserved,
            String reducedOrDelayed,
            String backupReserve,
            String persistentEffect,
            String scientificTakeaway
    ) {
    }

    public record ResolvedChoice(
            int day,
            String choiceId,
            String title
    ) {
    }

    public record MissionResult(
            String status,
            String title,
            String summary,
            ResolvedChoice selectedDecision,
            String preserved,
            String reducedOrDelayed,
            String powerStatus,
            String backupReserve,
            List<ActiveEffect> persistentEffects,
            String scientificTakeaway,
            boolean nextChapterAvailable,
            String nextChapterMessage
    ) {
    }

    public record MissionResponse(
            String status,
            int day,
            int totalDays,
            Event event,
            QualitativeState qualitativeState,
            List<ActiveEffect> activeEffects,
            List<DecisionInput> decisionHistory,
            DecisionFeedback latestDecision,
            MissionResult result
    ) {
    }
}
