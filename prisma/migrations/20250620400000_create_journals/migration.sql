CREATE TABLE IF NOT EXISTS journals (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  serial_number VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_issues (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journals(_id) ON DELETE CASCADE,
  issue_label VARCHAR(100) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issue_pdfs (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES journal_issues(_id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  author VARCHAR(500) NOT NULL DEFAULT '',
  doi VARCHAR(500) NOT NULL DEFAULT '',
  pdf_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_issues_journal_id ON journal_issues(journal_id);
CREATE INDEX IF NOT EXISTS idx_issue_pdfs_issue_id ON issue_pdfs(issue_id);
