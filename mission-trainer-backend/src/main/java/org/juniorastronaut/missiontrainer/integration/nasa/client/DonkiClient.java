package org.juniorastronaut.missiontrainer.integration.nasa.client;

import org.juniorastronaut.missiontrainer.integration.nasa.dto.DonkiSepResponse;

import java.time.LocalDate;
import java.util.List;

public interface DonkiClient {
    List<DonkiSepResponse> fetchSolarParticleEvents(LocalDate startDate, LocalDate endDate);
}
