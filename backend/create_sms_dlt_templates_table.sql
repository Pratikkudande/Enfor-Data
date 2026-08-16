-- Create SMS DLT Templates table
CREATE TABLE IF NOT EXISTS sms_dlt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    header VARCHAR(10) NOT NULL,
    template_id VARCHAR(255),
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('Promotional', 'Service')),
    provider VARCHAR(50),
    template_content TEXT NOT NULL,
    sample_content TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Created' CHECK (status IN ('Registered', 'Approved', 'Active', 'Inactive', 'Rejected','Created')),
    variable_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sms_dlt_templates_user_id ON sms_dlt_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_dlt_templates_template_id ON sms_dlt_templates(template_id);
CREATE INDEX IF NOT EXISTS idx_sms_dlt_templates_status ON sms_dlt_templates(status);
CREATE INDEX IF NOT EXISTS idx_sms_dlt_templates_provider ON sms_dlt_templates(provider);

-- Add comment to the table
COMMENT ON TABLE sms_dlt_templates IS 'Stores DLT (Distributed Ledger Technology) approved SMS templates for regulatory compliance';
COMMENT ON COLUMN sms_dlt_templates.header IS 'Template header/entity ID from telecom provider';
COMMENT ON COLUMN sms_dlt_templates.template_id IS 'Unique template ID from SMS provider (e.g., JIO, MSG91)';
COMMENT ON COLUMN sms_dlt_templates.template_type IS 'Template type: Promotional or Service';
COMMENT ON COLUMN sms_dlt_templates.template_content IS 'Template content with variable placeholders like {#var#}';
COMMENT ON COLUMN sms_dlt_templates.variable_count IS 'Number of variables in the template';
COMMENT ON COLUMN sms_dlt_templates.status IS 'DLT approval status';
