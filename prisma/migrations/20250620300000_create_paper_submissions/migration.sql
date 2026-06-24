CREATE TABLE IF NOT EXISTS paper_submissions (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email_id VARCHAR(255) NOT NULL,
  title_of_paper VARCHAR(500) NOT NULL,
  country VARCHAR(100) NOT NULL,
  mobile VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  paper_file_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
