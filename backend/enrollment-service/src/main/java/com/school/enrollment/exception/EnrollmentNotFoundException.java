package com.school.enrollment.exception;

public class EnrollmentNotFoundException extends RuntimeException {
    public EnrollmentNotFoundException(String identifier) {
        super("Enrollment not found: " + identifier);
    }
}
