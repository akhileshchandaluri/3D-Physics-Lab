package com.physim.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedException extends AppException {
    public UnauthorizedException(String message) {
        super(message, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
    }

    public UnauthorizedException() {
        super("Authentication required. Please log in.", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
    }
}
