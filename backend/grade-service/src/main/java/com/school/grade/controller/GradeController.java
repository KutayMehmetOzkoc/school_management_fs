package com.school.grade.controller;

import com.school.grade.dto.GradeRequest;
import com.school.grade.dto.GradeResponse;
import com.school.grade.service.GradeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grades")
@RequiredArgsConstructor
public class GradeController {

    private final GradeService gradeService;

    @PostMapping
    public ResponseEntity<GradeResponse> submitGrade(@Valid @RequestBody GradeRequest request) {
        return ResponseEntity.ok(gradeService.submitGrade(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GradeResponse> getGrade(@PathVariable Long id) {
        return ResponseEntity.ok(gradeService.getGrade(id));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<GradeResponse>> getByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(gradeService.getGradesByStudent(studentId));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<GradeResponse>> getByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(gradeService.getGradesByCourse(courseId));
    }
}
