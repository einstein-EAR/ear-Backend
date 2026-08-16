import { Request, Response } from 'express';
import pool from '../components/db';
import AppError from '../utils/AppError';
import { uploadIssuePdfToS3 } from '../services/upload.service';
import {
  fetchIssuesWithDetails,
  ensureJournalExists,
  ensureIssueExists,
  ensurePdfExists,
  saveIssuePdfs,
  fetchPdfById,
  searchPdfs as searchPdfsService,
} from '../services/journal.service';

const getParam = (value: string | string[]): string =>
  Array.isArray(value) ? value[0]! : value;

const getOptionalString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const validateIssueFields = (body: Record<string, unknown>) => {
  const issueLabel =
    typeof body.issueLabel === 'string' ? body.issueLabel.trim() : '';
  const description =
    typeof body.description === 'string' ? body.description.trim() : '';

  if (!issueLabel || !description) {
    throw new AppError('issueLabel and description are required', 400);
  }

  return { issueLabel, description };
};

export const getAllIssues = async (_req: Request, res: Response) => {
  const issues = await fetchIssuesWithDetails();
  res.json(issues);
};

export const searchPdfs = async (req: Request, res: Response) => {
  const query = typeof req.query.query === 'string' ? req.query.query : undefined;

  const pdfs = await searchPdfsService(query);
  res.json(pdfs);
};

export const getIssuesByJournal = async (req: Request, res: Response) => {
  const journalId = getParam(req.params.journalId!);
  await ensureJournalExists(journalId);

  const issues = await fetchIssuesWithDetails({ journalId });
  res.json(issues);
};

export const getIssueById = async (req: Request, res: Response) => {
  const issues = await fetchIssuesWithDetails({ issueId: getParam(req.params.id!) });

  if (issues.length === 0) {
    throw new AppError('Issue not found', 404);
  }

  res.json(issues[0]);
};

export const createIssue = async (req: Request, res: Response) => {
  const journalId =
    typeof req.body.journalId === 'string' ? req.body.journalId.trim() : '';
  const { issueLabel, description } = validateIssueFields(req.body);

  if (!journalId) {
    throw new AppError('journalId is required', 400);
  }

  await ensureJournalExists(journalId);

  const issueResult = await pool.query(
    `INSERT INTO journal_issues (journal_id, issue_label, description)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [journalId, issueLabel, description]
  );

  const issues = await fetchIssuesWithDetails({ issueId: issueResult.rows[0]._id });
  res.status(201).json(issues[0]);
};

export const updateIssue = async (req: Request, res: Response) => {
  const issueId = getParam(req.params.id!);
  await ensureIssueExists(issueId);

  const { issueLabel, description } = validateIssueFields(req.body);

  await pool.query(
    `UPDATE journal_issues
     SET issue_label = $1, description = $2, updated_at = NOW()
     WHERE _id = $3`,
    [issueLabel, description, issueId]
  );

  const issues = await fetchIssuesWithDetails({ issueId });
  res.json(issues[0]);
};

export const uploadIssuePdfs = async (req: Request, res: Response) => {
  const issueId = getParam(req.params.id!);
  await ensureIssueExists(issueId);

  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) {
    throw new AppError('At least one PDF is required', 400);
  }

  const author = getOptionalString(req.body.author);
  const doi = getOptionalString(req.body.doi);
  const title = getOptionalString(req.body.title) || undefined;

  await saveIssuePdfs(issueId, files, { title, author, doi });

  const issues = await fetchIssuesWithDetails({ issueId });
  res.status(201).json(issues[0]);
};

export const updateIssuePdf = async (req: Request, res: Response) => {
  const pdfId = getParam(req.params.pdfId!);
  const existing = await ensurePdfExists(pdfId);

  const title =
    req.body.title !== undefined
      ? getOptionalString(req.body.title) || existing.title
      : existing.title;
  const author =
    req.body.author !== undefined ? getOptionalString(req.body.author) : existing.author;
  const doi = req.body.doi !== undefined ? getOptionalString(req.body.doi) : existing.doi;

  let pdfUrl = existing.pdf_url;
  if (req.file) {
    pdfUrl = await uploadIssuePdfToS3(req.file);
  }

  await pool.query(
    `UPDATE issue_pdfs
     SET title = $1, author = $2, doi = $3, pdf_url = $4
     WHERE _id = $5`,
    [title, author, doi, pdfUrl, pdfId]
  );

  const pdf = await fetchPdfById(pdfId);
  res.json(pdf);
};

export const deleteIssuePdf = async (req: Request, res: Response) => {
  const pdfId = getParam(req.params.pdfId!);
  const result = await pool.query(
    'DELETE FROM issue_pdfs WHERE _id = $1 RETURNING _id',
    [pdfId]
  );

  if (result.rows.length === 0) {
    throw new AppError('PDF not found', 404);
  }

  res.json({ message: 'PDF deleted successfully' });
};

export const deleteIssue = async (req: Request, res: Response) => {
  const issueId = getParam(req.params.id!);
  const result = await pool.query(
    'DELETE FROM journal_issues WHERE _id = $1 RETURNING _id',
    [issueId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Issue not found', 404);
  }

  res.json({ message: 'Issue deleted successfully' });
};
