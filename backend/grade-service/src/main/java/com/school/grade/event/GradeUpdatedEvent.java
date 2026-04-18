package com.school.grade.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeUpdatedEvent {
    private Long gradeId;
    private Long studentId;
    private Long courseId;
    private BigDecimal score;
    private String letterGrade;
    private LocalDateTime occurredAt;
}
