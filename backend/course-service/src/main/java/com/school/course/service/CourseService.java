package com.school.course.service;

import com.school.course.dto.CourseResponse;
import com.school.course.dto.CreateCourseRequest;
import com.school.course.dto.UpdateCourseRequest;
import com.school.course.entity.Course;
import com.school.course.entity.CourseStatus;
import com.school.course.event.CourseCreatedEvent;
import com.school.course.exception.CourseNotFoundException;
import com.school.course.exception.DuplicateCourseCodeException;
import com.school.course.kafka.CourseEventProducer;
import com.school.course.mapper.CourseMapper;
import com.school.course.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseMapper courseMapper;
    private final CourseEventProducer eventProducer;

    @Transactional
    public CourseResponse createCourse(CreateCourseRequest request) {
        if (courseRepository.existsByCode(request.getCode())) {
            throw new DuplicateCourseCodeException(request.getCode());
        }

        Course course = courseMapper.toEntity(request);
        Course saved = courseRepository.save(course);

        CourseCreatedEvent event = courseMapper.toCreatedEvent(saved);
        eventProducer.publishCourseCreated(event);

        log.info("Course created: id={}, code={}", saved.getId(), saved.getCode());
        return courseMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public CourseResponse getCourseById(Long id) {
        return courseRepository.findById(id)
                .map(courseMapper::toResponse)
                .orElseThrow(() -> new CourseNotFoundException(id));
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> getAllCourses(Pageable pageable) {
        return courseRepository.findAll(pageable).map(courseMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> getAvailableCourses(Pageable pageable) {
        return courseRepository.findAvailableCourses(pageable).map(courseMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> getCoursesByTeacher(Long teacherId) {
        return courseRepository.findByTeacherId(teacherId)
                .stream()
                .map(courseMapper::toResponse)
                .toList();
    }

    @Transactional
    public CourseResponse updateCourse(Long id, UpdateCourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new CourseNotFoundException(id));

        if (request.getName() != null) course.setName(request.getName());
        if (request.getDescription() != null) course.setDescription(request.getDescription());
        if (request.getCapacity() != null) course.setCapacity(request.getCapacity());
        if (request.getCreditHours() != null) course.setCreditHours(request.getCreditHours());

        return courseMapper.toResponse(courseRepository.save(course));
    }

    @Transactional
    public void closeCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new CourseNotFoundException(id));
        course.setStatus(CourseStatus.CLOSED);
        courseRepository.save(course);
        log.info("Course closed: id={}", id);
    }
}
