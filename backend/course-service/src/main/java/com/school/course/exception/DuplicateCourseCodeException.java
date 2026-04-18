package com.school.course.exception;

public class DuplicateCourseCodeException extends RuntimeException {
    public DuplicateCourseCodeException(String code) {
        super("Course code already exists: " + code);
    }
}
