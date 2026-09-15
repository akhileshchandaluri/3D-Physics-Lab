package com.physim.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

    private ErrorDetail error;

    public ApiErrorResponse() {
    }

    public ApiErrorResponse(String message, String code) {
        this.error = new ErrorDetail(message, code, null);
    }

    public ApiErrorResponse(String message, String code, Object details) {
        this.error = new ErrorDetail(message, code, details);
    }

    public ErrorDetail getError() {
        return error;
    }

    public void setError(ErrorDetail error) {
        this.error = error;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorDetail {
        private String message;
        private String code;
        private Object details;

        public ErrorDetail() {
        }

        public ErrorDetail(String message, String code, Object details) {
            this.message = message;
            this.code = code;
            this.details = details;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public Object getDetails() {
            return details;
        }

        public void setDetails(Object details) {
            this.details = details;
        }
    }
}
