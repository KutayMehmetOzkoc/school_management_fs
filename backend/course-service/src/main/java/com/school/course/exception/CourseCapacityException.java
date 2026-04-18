package com.school.course.exception;

public class CourseCapacityException extends RuntimeException {
    public CourseCapacityException(Long courseId) {
        super("Course with id " + courseId + " has no available capacity");
    }
}
