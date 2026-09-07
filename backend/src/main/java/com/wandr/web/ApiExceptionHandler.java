package com.wandr.web;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<Map<String, Object>> handleStatus(ResponseStatusException ex) {
    HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
    return body(status, codeFor(status), ex.getReason() != null ? ex.getReason() : status.getReasonPhrase());
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
    String message = ex.getBindingResult().getFieldErrors().stream()
        .findFirst()
        .map(err -> err.getField() + ": " + err.getDefaultMessage())
        .orElse("Validation failed");
    return body(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message);
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<Map<String, Object>> handleAccess(AccessDeniedException ex) {
    return body(HttpStatus.FORBIDDEN, "AUTH_ERROR", "Access denied");
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handleOther(Exception ex, HttpServletRequest request) {
    return body(HttpStatus.INTERNAL_SERVER_ERROR, "SERVER_ERROR", "Something went wrong");
  }

  private static ResponseEntity<Map<String, Object>> body(HttpStatus status, String code, String message) {
    Map<String, Object> map = new LinkedHashMap<>();
    map.put("timestamp", Instant.now().toString());
    map.put("status", status.value());
    map.put("code", code);
    map.put("message", message);
    map.put("requestId", MDC.get(RequestIdFilter.MDC_KEY));
    return ResponseEntity.status(status).body(map);
  }

  private static String codeFor(HttpStatus status) {
    return switch (status) {
      case UNAUTHORIZED, FORBIDDEN -> "AUTH_ERROR";
      case BAD_REQUEST -> "VALIDATION_ERROR";
      case TOO_MANY_REQUESTS -> "RATE_LIMITED";
      case REQUEST_TIMEOUT -> "TIMEOUT";
      case SERVICE_UNAVAILABLE, BAD_GATEWAY, GATEWAY_TIMEOUT -> "SERVICE_UNAVAILABLE";
      case NOT_FOUND -> "NOT_FOUND";
      default -> status.is5xxServerError() ? "SERVER_ERROR" : "ERROR";
    };
  }
}
