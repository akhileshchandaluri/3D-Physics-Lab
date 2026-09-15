package com.physim.exception;

import org.springframework.http.HttpStatus;

public class BadRequestException extends AppException {
    public BadRequestException(String message) {
        super(message, HttpStatus.BAD_REQUEST, "BAD_REQUEST");
    }

    public BadRequestException(String message, Object details) {
        super(message, HttpStatus.BAD_REQUEST, "BAD_REQUEST", details);
    }
}
