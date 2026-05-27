-- Migration to add photos column to properties table and update property types
-- Run this script to update your existing database

-- Add photos column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';

-- Update property type constraint to include new types
ALTER TABLE properties 
DROP CONSTRAINT IF EXISTS properties_type_check;

ALTER TABLE properties 
ADD CONSTRAINT properties_type_check 
CHECK (type IN ('apartment', 'house', 'commercial', 'plot', 'row_house', 'shop', 'pg', 'bungalow'));

-- Create index on photos column for better performance
CREATE INDEX IF NOT EXISTS idx_properties_photos ON properties USING gin(photos);

-- Add comment to document the photos column
COMMENT ON COLUMN properties.photos IS 'Array of photo filenames for the property (max 5 photos)';