package com.school.grade.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class GradeResponse {
    private Long id;
    private Long studentId;
    private Long courseId;
    private Long teacherId;
    private BigDecimal score;
    private String letterGrade;
    private String feedback;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
