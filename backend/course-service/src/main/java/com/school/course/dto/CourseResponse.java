package com.school.course.dto;

import com.school.course.entity.CourseStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CourseResponse {
    private Long id;
    private String code;
    private String name;
    private String description;
    private Long teacherId;
    private Integer capacity;
    private Integer enrolledCount;
    private Integer availableSeats;
    private CourseStatus status;
    private Integer creditHours;
    private LocalDateTime createdAt;
}
