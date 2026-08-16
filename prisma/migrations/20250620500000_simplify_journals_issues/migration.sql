-- Legacy cleanup only (safe to re-run)
ALTER TABLE journals DROP COLUMN IF EXISTS unique_key;
DROP INDEX IF EXISTS idx_journals_unique_key;

ALTER TABLE journal_issues ADD COLUMN IF NOT EXISTS issue_label VARCHAR(100);

UPDATE journal_issues
SET issue_label = 'Untitled Issue'
WHERE issue_label IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'journal_issues'
      AND column_name = 'issue_label'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE journal_issues ALTER COLUMN issue_label SET NOT NULL;
  END IF;
END $$;

ALTER TABLE journal_issues DROP COLUMN IF EXISTS title;
ALTER TABLE journal_issues DROP COLUMN IF EXISTS issue_number;
