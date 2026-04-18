package com.school.enrollment.service;

import com.school.enrollment.dto.EnrollmentRequest;
import com.school.enrollment.dto.EnrollmentResponse;
import com.school.enrollment.entity.Enrollment;
import com.school.enrollment.entity.EnrollmentStatus;
import com.school.enrollment.exception.DuplicateEnrollmentException;
import com.school.enrollment.exception.EnrollmentNotFoundException;
import com.school.enrollment.mapper.EnrollmentMapper;
import com.school.enrollment.repository.EnrollmentRepository;
import com.school.enrollment.saga.EnrollmentSaga;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentMapper enrollmentMapper;
    private final EnrollmentSaga enrollmentSaga;

    @Transactional
    public EnrollmentResponse enroll(EnrollmentRequest request) {
        boolean alreadyActive = enrollmentRepository.existsByStudentIdAndCourseIdAndStatusIn(
                request.getStudentId(),
                request.getCourseId(),
                List.of(EnrollmentStatus.PENDING, EnrollmentStatus.CONFIRMED)
        );

        if (alreadyActive) {
            throw new DuplicateEnrollmentException(request.getStudentId(), request.getCourseId());
        }

        Enrollment enrollment = Enrollment.builder()
                .studentId(request.getStudentId())
                .courseId(request.getCourseId())
                .status(EnrollmentStatus.PENDING)
                .sagaId(UUID.randomUUID().toString())
                .build();

        Enrollment saved = enrollmentRepository.save(enrollment);
        enrollmentSaga.startSaga(saved);

        log.info("Enrollment initiated: studentId={}, courseId={}, sagaId={}", saved.getStudentId(), saved.getCourseId(), saved.getSagaId());
        return enrollmentMapper.toResponse(saved);
    }

    @Transactional
    public EnrollmentResponse cancelEnrollment(Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new EnrollmentNotFoundException("id: " + enrollmentId));

        enrollmentSaga.compensate(enrollment.getSagaId());
        return enrollmentMapper.toResponse(enrollment);
    }

    @Transactional(readOnly = true)
    public EnrollmentResponse getEnrollment(Long id) {
        return enrollmentRepository.findById(id)
                .map(enrollmentMapper::toResponse)
                .orElseThrow(() -> new EnrollmentNotFoundException("id: " + id));
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getEnrollmentsByStudent(Long studentId) {
        return enrollmentRepository.findByStudentId(studentId)
                .stream()
                .map(enrollmentMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getEnrollmentsByCourse(Long courseId) {
        return enrollmentRepository.findByCourseId(courseId)
                .stream()
                .map(enrollmentMapper::toResponse)
                .toList();
    }
}
