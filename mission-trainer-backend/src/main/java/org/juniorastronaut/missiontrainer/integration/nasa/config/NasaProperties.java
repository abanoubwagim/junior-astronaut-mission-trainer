package org.juniorastronaut.missiontrainer.integration.nasa.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/** Environment-backed settings for server-side NASA integrations. */
@Getter
@Setter
@ConfigurationProperties(prefix = "nasa")
public class NasaProperties {
    private String apiKey = "";
    private String donkiBaseUrl = "https://ccmc.gsfc.nasa.gov/DONKI-API";
    private Duration connectTimeout = Duration.ofSeconds(2);
    private Duration readTimeout = Duration.ofSeconds(4);
    private Duration cacheTtl = Duration.ofMinutes(15);
    private int lookbackDays = 30;
    private String fallbackResource = "nasa-evidence/donki/sep-2016-01-02.json";


}
