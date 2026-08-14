CREATE TABLE fg_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    closing_id UUID NOT NULL UNIQUE,
    ir_id VARCHAR(50) NOT NULL,
    meeting_date DATE,
    meeting_time TIME,
    mode VARCHAR(20),
    status VARCHAR(255) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_closing_id FOREIGN KEY (closing_id) REFERENCES closings(id) ON DELETE CASCADE
);

CREATE INDEX idx_fg_invites_ir_id ON fg_invites(ir_id);
CREATE INDEX idx_fg_invites_created_at ON fg_invites(created_at);
