-- Migration: Add example_images JSONB column to tasks table
-- Purpose: Store example images with captions and order for task introduction
-- Date: 2025-01-13

-- Add the new example_images column
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS example_images JSONB DEFAULT '[]';

-- Create index for faster JSONB queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_tasks_example_images ON tasks USING GIN (example_images);

-- Add comment for documentation
COMMENT ON COLUMN tasks.example_images IS 'JSONB array storing example images with filename, file_path, and caption';

-- Example data structure:
-- [
--   {
--     "filename": "example1.jpg",
--     "file_path": "/uploads/task-examples/task-uuid/example1.jpg", 
--     "caption": "This shows correct labeling technique"
--   },
--   {
--     "filename": "example2.png",
--     "file_path": "/uploads/task-examples/task-uuid/example2.png",
--     "caption": "Common failure type A example"
--   }
-- ]

-- Optional: Migrate existing example_media data to new format
-- Uncomment the following block to migrate existing data:
/*
UPDATE tasks 
SET example_images = (
  SELECT COALESCE(json_agg(
    json_build_object(
      'filename', media,
      'file_path', '/uploads/' || media,
      'caption', ''
    )
  ), '[]'::json)
  FROM unnest(COALESCE(example_media, ARRAY[]::text[])) AS media
)
WHERE example_media IS NOT NULL AND array_length(example_media, 1) > 0;
*/

-- Verification query to check the migration
-- SELECT id, title, example_media, example_images FROM tasks WHERE example_images::text != '[]';