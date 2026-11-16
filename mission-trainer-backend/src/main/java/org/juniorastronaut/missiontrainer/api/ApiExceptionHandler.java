package org.juniorastronaut.missiontrainer.api;

import org.juniorastronaut.missiontrainer.game.MissionRulesService.GameRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(GameRequestException.class)
    public ResponseEntity<ApiError> handleGameRequest(GameRequestException exception) {
        return ResponseEntity.badRequest().body(error(exception.code(), exception.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleMalformedRequest() {
        return ResponseEntity.badRequest().body(error("MALFORMED_REQUEST", "Send a valid JSON mission request."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception) {
        var fieldError = exception.getBindingResult().getFieldError();
        String field = fieldError == null ? null : fieldError.getField();
        String message = fieldError == null ? "The request contains invalid fields." : fieldError.getDefaultMessage();
        return ResponseEntity.badRequest().body(error("INVALID_REQUEST", message, field));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> handleNotFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(error("NOT_FOUND", "That API route does not exist."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpectedError(Exception exception){
        log.error("Unhandled API error", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error("INTERNAL_ERROR", "The mission service could not complete that request."));
    }

    private ApiError error(String code, String message) {
        return new ApiError(new ErrorDetail(code, message));
    }

    private ApiError error(String code, String message, String field) {
        return new ApiError(new ErrorDetail(code, message, field));
    }
}
