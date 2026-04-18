package com.school.enrollment.repository;

import com.school.enrollment.entity.Enrollment;
import com.school.enrollment.entity.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    Optional<Enrollment> findBySagaId(String sagaId);

    List<Enrollment> findByStudentId(Long studentId);

    List<Enrollment> findByCourseId(Long courseId);

    boolean existsByStudentIdAndCourseIdAndStatusIn(Long studentId, Long courseId, List<EnrollmentStatus> statuses);

    List<Enrollment> findByStudentIdAndStatus(Long studentId, EnrollmentStatus status);
}
