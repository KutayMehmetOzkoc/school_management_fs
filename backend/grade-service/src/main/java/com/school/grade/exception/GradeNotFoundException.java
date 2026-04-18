package com.school.grade.exception;

public class GradeNotFoundException extends RuntimeException {
    public GradeNotFoundException(Long id) {
        super("Grade not found with id: " + id);
    }
}
