package com.school.enrollment.saga;

import com.school.enrollment.entity.Enrollment;
import com.school.enrollment.entity.EnrollmentStatus;
import com.school.enrollment.event.EnrollmentRequestEvent;
import com.school.enrollment.event.EnrollmentResponseEvent;
import com.school.enrollment.exception.EnrollmentNotFoundException;
import com.school.enrollment.kafka.EnrollmentEventProducer;
import com.school.enrollment.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Choreography-based Saga for enrollment.
 *
 * Happy path:
 *   Enrollment created (PENDING) → RESERVE event → Course reserves seat →
 *   enrollment-response-topic (approved=true) → Enrollment CONFIRMED
 *
 * Compensating path:
 *   enrollment-response-topic (approved=false) → Enrollment FAILED
 *   Cancel request → RELEASE event → Course releases seat → Enrollment CANCELLED
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EnrollmentSaga {

    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentEventProducer eventProducer;

    @Transactional
    public void startSaga(Enrollment enrollment) {
        EnrollmentRequestEvent request = EnrollmentRequestEvent.builder()
                .sagaId(enrollment.getSagaId())
                .courseId(enrollment.getCourseId())
                .studentId(enrollment.getStudentId())
                .action("RESERVE")
                .build();

        eventProducer.publishEnrollmentRequest(request);
        log.info("Saga started: sagaId={}", enrollment.getSagaId());
    }

    @Transactional
    public void handleResponse(EnrollmentResponseEvent response) {
        Enrollment enrollment = enrollmentRepository.findBySagaId(response.getSagaId())
                .orElseThrow(() -> new EnrollmentNotFoundException("sagaId: " + response.getSagaId()));

        if (response.isApproved()) {
            enrollment.setStatus(EnrollmentStatus.CONFIRMED);
            enrollmentRepository.save(enrollment);
            log.info("Saga completed (CONFIRMED): sagaId={}", response.getSagaId());
        } else {
            enrollment.setStatus(EnrollmentStatus.FAILED);
            enrollment.setFailureReason(response.getReason());
            enrollmentRepository.save(enrollment);
            log.info("Saga failed: sagaId={}, reason={}", response.getSagaId(), response.getReason());
        }
    }

    @Transactional
    public void compensate(String sagaId) {
        Enrollment enrollment = enrollmentRepository.findBySagaId(sagaId)
                .orElseThrow(() -> new EnrollmentNotFoundException("sagaId: " + sagaId));

        if (enrollment.getStatus() != EnrollmentStatus.CONFIRMED) {
            log.warn("Cannot compensate enrollment not in CONFIRMED state: sagaId={}", sagaId);
            return;
        }

        EnrollmentRequestEvent releaseRequest = EnrollmentRequestEvent.builder()
                .sagaId(sagaId)
                .courseId(enrollment.getCourseId())
                .studentId(enrollment.getStudentId())
                .action("RELEASE")
                .build();

        eventProducer.publishEnrollmentRequest(releaseRequest);
        enrollment.setStatus(EnrollmentStatus.CANCELLED);
        enrollmentRepository.save(enrollment);

        log.info("Compensating transaction sent: sagaId={}", sagaId);
    }
}
