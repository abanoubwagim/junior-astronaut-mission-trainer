package org.juniorastronaut.missiontrainer.core.science;

import java.time.Instant;

/** Internal, unit-aware evidence record kept separate from game state. */
public record ScientificEvidenceRecord(
        String sourceName,
        String datasetIdentifier,
        String originalUrl,
        Instant observationDate,
        Instant retrievalTimestamp,
        Double measurementValue,
        String measurementUnit,
        String description,
        String geographicOrLunarApplicability,
        String validityPeriod,
        String uncertaintyOrLimitations,
        ScientificDataClassification classification,
        ScientificDataStatus status
) {
    public ScientificEvidenceRecord withStatus(ScientificDataStatus replacementStatus) {
        return new ScientificEvidenceRecord(sourceName, datasetIdentifier, originalUrl, observationDate,
                retrievalTimestamp, measurementValue, measurementUnit, description,
                geographicOrLunarApplicability, validityPeriod, uncertaintyOrLimitations,
                classification, replacementStatus);
    }
}
