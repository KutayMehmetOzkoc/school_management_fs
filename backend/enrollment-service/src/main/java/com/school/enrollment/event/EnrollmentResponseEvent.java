package com.school.enrollment.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentResponseEvent {
    private String sagaId;
    private Long courseId;
    private Long studentId;
    private boolean approved;
    private String reason;
}
