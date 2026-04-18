CREATE TYPE course_status AS ENUM ('DRAFT', 'ACTIVE', 'FULL', 'CLOSED');

CREATE TABLE courses (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(20)  NOT NULL UNIQUE,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    teacher_id      BIGINT       NOT NULL,
    capacity        INTEGER      NOT NULL CHECK (capacity > 0),
    enrolled_count  INTEGER      NOT NULL DEFAULT 0 CHECK (enrolled_count >= 0),
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    credit_hours    INTEGER      NOT NULL CHECK (credit_hours BETWEEN 1 AND 6),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT enrolled_not_exceed_capacity CHECK (enrolled_count <= capacity)
);

CREATE INDEX idx_courses_teacher_id ON courses (teacher_id);
CREATE INDEX idx_courses_status     ON courses (status);
CREATE INDEX idx_courses_code       ON courses (code);
