package com.physim.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends AppException {
    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND, "NOT_FOUND");
    }

    public ResourceNotFoundException() {
        super("Resource not found.", HttpStatus.NOT_FOUND, "NOT_FOUND");
    }
}
