package org.juniorastronaut.missiontrainer.integration.nasa.mapper;

import org.juniorastronaut.missiontrainer.core.science.ScientificDataClassification;
import org.juniorastronaut.missiontrainer.core.science.ScientificDataStatus;
import org.juniorastronaut.missiontrainer.core.science.ScientificEvidenceRecord;
import org.juniorastronaut.missiontrainer.integration.nasa.dto.DonkiSepResponse;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
public class DonkiMapper {
    private static final String DONKI_URL = "https://ccmc.gsfc.nasa.gov/DONKI";
    private static final DateTimeFormatter DONKI_INSTANT_FORMAT = new DateTimeFormatterBuilder()
            .append(DateTimeFormatter.ISO_LOCAL_DATE)
            .appendLiteral('T')
            .appendPattern("HH:mm")
            .optionalStart()
            .appendPattern(":ss")
            .optionalEnd()
            .appendOffsetId()
            .toFormatter();

    public List<ScientificEvidenceRecord> toEvidence(List<DonkiSepResponse> responses, Instant retrievedAt,
                                                     ScientificDataStatus status) {
        return responses.stream()
                .map(response -> toEvidence(response, retrievedAt, status))
                .toList();
    }

    public ScientificEvidenceRecord toEvidence(DonkiSepResponse response, Instant retrievedAt,
                                                ScientificDataStatus status) {
        Instant eventTime = parseInstant(response.eventTime());
        String instruments = response.instruments() == null ? "not reported"
                : response.instruments().stream()
                .map(DonkiSepResponse.Instrument::displayName)
                .filter(Objects::nonNull)
                .collect(Collectors.joining(", "));
        return new ScientificEvidenceRecord(
                "NASA Community Coordinated Modeling Center (CCMC) DONKI",
                "DONKI_SEP",
                response.link() == null || response.link().isBlank() ? DONKI_URL : response.link(),
                eventTime,
                retrievedAt,
                null,
                null,
                "Solar energetic particle event " + safe(response.sepID()) + "; instruments: " + instruments + ".",
                "Solar/near-Earth space-weather catalog; not a lunar surface measurement",
                "Event record at the published event time; not a forecast validity window",
                "DONKI does not provide local lunar fluence, absorbed dose, shelter attenuation, exposure duration, or survival probability.",
                ScientificDataClassification.REAL_NASA_DATA,
                status);
    }

    public ScientificEvidenceRecord emptyWindow(Instant retrievedAt, String windowDescription) {
        return new ScientificEvidenceRecord(
                "NASA Community Coordinated Modeling Center (CCMC) DONKI",
                "DONKI_SEP",
                DONKI_URL,
                null,
                retrievedAt,
                null,
                null,
                "DONKI returned no SEP records for the requested " + windowDescription + ".",
                "Requested catalog/window only; an empty response is not evidence that no radiation risk exists",
                windowDescription,
                "No event was returned. This record must not be converted into a zero radiation value or a safe-state claim.",
                ScientificDataClassification.REAL_NASA_DATA,
                ScientificDataStatus.LIVE);
    }

    public ScientificEvidenceRecord unavailable(Instant retrievedAt) {
        return new ScientificEvidenceRecord(
                "NASA Community Coordinated Modeling Center (CCMC) DONKI",
                "DONKI_SEP",
                DONKI_URL,
                null,
                retrievedAt,
                null,
                null,
                "NASA DONKI data is currently unavailable.",
                "No lunar applicability can be established while the source is unavailable",
                "Unavailable",
                "No measurement or risk conclusion is supplied. The mission remains usable because gameplay does not depend on live NASA data.",
                ScientificDataClassification.REAL_NASA_DATA,
                ScientificDataStatus.UNAVAILABLE);
    }

    private Instant parseInstant(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Instant.parse(value);
        } catch (RuntimeException exception) {
            try {
                return OffsetDateTime.parse(value, DONKI_INSTANT_FORMAT).toInstant();
            } catch (RuntimeException ignored) {
                return null;
            }
        }
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "unidentified" : value;
    }
}
