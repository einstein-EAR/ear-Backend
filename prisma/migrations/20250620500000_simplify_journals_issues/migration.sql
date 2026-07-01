ALTER TABLE journals DROP COLUMN IF EXISTS unique_key;
DROP INDEX IF EXISTS idx_journals_unique_key;

ALTER TABLE journal_issues ADD COLUMN IF NOT EXISTS issue_label VARCHAR(100);

UPDATE journal_issues
SET issue_label = COALESCE(NULLIF(issue_number, ''), NULLIF(title, ''), 'Untitled Issue')
WHERE issue_label IS NULL;

ALTER TABLE journal_issues ALTER COLUMN issue_label SET NOT NULL;

ALTER TABLE journal_issues DROP COLUMN IF EXISTS title;
ALTER TABLE journal_issues DROP COLUMN IF EXISTS description;
ALTER TABLE journal_issues DROP COLUMN IF EXISTS issue_number;
