package com.school.grade.kafka;

import com.school.grade.event.GradeUpdatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class GradeEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topics.grade-updated}")
    private String gradeUpdatedTopic;

    public void publishGradeUpdated(GradeUpdatedEvent event) {
        kafkaTemplate.send(gradeUpdatedTopic, event.getStudentId().toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish GradeUpdatedEvent: gradeId={}", event.getGradeId(), ex);
                    } else {
                        log.info("GradeUpdatedEvent published: gradeId={}, studentId={}", event.getGradeId(), event.getStudentId());
                    }
                });
    }
}
