package org.juniorastronaut.missiontrainer.integration.nasa.client;

public class DonkiClientException extends RuntimeException {
    private final boolean retryable;

    public DonkiClientException(String message, boolean retryable, Throwable cause) {
        super(message, cause);
        this.retryable = retryable;
    }

    public boolean retryable() {
        return retryable;
    }
}
