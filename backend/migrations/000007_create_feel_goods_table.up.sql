CREATE TABLE feel_goods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fg_invite_id UUID NOT NULL UNIQUE,
    ir_id VARCHAR(50) NOT NULL,
    ul1 VARCHAR(255) NOT NULL,
    ul2 VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fg_invite_id FOREIGN KEY (fg_invite_id) REFERENCES fg_invites(id) ON DELETE CASCADE
);

CREATE INDEX idx_feel_goods_ir_id ON feel_goods(ir_id);
CREATE INDEX idx_feel_goods_created_at ON feel_goods(created_at);
