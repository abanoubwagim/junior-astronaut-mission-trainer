package org.juniorastronaut.missiontrainer.integration.nasa.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record DonkiSepResponse(
        String sepID,
        String eventTime,
        List<Instrument> instruments,
        String link,
        List<LinkedEvent> linkedEvents,
        List<Notification> sentNotifications,
        String submissionTime,
        Integer versionId
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Instrument(String displayName) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record LinkedEvent(String activityID) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Notification(String messageID, String messageIssueTime, String messageURL) {
    }
}
