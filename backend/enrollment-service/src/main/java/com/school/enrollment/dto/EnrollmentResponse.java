package com.school.enrollment.dto;

import com.school.enrollment.entity.EnrollmentStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EnrollmentResponse {
    private Long id;
    private Long studentId;
    private Long courseId;
    private EnrollmentStatus status;
    private String sagaId;
    private String failureReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
