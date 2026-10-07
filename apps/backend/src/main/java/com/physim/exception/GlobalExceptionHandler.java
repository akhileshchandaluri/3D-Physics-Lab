package com.physim.exception;

import com.physim.dto.ApiErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiErrorResponse> handleAppException(AppException ex) {
        log.warn("Application exception: [{}] {}", ex.getCode(), ex.getMessage());
        ApiErrorResponse body = new ApiErrorResponse(ex.getMessage(), ex.getCode(), ex.getDetails());
        return ResponseEntity.status(ex.getStatus()).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }
        log.warn("Validation failure: {}", fieldErrors);
        ApiErrorResponse body = new ApiErrorResponse("Request validation failed", "VALIDATION_ERROR", fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDeniedException(AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());
        ApiErrorResponse body = new ApiErrorResponse("Access denied: insufficient permissions", "FORBIDDEN");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthenticationException(AuthenticationException ex) {
        log.warn("Authentication failure: {}", ex.getMessage());
        ApiErrorResponse body = new ApiErrorResponse("Authentication required. Please log in.", "UNAUTHORIZED");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNoResourceFound(NoResourceFoundException ex) {
        ApiErrorResponse body = new ApiErrorResponse("Endpoint not found", "NOT_FOUND");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodNotSupported(
            org.springframework.web.HttpRequestMethodNotSupportedException ex) {
        log.warn("Unsupported HTTP method: {}", ex.getMessage());
        ApiErrorResponse body = new ApiErrorResponse("This action is not supported.", "METHOD_NOT_ALLOWED");
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(body);
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrityViolation(org.springframework.dao.DataIntegrityViolationException ex) {
        log.warn("Data integrity violation: {}", ex.getMessage());
        ApiErrorResponse body = new ApiErrorResponse("A conflict occurred or record already exists.", "CONFLICT");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleHttpMessageNotReadable(org.springframework.http.converter.HttpMessageNotReadableException ex) {
        log.warn("Malformed request payload: {}", ex.getMessage());
        ApiErrorResponse body = new ApiErrorResponse("Malformed request payload or invalid field format", "BAD_REQUEST");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(AccountLinkingRequiredException.class)
    public ResponseEntity<java.util.Map<String, Object>> handleAccountLinkingRequired(AccountLinkingRequiredException ex) {
        log.info("OAuth account linking required for email: {}", ex.getEmail());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(java.util.Map.of(
                "error", "ACCOUNT_LINKING_REQUIRED",
                "message", ex.getMessage(),
                "email", ex.getEmail(),
                "linkToken", ex.getLinkToken()
        ));
    }

    @ExceptionHandler({
            com.yubico.webauthn.exception.RegistrationFailedException.class,
            com.yubico.webauthn.exception.AssertionFailedException.class
    })
    public ResponseEntity<ApiErrorResponse> handleWebAuthnFailure(Exception ex) {
        log.warn("WebAuthn ceremony failed: {}", ex.getMessage());
        ApiErrorResponse body = new ApiErrorResponse(
                "The browser check failed. Try again or use your authenticator code.",
                "UNAUTHORIZED");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(Exception ex) {
        log.error("Unhandled server exception:", ex);
        ApiErrorResponse body = new ApiErrorResponse("Internal server error", "INTERNAL_SERVER_ERROR");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
