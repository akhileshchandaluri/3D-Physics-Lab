package com.physim.exception;

import org.springframework.http.HttpStatus;

public class ForbiddenException extends AppException {
    public ForbiddenException(String message) {
        super(message, HttpStatus.FORBIDDEN, "FORBIDDEN");
    }

    public ForbiddenException() {
        super("Access denied: insufficient permissions.", HttpStatus.FORBIDDEN, "FORBIDDEN");
    }
}
