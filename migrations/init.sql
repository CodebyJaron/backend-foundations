CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE surveys
    ADD CONSTRAINT fk_surveys_users
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE;

ALTER TABLE surveys
    ADD CONSTRAINT ck_surveys_title_not_blank
        CHECK (length(btrim(title)) > 0);

CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    position INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Page survey_id and position must be unique because else you get conflicts with the ordering
    CONSTRAINT uq_pages_survey_position UNIQUE (survey_id, position)
);

ALTER TABLE pages
    ADD CONSTRAINT fk_pages_surveys
        FOREIGN KEY (survey_id)
        REFERENCES surveys(id)
        ON DELETE CASCADE;

ALTER TABLE pages
    ADD CONSTRAINT ck_pages_position_min_1
        CHECK (position >= 1);

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    options JSONB,
    position INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Question page_id and position must be unique because else you get conflicts with the ordering
    CONSTRAINT uq_questions_page_position UNIQUE (page_id, position)
);

ALTER TABLE questions
    ADD CONSTRAINT fk_questions_pages
        FOREIGN KEY (page_id)
        REFERENCES pages(id)
        ON DELETE CASCADE;

ALTER TABLE questions
    ADD CONSTRAINT ck_questions_type_allowed
        CHECK (type IN ('text', 'multiple_choice', 'number_scale', 'yes_no'));

ALTER TABLE questions
    ADD CONSTRAINT ck_questions_position_min_1
        CHECK (position >= 1);
