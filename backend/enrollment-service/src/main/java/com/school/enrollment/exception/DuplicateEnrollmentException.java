package com.school.enrollment.exception;

public class DuplicateEnrollmentException extends RuntimeException {
    public DuplicateEnrollmentException(Long studentId, Long courseId) {
        super("Student " + studentId + " is already enrolled or pending for course " + courseId);
    }
}
