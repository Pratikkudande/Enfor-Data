-- Fix DLT Template Content - Remove Emojis and Use Correct Template Text
-- This script corrects the template_content field to match the approved DLT templates

-- Fix SalePropertyAlert template (based on Template ID: 1277178600920660252)
UPDATE sms_dlt_templates 
SET template_content = 'Property for Sale: {#alp#}
Details: ₹{#alp#}
Contact: {#alp#}
- ENFOR DATA',
    variable_count = 3,
    updated_at = NOW()
WHERE template_id = '1277178600920660252' 
   OR template_name = 'SalePropertyAlert';

-- Fix RentPropertyAlert template (based on Template ID: 1277178600009441768)
UPDATE sms_dlt_templates 
SET template_content = 'Property for Rent: {#alp#}
Details: ₹{#alp#}
Contact: {#alp#}
- ENFOR DATA',
    variable_count = 3,
    updated_at = NOW()
WHERE template_id = '1277178600009441768' 
   OR template_name = 'RentPropertyAlert';

-- Verify the changes
SELECT 
    id,
    template_name,
    template_id,
    template_content,
    variable_count,
    status
FROM sms_dlt_templates
ORDER BY created_at DESC;
