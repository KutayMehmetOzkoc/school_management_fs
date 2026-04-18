CREATE TABLE grades (
    id            BIGSERIAL      PRIMARY KEY,
    student_id    BIGINT         NOT NULL,
    course_id     BIGINT         NOT NULL,
    teacher_id    BIGINT         NOT NULL,
    score         NUMERIC(5,2)   NOT NULL CHECK (score BETWEEN 0 AND 100),
    letter_grade  VARCHAR(2),
    feedback      TEXT,
    created_at    TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP      NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_student_course UNIQUE (student_id, course_id)
);

CREATE INDEX idx_grades_student_id ON grades (student_id);
CREATE INDEX idx_grades_course_id  ON grades (course_id);
CREATE INDEX idx_grades_teacher_id ON grades (teacher_id);
