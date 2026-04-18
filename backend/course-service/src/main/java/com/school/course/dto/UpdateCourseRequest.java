package com.school.course.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UpdateCourseRequest {

    @Size(max = 150)
    private String name;

    private String description;

    @Min(1) @Max(500)
    private Integer capacity;

    @Min(1) @Max(6)
    private Integer creditHours;
}
