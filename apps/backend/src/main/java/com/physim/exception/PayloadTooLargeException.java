package com.physim.exception;

import org.springframework.http.HttpStatus;

public class PayloadTooLargeException extends AppException {
    public PayloadTooLargeException(String message) {
        super(message, HttpStatus.PAYLOAD_TOO_LARGE, "PAYLOAD_TOO_LARGE");
    }
}
