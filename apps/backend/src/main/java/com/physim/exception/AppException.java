package com.physim.exception;

import org.springframework.http.HttpStatus;

public class AppException extends RuntimeException {

    private final HttpStatus status;
    private final String code;
    private final Object details;

    public AppException(String message, HttpStatus status, String code) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = null;
    }

    public AppException(String message, HttpStatus status, String code, Object details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }

    public Object getDetails() {
        return details;
    }
}
