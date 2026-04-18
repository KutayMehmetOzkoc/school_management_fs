CREATE TABLE users (
    id          BIGSERIAL     PRIMARY KEY,
    email       VARCHAR(100)  NOT NULL UNIQUE,
    password    VARCHAR(255)  NOT NULL,
    first_name  VARCHAR(80)   NOT NULL,
    last_name   VARCHAR(80)   NOT NULL,
    role        VARCHAR(20)   NOT NULL,
    enabled     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role  ON users (role);
