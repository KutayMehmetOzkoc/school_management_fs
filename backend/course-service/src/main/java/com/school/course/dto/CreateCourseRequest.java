package com.school.course.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateCourseRequest {

    @NotBlank(message = "Course code is required")
    @Size(min = 3, max = 20, message = "Course code must be between 3 and 20 characters")
    private String code;

    @NotBlank(message = "Course name is required")
    @Size(max = 150, message = "Course name must not exceed 150 characters")
    private String name;

    private String description;

    @NotNull(message = "Teacher ID is required")
    @Positive(message = "Teacher ID must be positive")
    private Long teacherId;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    @Max(value = 500, message = "Capacity cannot exceed 500")
    private Integer capacity;

    @NotNull(message = "Credit hours is required")
    @Min(value = 1, message = "Credit hours must be at least 1")
    @Max(value = 6, message = "Credit hours cannot exceed 6")
    private Integer creditHours;
}
