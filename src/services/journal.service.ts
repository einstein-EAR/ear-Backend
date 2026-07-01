import pool from '../components/db';
import AppError from '../utils/AppError';
import { getPresignedUrl, uploadIssuePdfToS3 } from '../services/upload.service';

type JournalRow = {
  _id: string;
  title: string;
  description: string;
  serial_number: string;
  image_url: string;
  created_at: Date;
  updated_at: Date;
};

type IssueRow = {
  _id: string;
  journal_id: string;
  issue_label: string;
  created_at: Date;
  updated_at: Date;
};

type PdfRow = {
  _id: string;
  issue_id: string;
  title: string;
  pdf_url: string;
  created_at: Date;
};

const formatPdf = async (pdf: PdfRow) => ({
  _id: pdf._id,
  title: pdf.title,
  pdfUrl: await getPresignedUrl(pdf.pdf_url),
  created_at: pdf.created_at,
});

export const formatIssue = async (
  issue: IssueRow,
  journal: JournalRow,
  pdfs: PdfRow[]
) => ({
  _id: issue._id,
  journalId: issue.journal_id,
  issueLabel: issue.issue_label,
  title: journal.title,
  description: journal.description,
  pdfs: await Promise.all(
    pdfs.filter((pdf) => pdf.issue_id === issue._id).map(formatPdf)
  ),
  created_at: issue.created_at,
  updated_at: issue.updated_at,
});

const formatJournal = async (journal: JournalRow) => ({
  _id: journal._id,
  title: journal.title,
  description: journal.description,
  serialNumber: journal.serial_number,
  imageUrl: await getPresignedUrl(journal.image_url),
  created_at: journal.created_at,
  updated_at: journal.updated_at,
});

export const fetchJournals = async (journalFilter?: { id?: string }) => {
  let journalQuery = 'SELECT * FROM journals';
  const params: string[] = [];

  if (journalFilter?.id) {
    journalQuery += ' WHERE _id = $1';
    params.push(journalFilter.id);
  }

  journalQuery += ' ORDER BY serial_number ASC';

  const journalsResult = await pool.query(journalQuery, params);
  return Promise.all(
    (journalsResult.rows as JournalRow[]).map((journal) => formatJournal(journal))
  );
};

export const fetchIssuesWithDetails = async (filter?: {
  journalId?: string;
  issueId?: string;
}) => {
  let issueQuery = `
    SELECT ji.*, j.title, j.description, j.serial_number, j.image_url,
           j.created_at AS journal_created_at, j.updated_at AS journal_updated_at
    FROM journal_issues ji
    JOIN journals j ON j._id = ji.journal_id
  `;
  const params: string[] = [];

  if (filter?.issueId) {
    issueQuery += ' WHERE ji._id = $1';
    params.push(filter.issueId);
  } else if (filter?.journalId) {
    issueQuery += ' WHERE ji.journal_id = $1';
    params.push(filter.journalId);
  }

  issueQuery += ' ORDER BY ji.created_at DESC';

  const issuesResult = await pool.query(issueQuery, params);
  const rows = issuesResult.rows;

  if (rows.length === 0) {
    return [];
  }

  const issues: IssueRow[] = rows.map((row) => ({
    _id: row._id,
    journal_id: row.journal_id,
    issue_label: row.issue_label,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  const journals: JournalRow[] = rows.map((row) => ({
    _id: row.journal_id,
    title: row.title,
    description: row.description,
    serial_number: row.serial_number,
    image_url: row.image_url,
    created_at: row.journal_created_at,
    updated_at: row.journal_updated_at,
  }));

  const issueIds = issues.map((issue) => issue._id);
  const pdfsResult = await pool.query(
    'SELECT * FROM issue_pdfs WHERE issue_id = ANY($1) ORDER BY created_at ASC',
    [issueIds]
  );
  const pdfs: PdfRow[] = pdfsResult.rows;

  return Promise.all(
    issues.map((issue, index) => formatIssue(issue, journals[index], pdfs))
  );
};

export const ensureJournalExists = async (journalId: string) => {
  const result = await pool.query('SELECT _id FROM journals WHERE _id = $1', [journalId]);

  if (result.rows.length === 0) {
    throw new AppError('Journal not found', 404);
  }
};

export const ensureIssueExists = async (issueId: string) => {
  const result = await pool.query('SELECT * FROM journal_issues WHERE _id = $1', [issueId]);

  if (result.rows.length === 0) {
    throw new AppError('Issue not found', 404);
  }

  return result.rows[0];
};

export const saveIssuePdfs = async (issueId: string, files: Express.Multer.File[]) => {
  const savedPdfs = [];

  for (const file of files) {
    const pdfKey = await uploadIssuePdfToS3(file);
    const result = await pool.query(
      `INSERT INTO issue_pdfs (issue_id, title, pdf_url)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [issueId, file.originalname, pdfKey]
    );
    savedPdfs.push(result.rows[0]);
  }

  return savedPdfs;
};
