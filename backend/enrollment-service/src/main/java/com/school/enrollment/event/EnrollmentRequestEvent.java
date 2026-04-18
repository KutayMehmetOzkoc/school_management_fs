package com.school.enrollment.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentRequestEvent {
    private String sagaId;
    private Long courseId;
    private Long studentId;
    private String action; // RESERVE or RELEASE
}
