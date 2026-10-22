ALTER TABLE journals
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'journal';

UPDATE journals
SET category = 'journal'
WHERE category IS NULL OR category = '';
