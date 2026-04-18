package com.school.course.kafka;

import com.school.course.event.CourseCreatedEvent;
import com.school.course.event.EnrollmentResponseEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Slf4j
@Component
@RequiredArgsConstructor
public class CourseEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topics.course-created}")
    private String courseCreatedTopic;

    @Value("${kafka.topics.enrollment-response}")
    private String enrollmentResponseTopic;

    public void publishCourseCreated(CourseCreatedEvent event) {
        CompletableFuture<SendResult<String, Object>> future =
                kafkaTemplate.send(courseCreatedTopic, event.getCourseId().toString(), event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish CourseCreatedEvent for courseId={}: {}", event.getCourseId(), ex.getMessage());
            } else {
                log.info("CourseCreatedEvent published: courseId={}, partition={}, offset={}",
                        event.getCourseId(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            }
        });
    }

    public void publishEnrollmentResponse(EnrollmentResponseEvent event) {
        CompletableFuture<SendResult<String, Object>> future =
                kafkaTemplate.send(enrollmentResponseTopic, event.getSagaId(), event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish EnrollmentResponseEvent for sagaId={}: {}", event.getSagaId(), ex.getMessage());
            } else {
                log.info("EnrollmentResponseEvent published: sagaId={}, approved={}", event.getSagaId(), event.isApproved());
            }
        });
    }
}
