package com.school.course.repository;

import com.school.course.entity.Course;
import com.school.course.entity.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    Optional<Course> findByCode(String code);

    boolean existsByCode(String code);

    Page<Course> findByStatus(CourseStatus status, Pageable pageable);

    List<Course> findByTeacherId(Long teacherId);

    // Pessimistic write lock to prevent race conditions during enrollment
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Course c WHERE c.id = :id")
    Optional<Course> findByIdWithLock(@Param("id") Long id);

    @Query("SELECT c FROM Course c WHERE c.status = 'ACTIVE' AND c.enrolledCount < c.capacity")
    Page<Course> findAvailableCourses(Pageable pageable);
}
