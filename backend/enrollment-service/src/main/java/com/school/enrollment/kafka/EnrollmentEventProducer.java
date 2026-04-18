package com.school.enrollment.kafka;

import com.school.enrollment.event.EnrollmentRequestEvent;
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
public class EnrollmentEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topics.enrollment-request}")
    private String enrollmentRequestTopic;

    public void publishEnrollmentRequest(EnrollmentRequestEvent event) {
        CompletableFuture<SendResult<String, Object>> future =
                kafkaTemplate.send(enrollmentRequestTopic, event.getSagaId(), event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish EnrollmentRequestEvent: sagaId={}, error={}", event.getSagaId(), ex.getMessage());
            } else {
                log.info("EnrollmentRequestEvent published: sagaId={}, action={}, partition={}, offset={}",
                        event.getSagaId(),
                        event.getAction(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            }
        });
    }
}
