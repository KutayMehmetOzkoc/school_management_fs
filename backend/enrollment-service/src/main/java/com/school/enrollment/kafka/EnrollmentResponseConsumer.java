package com.school.enrollment.kafka;

import com.school.enrollment.event.EnrollmentResponseEvent;
import com.school.enrollment.saga.EnrollmentSaga;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EnrollmentResponseConsumer {

    private final EnrollmentSaga enrollmentSaga;

    @KafkaListener(
            topics = "enrollment-response-topic",
            groupId = "enrollment-service-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleEnrollmentResponse(
            @Payload EnrollmentResponseEvent event,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            Acknowledgment acknowledgment) {

        log.info("Received EnrollmentResponseEvent: sagaId={}, approved={}", event.getSagaId(), event.isApproved());
        enrollmentSaga.handleResponse(event);
        acknowledgment.acknowledge();
    }
}
