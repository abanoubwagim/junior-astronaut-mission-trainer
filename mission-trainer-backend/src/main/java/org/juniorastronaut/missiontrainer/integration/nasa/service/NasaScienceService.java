package org.juniorastronaut.missiontrainer.integration.nasa.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.juniorastronaut.missiontrainer.core.science.ScientificDataStatus;
import org.juniorastronaut.missiontrainer.core.science.ScientificEvidenceRecord;
import org.juniorastronaut.missiontrainer.integration.nasa.client.DonkiClient;
import org.juniorastronaut.missiontrainer.integration.nasa.client.DonkiClientException;
import org.juniorastronaut.missiontrainer.integration.nasa.config.NasaProperties;
import org.juniorastronaut.missiontrainer.integration.nasa.dto.DonkiSepResponse;
import org.juniorastronaut.missiontrainer.integration.nasa.mapper.DonkiMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Fetches DONKI context without allowing external data to alter game replay. */
@Service
public class NasaScienceService implements ScienceEvidenceService {
    private static final Logger log = LoggerFactory.getLogger(NasaScienceService.class);

    private final DonkiClient donkiClient;
    private final DonkiMapper mapper;
    private final NasaProperties properties;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private volatile CachedSnapshot cachedSnapshot;

    @Autowired
    public NasaScienceService(DonkiClient donkiClient, DonkiMapper mapper, NasaProperties properties,
                              ObjectMapper objectMapper) {
        this(donkiClient, mapper, properties, objectMapper, Clock.systemUTC());
    }

    NasaScienceService(DonkiClient donkiClient, DonkiMapper mapper, NasaProperties properties,
                       ObjectMapper objectMapper, Clock clock) {
        this.donkiClient = donkiClient;
        this.mapper = mapper;
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    @Override
    public List<ScientificEvidenceRecord> currentSolarParticleEvidence() {
        Instant now = clock.instant();
        CachedSnapshot snapshot = cachedSnapshot;
        if (snapshot != null && now.isBefore(snapshot.expiresAt())) {
            return withStatus(snapshot.records(), ScientificDataStatus.CACHED);
        }

        try {
            LocalDate endDate = LocalDate.now(clock);
            int lookbackDays = Math.max(0, Math.min(properties.getLookbackDays(), 60));
            LocalDate startDate = endDate.minusDays(lookbackDays);
            List<DonkiSepResponse> response = donkiClient.fetchSolarParticleEvents(startDate, endDate);
            List<ScientificEvidenceRecord> records = response.isEmpty()
                    ? List.of(mapper.emptyWindow(now, lookbackDays + "-day DONKI SEP query window"))
                    : mapper.toEvidence(response, now, ScientificDataStatus.LIVE);
            cachedSnapshot = new CachedSnapshot(records, now.plus(properties.getCacheTtl()));
            return records;
        } catch (DonkiClientException exception) {
            log.warn("NASA DONKI unavailable; using an archived evidence snapshot when available");
            try {
                List<ScientificEvidenceRecord> archived = loadArchivedSnapshot();
                cachedSnapshot = new CachedSnapshot(archived, now.plus(properties.getCacheTtl()));
                return archived;
            } catch (RuntimeException fallbackFailure) {
                log.error("NASA DONKI archived fallback is unavailable");
                return List.of(mapper.unavailable(now));
            }
        }
    }

    private List<ScientificEvidenceRecord> loadArchivedSnapshot() {
        try {
            JsonNode root = objectMapper.readTree(new ClassPathResource(properties.getFallbackResource()).getInputStream());
            Instant retrievedAt = Instant.parse(root.path("retrieval_utc").asText());
            List<DonkiSepResponse> events = objectMapper.convertValue(
                    root.path("response"), objectMapper.getTypeFactory().constructCollectionType(List.class, DonkiSepResponse.class));
            if (events.isEmpty()) return List.of(mapper.emptyWindow(retrievedAt, "archived DONKI sample window"));
            return mapper.toEvidence(events, retrievedAt, ScientificDataStatus.ARCHIVED);
        } catch (IOException | RuntimeException exception) {
            throw new IllegalStateException("Could not load archived NASA evidence", exception);
        }
    }

    private List<ScientificEvidenceRecord> withStatus(List<ScientificEvidenceRecord> records,
                                                        ScientificDataStatus status) {
        return records.stream().map(record -> record.withStatus(status)).toList();
    }

    private record CachedSnapshot(List<ScientificEvidenceRecord> records, Instant expiresAt) {
    }
}
