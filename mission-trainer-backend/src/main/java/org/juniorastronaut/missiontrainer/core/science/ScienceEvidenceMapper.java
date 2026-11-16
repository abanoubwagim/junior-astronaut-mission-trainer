package org.juniorastronaut.missiontrainer.core.science;

import org.juniorastronaut.missiontrainer.api.MissionDtos;

import java.util.List;

public final class ScienceEvidenceMapper {
    private ScienceEvidenceMapper() {
    }

    public static List<MissionDtos.ScientificEvidenceRecord> toApi(List<ScientificEvidenceRecord> records) {
        return records.stream().map(ScienceEvidenceMapper::toApi).toList();
    }

    public static MissionDtos.ScientificEvidenceRecord toApi(ScientificEvidenceRecord record) {
        return new MissionDtos.ScientificEvidenceRecord(
                record.sourceName(), record.datasetIdentifier(), record.originalUrl(),
                record.observationDate(), record.retrievalTimestamp(), record.measurementValue(),
                record.measurementUnit(), record.description(), record.geographicOrLunarApplicability(),
                record.validityPeriod(), record.uncertaintyOrLimitations(),
                record.classification().name(), record.status().name());
    }
}
