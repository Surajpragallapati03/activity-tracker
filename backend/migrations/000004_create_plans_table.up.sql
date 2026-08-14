CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invite_id UUID NOT NULL UNIQUE REFERENCES invites(id) ON DELETE CASCADE,
    ir_id VARCHAR(50) NOT NULL,
    ul1 VARCHAR(255) NOT NULL,
    ul2 VARCHAR(255) NOT NULL,
    quoted_amount VARCHAR(100) NOT NULL,
    expected_uvs DOUBLE PRECISION NOT NULL,
    status VARCHAR(255) NOT NULL,
    remarks TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_plans_ir_id ON plans(ir_id);
CREATE INDEX idx_plans_created_at ON plans(created_at);
