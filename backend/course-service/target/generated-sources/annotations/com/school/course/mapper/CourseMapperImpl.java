package com.school.course.mapper;

import com.school.course.dto.CourseResponse;
import com.school.course.dto.CreateCourseRequest;
import com.school.course.entity.Course;
import com.school.course.entity.CourseStatus;
import com.school.course.event.CourseCreatedEvent;
import java.time.LocalDateTime;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-18T18:03:11+0300",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 25.0.1 (Oracle Corporation)"
)
@Component
public class CourseMapperImpl implements CourseMapper {

    @Override
    public Course toEntity(CreateCourseRequest request) {
        if ( request == null ) {
            return null;
        }

        Course.CourseBuilder course = Course.builder();

        course.code( request.getCode() );
        course.name( request.getName() );
        course.description( request.getDescription() );
        course.teacherId( request.getTeacherId() );
        course.capacity( request.getCapacity() );
        course.creditHours( request.getCreditHours() );

        course.enrolledCount( 0 );
        course.status( CourseStatus.ACTIVE );

        return course.build();
    }

    @Override
    public CourseResponse toResponse(Course course) {
        if ( course == null ) {
            return null;
        }

        CourseResponse courseResponse = new CourseResponse();

        courseResponse.setId( course.getId() );
        courseResponse.setCode( course.getCode() );
        courseResponse.setName( course.getName() );
        courseResponse.setDescription( course.getDescription() );
        courseResponse.setTeacherId( course.getTeacherId() );
        courseResponse.setCapacity( course.getCapacity() );
        courseResponse.setEnrolledCount( course.getEnrolledCount() );
        courseResponse.setStatus( course.getStatus() );
        courseResponse.setCreditHours( course.getCreditHours() );
        courseResponse.setCreatedAt( course.getCreatedAt() );

        courseResponse.setAvailableSeats( course.getCapacity() - course.getEnrolledCount() );

        return courseResponse;
    }

    @Override
    public CourseCreatedEvent toCreatedEvent(Course course) {
        if ( course == null ) {
            return null;
        }

        CourseCreatedEvent.CourseCreatedEventBuilder courseCreatedEvent = CourseCreatedEvent.builder();

        courseCreatedEvent.teacherId( course.getTeacherId() );
        courseCreatedEvent.capacity( course.getCapacity() );
        courseCreatedEvent.creditHours( course.getCreditHours() );

        courseCreatedEvent.occurredAt( LocalDateTime.now() );

        return courseCreatedEvent.build();
    }
}
