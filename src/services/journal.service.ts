import pool from '../components/db';
import AppError from '../utils/AppError';
import { getPresignedUrl, uploadIssuePdfToS3 } from '../services/upload.service';

export const JOURNAL_CATEGORIES = ['journal', 'conference'] as const;
export type JournalCategory = (typeof JOURNAL_CATEGORIES)[number];

export const isJournalCategory = (value: string): value is JournalCategory =>
  (JOURNAL_CATEGORIES as readonly string[]).includes(value);

type JournalRow = {
  _id: string;
  title: string;
  description: string;
  serial_number: string;
  image_url: string;
  category: string;
  created_at: Date;
  updated_at: Date;
};

type IssueRow = {
  _id: string;
  journal_id: string;
  issue_label: string;
  description: string;
  created_at: Date;
  updated_at: Date;
};

type PdfRow = {
  _id: string;
  issue_id: string;
  title: string;
  author: string;
  doi: string;
  pdf_url: string;
  created_at: Date;
};

export const formatPdf = async (pdf: PdfRow) => ({
  _id: pdf._id,
  title: pdf.title,
  author: pdf.author,
  doi: pdf.doi,
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
  description: issue.description,
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
  category: journal.category || 'journal',
  created_at: journal.created_at,
  updated_at: journal.updated_at,
});

export const fetchJournals = async (journalFilter?: { id?: string; category?: JournalCategory }) => {
  const conditions: string[] = [];
  const params: string[] = [];

  if (journalFilter?.id) {
    params.push(journalFilter.id);
    conditions.push(`_id = $${params.length}`);
  }

  if (journalFilter?.category) {
    params.push(journalFilter.category);
    conditions.push(`category = $${params.length}`);
  }

  let journalQuery = 'SELECT * FROM journals';
  if (conditions.length > 0) {
    journalQuery += ` WHERE ${conditions.join(' AND ')}`;
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
    SELECT ji.*, j.title AS journal_title
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
    description: row.description,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  const journals: JournalRow[] = rows.map((row) => ({
    _id: row.journal_id,
    title: row.journal_title,
    description: '',
    serial_number: '',
    image_url: '',
    category: 'journal',
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  const issueIds = issues.map((issue) => issue._id);
  const pdfsResult = await pool.query(
    'SELECT * FROM issue_pdfs WHERE issue_id = ANY($1) ORDER BY created_at ASC',
    [issueIds]
  );
  const pdfs: PdfRow[] = pdfsResult.rows;

  return Promise.all(
    issues.map((issue, index) => formatIssue(issue, journals[index]!, pdfs))
  );
};

export const fetchPdfById = async (pdfId: string) => {
  const result = await pool.query('SELECT * FROM issue_pdfs WHERE _id = $1', [pdfId]);

  if (result.rows.length === 0) {
    throw new AppError('PDF not found', 404);
  }

  return formatPdf(result.rows[0]);
};

export const searchPdfs = async (query?: string) => {
  const search = query?.trim();

  if (!search) {
    throw new AppError('query is required', 400);
  }

  const result = await pool.query(
    `SELECT p.*, ji.issue_label, ji.journal_id, j.title AS journal_title
     FROM issue_pdfs p
     JOIN journal_issues ji ON ji._id = p.issue_id
     JOIN journals j ON j._id = ji.journal_id
     WHERE p.title ILIKE $1 OR p.author ILIKE $1
     ORDER BY p.created_at DESC`,
    [`%${search}%`]
  );

  return Promise.all(
    (result.rows as (PdfRow & {
      issue_label: string;
      journal_id: string;
      journal_title: string;
    })[]).map(async (pdf) => ({
      ...(await formatPdf(pdf)),
      issueId: pdf.issue_id,
      issueLabel: pdf.issue_label,
      journalId: pdf.journal_id,
      journalTitle: pdf.journal_title,
    }))
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

export const ensurePdfExists = async (pdfId: string) => {
  const result = await pool.query('SELECT * FROM issue_pdfs WHERE _id = $1', [pdfId]);

  if (result.rows.length === 0) {
    throw new AppError('PDF not found', 404);
  }

  return result.rows[0] as PdfRow;
};

export const saveIssuePdfs = async (
  issueId: string,
  files: Express.Multer.File[],
  meta: { title?: string; author: string; doi: string }
) => {
  const savedPdfs = [];

  for (const file of files) {
    const pdfKey = await uploadIssuePdfToS3(file);
    const title = meta.title?.trim() || file.originalname;

    const result = await pool.query(
      `INSERT INTO issue_pdfs (issue_id, title, author, doi, pdf_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [issueId, title, meta.author, meta.doi, pdfKey]
    );
    savedPdfs.push(result.rows[0]);
  }

  return savedPdfs;
};
