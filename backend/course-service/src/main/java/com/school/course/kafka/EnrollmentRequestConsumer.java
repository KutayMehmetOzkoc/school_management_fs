package com.school.course.kafka;

import com.school.course.event.EnrollmentRequestEvent;
import com.school.course.event.EnrollmentResponseEvent;
import com.school.course.service.CourseCapacityService;
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
public class EnrollmentRequestConsumer {

    private final CourseCapacityService capacityService;
    private final CourseEventProducer eventProducer;

    @KafkaListener(
            topics = "enrollment-request-topic",
            groupId = "course-service-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleEnrollmentRequest(
            @Payload EnrollmentRequestEvent event,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            Acknowledgment acknowledgment) {

        log.info("Received EnrollmentRequestEvent: sagaId={}, courseId={}, action={}",
                event.getSagaId(), event.getCourseId(), event.getAction());

        try {
            EnrollmentResponseEvent response = switch (event.getAction()) {
                case "RESERVE" -> capacityService.reserveSeat(event);
                case "RELEASE" -> capacityService.releaseSeat(event);
                default -> {
                    log.warn("Unknown action: {}", event.getAction());
                    yield buildRejectedResponse(event, "Unknown action: " + event.getAction());
                }
            };

            eventProducer.publishEnrollmentResponse(response);
            acknowledgment.acknowledge();

        } catch (Exception ex) {
            log.error("Error processing EnrollmentRequestEvent: sagaId={}", event.getSagaId(), ex);
            EnrollmentResponseEvent errorResponse = buildRejectedResponse(event, ex.getMessage());
            eventProducer.publishEnrollmentResponse(errorResponse);
            acknowledgment.acknowledge();
        }
    }

    private EnrollmentResponseEvent buildRejectedResponse(EnrollmentRequestEvent event, String reason) {
        return EnrollmentResponseEvent.builder()
                .sagaId(event.getSagaId())
                .courseId(event.getCourseId())
                .studentId(event.getStudentId())
                .approved(false)
                .reason(reason)
                .build();
    }
}
