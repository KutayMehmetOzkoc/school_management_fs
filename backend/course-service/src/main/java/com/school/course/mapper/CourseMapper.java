package com.school.course.mapper;

import com.school.course.dto.CourseResponse;
import com.school.course.dto.CreateCourseRequest;
import com.school.course.entity.Course;
import com.school.course.entity.CourseStatus;
import com.school.course.event.CourseCreatedEvent;
import org.mapstruct.*;

import java.time.LocalDateTime;

@Mapper(componentModel = "spring", imports = {LocalDateTime.class, CourseStatus.class})
public interface CourseMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "enrolledCount", constant = "0")
    @Mapping(target = "status", expression = "java(CourseStatus.ACTIVE)")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Course toEntity(CreateCourseRequest request);

    @Mapping(target = "availableSeats", expression = "java(course.getCapacity() - course.getEnrolledCount())")
    CourseResponse toResponse(Course course);

    @Mapping(target = "occurredAt", expression = "java(LocalDateTime.now())")
    CourseCreatedEvent toCreatedEvent(Course course);
}
