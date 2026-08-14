CREATE TABLE invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    info_id UUID NOT NULL UNIQUE REFERENCES infos(id) ON DELETE CASCADE,
    ir_id VARCHAR(50) NOT NULL,
    meeting_date DATE,
    meeting_time TIME,
    mode VARCHAR(20) CHECK (mode IN ('virtual', 'physical')),
    status VARCHAR(255) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invites_ir_id ON invites(ir_id);
CREATE INDEX idx_invites_created_at ON invites(created_at);
