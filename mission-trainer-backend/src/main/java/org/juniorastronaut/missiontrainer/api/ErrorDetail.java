package org.juniorastronaut.missiontrainer.api;

public record ErrorDetail(String code, String message, String field) {
    public ErrorDetail(String code, String message) {
        this(code, message, null);
    }
}
