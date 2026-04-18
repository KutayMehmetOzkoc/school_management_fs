CREATE TABLE menu_items (
    id           BIGSERIAL    PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    description  TEXT,
    menu_date    DATE         NOT NULL,
    day_of_week  VARCHAR(15)  NOT NULL,
    meal_type    VARCHAR(15)  NOT NULL,
    vegetarian   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menu_items_date      ON menu_items (menu_date);
CREATE INDEX idx_menu_items_meal_type ON menu_items (meal_type);
