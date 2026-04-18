package com.school.grade.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class GradeRequest {

    @NotNull @Positive
    private Long studentId;

    @NotNull @Positive
    private Long courseId;

    @NotNull @Positive
    private Long teacherId;

    @NotNull
    @DecimalMin("0.00")
    @DecimalMax("100.00")
    private BigDecimal score;

    private String feedback;
}
