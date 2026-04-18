package com.school.course.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Long teacherId;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false)
    private Integer enrolledCount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CourseStatus status;

    @Column(nullable = false)
    private Integer creditHours;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public boolean hasAvailableCapacity() {
        return enrolledCount < capacity;
    }

    public void incrementEnrolledCount() {
        if (!hasAvailableCapacity()) {
            throw new IllegalStateException("Course capacity is full");
        }
        this.enrolledCount++;
    }

    public void decrementEnrolledCount() {
        if (enrolledCount > 0) {
            this.enrolledCount--;
        }
    }
}
