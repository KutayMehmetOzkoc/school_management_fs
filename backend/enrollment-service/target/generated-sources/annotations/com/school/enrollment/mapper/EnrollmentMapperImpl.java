package com.school.enrollment.mapper;

import com.school.enrollment.dto.EnrollmentResponse;
import com.school.enrollment.entity.Enrollment;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-18T18:03:23+0300",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 25.0.1 (Oracle Corporation)"
)
@Component
public class EnrollmentMapperImpl implements EnrollmentMapper {

    @Override
    public EnrollmentResponse toResponse(Enrollment enrollment) {
        if ( enrollment == null ) {
            return null;
        }

        EnrollmentResponse enrollmentResponse = new EnrollmentResponse();

        enrollmentResponse.setId( enrollment.getId() );
        enrollmentResponse.setStudentId( enrollment.getStudentId() );
        enrollmentResponse.setCourseId( enrollment.getCourseId() );
        enrollmentResponse.setStatus( enrollment.getStatus() );
        enrollmentResponse.setSagaId( enrollment.getSagaId() );
        enrollmentResponse.setFailureReason( enrollment.getFailureReason() );
        enrollmentResponse.setCreatedAt( enrollment.getCreatedAt() );
        enrollmentResponse.setUpdatedAt( enrollment.getUpdatedAt() );

        return enrollmentResponse;
    }
}
