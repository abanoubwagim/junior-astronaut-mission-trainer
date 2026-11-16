package org.juniorastronaut.missiontrainer.integration.nasa.client;

import lombok.AllArgsConstructor;
import org.juniorastronaut.missiontrainer.integration.nasa.dto.DonkiSepResponse;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@AllArgsConstructor
public class DonkiRestClient implements DonkiClient {
    private static final int MAX_WINDOW_DAYS = 60;
    private final RestClient restClient;

    @Override
    public List<DonkiSepResponse> fetchSolarParticleEvents(LocalDate startDate, LocalDate endDate) {
        validateWindow(startDate, endDate);
        DonkiClientException lastFailure = null;
        for (int attempt = 0; attempt < 2; attempt++) {
            try {
                return request(startDate, endDate);
            } catch (DonkiClientException exception) {
                lastFailure = exception;
                if (!exception.retryable() || attempt == 1) throw exception;
                pauseBeforeRetry();
            }
        }
        throw lastFailure == null
                ? new DonkiClientException("DONKI request failed", true, null)
                : lastFailure;
    }

    private List<DonkiSepResponse> request(LocalDate startDate, LocalDate endDate) {
        try {
            List<DonkiSepResponse> events = restClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/get/SEP")
                            .queryParam("startDate", startDate)
                            .queryParam("endDate", endDate)
                            .queryParam("catalog", "M2M_CATALOG")
                            .queryParam("version", "Latest")
                            .build())
                    .retrieve()
                    .onStatus(status -> status.value() == 429,
                            (request, httpResponse) -> {
                                throw new DonkiClientException("DONKI rate limit response", false, null);
                            })
                    .body(new ParameterizedTypeReference<>() {
                    });
            if (events == null || events.stream().anyMatch(value -> value == null)) {
                throw new DonkiClientException("DONKI returned a malformed response", false, null);
            }
            return List.copyOf(events);
        } catch (DonkiClientException exception) {
            throw exception;
        } catch (RestClientResponseException exception) {
            HttpStatusCode status = exception.getStatusCode();
            boolean retryable = status.is5xxServerError();
            throw new DonkiClientException("DONKI returned HTTP " + status.value(), retryable, exception);
        } catch (ResourceAccessException exception) {
            throw new DonkiClientException("DONKI request timed out or could not connect", true, exception);
        } catch (RuntimeException exception) {
            throw new DonkiClientException("DONKI returned an unreadable response", false, exception);
        }
    }

    private void validateWindow(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null || endDate.isBefore(startDate)
                || ChronoUnit.DAYS.between(startDate, endDate) > MAX_WINDOW_DAYS) {
            throw new DonkiClientException("DONKI date window must be 0–60 days and ordered", false, null);
        }
    }

    private void pauseBeforeRetry() {
        try {
            Thread.sleep(150);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new DonkiClientException("DONKI retry interrupted", false, exception);
        }
    }
}
