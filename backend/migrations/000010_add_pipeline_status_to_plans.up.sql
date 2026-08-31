ALTER TABLE plans ADD COLUMN pipeline_status VARCHAR(20) NOT NULL DEFAULT 'tentative' CHECK (pipeline_status IN ('tentative', 'strong', 'sureshot', 'done', 'kiv'));
