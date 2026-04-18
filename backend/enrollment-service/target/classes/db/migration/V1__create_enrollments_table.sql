CREATE TABLE enrollments (
    id              BIGSERIAL    PRIMARY KEY,
    student_id      BIGINT       NOT NULL,
    course_id       BIGINT       NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    saga_id         VARCHAR(36)  NOT NULL UNIQUE,
    failure_reason  TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_student_course UNIQUE (student_id, course_id)
);

CREATE INDEX idx_enrollments_student_id ON enrollments (student_id);
CREATE INDEX idx_enrollments_course_id  ON enrollments (course_id);
CREATE INDEX idx_enrollments_saga_id    ON enrollments (saga_id);
CREATE INDEX idx_enrollments_status     ON enrollments (status);
