package com.school.course.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Value("${kafka.topics.course-created}")
    private String courseCreatedTopic;

    @Value("${kafka.topics.enrollment-response}")
    private String enrollmentResponseTopic;

    @Bean
    public NewTopic courseCreatedTopic() {
        return TopicBuilder.name(courseCreatedTopic)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic enrollmentResponseTopic() {
        return TopicBuilder.name(enrollmentResponseTopic)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic enrollmentRequestDlt() {
        return TopicBuilder.name("enrollment-request-topic.DLT")
                .partitions(3)
                .replicas(1)
                .build();
    }
}
