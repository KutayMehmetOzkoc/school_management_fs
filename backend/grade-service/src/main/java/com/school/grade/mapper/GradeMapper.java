package com.school.grade.mapper;

import com.school.grade.dto.GradeResponse;
import com.school.grade.entity.Grade;
import com.school.grade.event.GradeUpdatedEvent;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.time.LocalDateTime;

@Mapper(componentModel = "spring", imports = LocalDateTime.class)
public interface GradeMapper {
    GradeResponse toResponse(Grade grade);

    @Mapping(target = "gradeId", source = "id")
    @Mapping(target = "occurredAt", expression = "java(LocalDateTime.now())")
    GradeUpdatedEvent toEvent(Grade grade);
}
