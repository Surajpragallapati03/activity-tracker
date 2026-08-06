CREATE TABLE infos (
                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       ir_id VARCHAR(50) NOT NULL,
                       prospect_name VARCHAR(255) NOT NULL,
                       phone VARCHAR(20) UNIQUE,
                       response VARCHAR(10) NOT NULL
                           CHECK (response IN ('A', 'AB', 'B', 'BC', 'C')),
                       status VARCHAR(50) NOT NULL,
                       remarks TEXT,
                       created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                       created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                       updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_infos_ir_id ON infos(ir_id);
CREATE INDEX idx_infos_created_by ON infos(created_by);
CREATE INDEX idx_infos_prospect_name ON infos(prospect_name);