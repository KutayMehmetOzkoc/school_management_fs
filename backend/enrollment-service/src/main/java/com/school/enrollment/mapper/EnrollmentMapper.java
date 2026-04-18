package com.school.enrollment.mapper;

import com.school.enrollment.dto.EnrollmentResponse;
import com.school.enrollment.entity.Enrollment;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface EnrollmentMapper {
    EnrollmentResponse toResponse(Enrollment enrollment);
}
