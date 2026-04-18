package com.school.grade.mapper;

import com.school.grade.dto.GradeResponse;
import com.school.grade.entity.Grade;
import com.school.grade.event.GradeUpdatedEvent;
import java.time.LocalDateTime;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-18T18:03:45+0300",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 25.0.1 (Oracle Corporation)"
)
@Component
public class GradeMapperImpl implements GradeMapper {

    @Override
    public GradeResponse toResponse(Grade grade) {
        if ( grade == null ) {
            return null;
        }

        GradeResponse gradeResponse = new GradeResponse();

        gradeResponse.setId( grade.getId() );
        gradeResponse.setStudentId( grade.getStudentId() );
        gradeResponse.setCourseId( grade.getCourseId() );
        gradeResponse.setTeacherId( grade.getTeacherId() );
        gradeResponse.setScore( grade.getScore() );
        gradeResponse.setLetterGrade( grade.getLetterGrade() );
        gradeResponse.setFeedback( grade.getFeedback() );
        gradeResponse.setCreatedAt( grade.getCreatedAt() );
        gradeResponse.setUpdatedAt( grade.getUpdatedAt() );

        return gradeResponse;
    }

    @Override
    public GradeUpdatedEvent toEvent(Grade grade) {
        if ( grade == null ) {
            return null;
        }

        GradeUpdatedEvent.GradeUpdatedEventBuilder gradeUpdatedEvent = GradeUpdatedEvent.builder();

        gradeUpdatedEvent.gradeId( grade.getId() );
        gradeUpdatedEvent.studentId( grade.getStudentId() );
        gradeUpdatedEvent.courseId( grade.getCourseId() );
        gradeUpdatedEvent.score( grade.getScore() );
        gradeUpdatedEvent.letterGrade( grade.getLetterGrade() );

        gradeUpdatedEvent.occurredAt( LocalDateTime.now() );

        return gradeUpdatedEvent.build();
    }
}
