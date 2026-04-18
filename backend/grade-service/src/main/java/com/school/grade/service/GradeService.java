package com.school.grade.service;

import com.school.grade.dto.GradeRequest;
import com.school.grade.dto.GradeResponse;
import com.school.grade.entity.Grade;
import com.school.grade.event.GradeUpdatedEvent;
import com.school.grade.exception.GradeNotFoundException;
import com.school.grade.kafka.GradeEventProducer;
import com.school.grade.mapper.GradeMapper;
import com.school.grade.repository.GradeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class GradeService {

    private final GradeRepository gradeRepository;
    private final GradeMapper gradeMapper;
    private final GradeEventProducer eventProducer;

    @Transactional
    public GradeResponse submitGrade(GradeRequest request) {
        Grade grade = gradeRepository.findByStudentIdAndCourseId(request.getStudentId(), request.getCourseId())
                .orElse(Grade.builder()
                        .studentId(request.getStudentId())
                        .courseId(request.getCourseId())
                        .teacherId(request.getTeacherId())
                        .build());

        grade.setScore(request.getScore());
        grade.setLetterGrade(calculateLetterGrade(request.getScore()));
        grade.setFeedback(request.getFeedback());
        grade.setTeacherId(request.getTeacherId());

        Grade saved = gradeRepository.save(grade);

        GradeUpdatedEvent event = gradeMapper.toEvent(saved);
        eventProducer.publishGradeUpdated(event);

        log.info("Grade submitted: studentId={}, courseId={}, score={}", saved.getStudentId(), saved.getCourseId(), saved.getScore());
        return gradeMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<GradeResponse> getGradesByStudent(Long studentId) {
        return gradeRepository.findByStudentId(studentId)
                .stream()
                .map(gradeMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GradeResponse> getGradesByCourse(Long courseId) {
        return gradeRepository.findByCourseId(courseId)
                .stream()
                .map(gradeMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public GradeResponse getGrade(Long id) {
        return gradeRepository.findById(id)
                .map(gradeMapper::toResponse)
                .orElseThrow(() -> new GradeNotFoundException(id));
    }

    private String calculateLetterGrade(BigDecimal score) {
        double d = score.doubleValue();
        if (d >= 90) return "AA";
        if (d >= 85) return "BA";
        if (d >= 80) return "BB";
        if (d >= 75) return "CB";
        if (d >= 70) return "CC";
        if (d >= 65) return "DC";
        if (d >= 60) return "DD";
        if (d >= 50) return "FD";
        return "FF";
    }
}
