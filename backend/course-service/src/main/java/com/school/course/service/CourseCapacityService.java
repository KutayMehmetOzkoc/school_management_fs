package com.school.course.service;

import com.school.course.entity.Course;
import com.school.course.entity.CourseStatus;
import com.school.course.event.EnrollmentRequestEvent;
import com.school.course.event.EnrollmentResponseEvent;
import com.school.course.exception.CourseNotFoundException;
import com.school.course.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseCapacityService {

    private final CourseRepository courseRepository;

    @Transactional
    public EnrollmentResponseEvent reserveSeat(EnrollmentRequestEvent event) {
        Course course = courseRepository.findByIdWithLock(event.getCourseId())
                .orElseThrow(() -> new CourseNotFoundException(event.getCourseId()));

        if (!course.hasAvailableCapacity()) {
            log.info("Seat reservation rejected — course full: courseId={}", event.getCourseId());
            return EnrollmentResponseEvent.builder()
                    .sagaId(event.getSagaId())
                    .courseId(event.getCourseId())
                    .studentId(event.getStudentId())
                    .approved(false)
                    .reason("Course is full (capacity: " + course.getCapacity() + ")")
                    .build();
        }

        course.incrementEnrolledCount();
        if (!course.hasAvailableCapacity()) {
            course.setStatus(CourseStatus.FULL);
        }
        courseRepository.save(course);

        log.info("Seat reserved: courseId={}, enrolled={}/{}", course.getId(), course.getEnrolledCount(), course.getCapacity());

        return EnrollmentResponseEvent.builder()
                .sagaId(event.getSagaId())
                .courseId(event.getCourseId())
                .studentId(event.getStudentId())
                .approved(true)
                .reason("Seat reserved successfully")
                .build();
    }

    @Transactional
    public EnrollmentResponseEvent releaseSeat(EnrollmentRequestEvent event) {
        Course course = courseRepository.findByIdWithLock(event.getCourseId())
                .orElseThrow(() -> new CourseNotFoundException(event.getCourseId()));

        course.decrementEnrolledCount();
        if (course.getStatus() == CourseStatus.FULL) {
            course.setStatus(CourseStatus.ACTIVE);
        }
        courseRepository.save(course);

        log.info("Seat released (compensating): courseId={}, enrolled={}/{}", course.getId(), course.getEnrolledCount(), course.getCapacity());

        return EnrollmentResponseEvent.builder()
                .sagaId(event.getSagaId())
                .courseId(event.getCourseId())
                .studentId(event.getStudentId())
                .approved(true)
                .reason("Seat released")
                .build();
    }
}
