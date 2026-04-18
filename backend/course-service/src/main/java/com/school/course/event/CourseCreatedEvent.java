package com.school.course.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseCreatedEvent {
    private Long courseId;
    private String courseCode;
    private String courseName;
    private Long teacherId;
    private Integer capacity;
    private Integer creditHours;
    private LocalDateTime occurredAt;
}
