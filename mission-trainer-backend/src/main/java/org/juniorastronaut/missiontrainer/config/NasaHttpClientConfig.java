package org.juniorastronaut.missiontrainer.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.juniorastronaut.missiontrainer.integration.nasa.config.NasaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/** Builds the bounded-timeout HTTP client used by NASA adapters. */
@Configuration
public class NasaHttpClientConfig {
    @Bean
    ObjectMapper objectMapper() {
        return new ObjectMapper().findAndRegisterModules();
    }

    @Bean
    RestClient nasaRestClient(NasaProperties properties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(toMillis(properties.getConnectTimeout().toMillis()));
        requestFactory.setReadTimeout(toMillis(properties.getReadTimeout().toMillis()));
        return RestClient.builder()
                .baseUrl(properties.getDonkiBaseUrl())
                .requestFactory(requestFactory)
                .build();
    }

    private int toMillis(long durationMillis) {
        if (durationMillis < 1 || durationMillis > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("NASA HTTP timeout must be between 1 ms and Integer.MAX_VALUE ms");
        }
        return (int) durationMillis;
    }
}
