import { Request, Response } from 'express';
import pool from '../components/db';
import AppError from '../utils/AppError';
import {
  fetchIssuesWithDetails,
  ensureJournalExists,
  ensureIssueExists,
  saveIssuePdfs,
} from '../services/journal.service';

const getParam = (value: string | string[]): string =>
  Array.isArray(value) ? value[0] : value;

export const getAllIssues = async (_req: Request, res: Response) => {
  const issues = await fetchIssuesWithDetails();
  res.json(issues);
};

export const getIssuesByJournal = async (req: Request, res: Response) => {
  const journalId = getParam(req.params.journalId);
  await ensureJournalExists(journalId);

  const issues = await fetchIssuesWithDetails({ journalId });
  res.json(issues);
};

export const getIssueById = async (req: Request, res: Response) => {
  const issues = await fetchIssuesWithDetails({ issueId: getParam(req.params.id) });

  if (issues.length === 0) {
    throw new AppError('Issue not found', 404);
  }

  res.json(issues[0]);
};

export const createIssue = async (req: Request, res: Response) => {
  const journalId =
    typeof req.body.journalId === 'string' ? req.body.journalId.trim() : '';
  const issueLabel =
    typeof req.body.issueLabel === 'string' ? req.body.issueLabel.trim() : '';

  if (!journalId || !issueLabel) {
    throw new AppError('journalId and issueLabel are required', 400);
  }

  await ensureJournalExists(journalId);

  const issueResult = await pool.query(
    `INSERT INTO journal_issues (journal_id, issue_label)
     VALUES ($1, $2)
     RETURNING *`,
    [journalId, issueLabel]
  );

  const issues = await fetchIssuesWithDetails({ issueId: issueResult.rows[0]._id });
  res.status(201).json(issues[0]);
};

export const updateIssue = async (req: Request, res: Response) => {
  const issueId = getParam(req.params.id);
  await ensureIssueExists(issueId);

  const issueLabel =
    typeof req.body.issueLabel === 'string' ? req.body.issueLabel.trim() : '';

  if (!issueLabel) {
    throw new AppError('issueLabel is required', 400);
  }

  await pool.query(
    `UPDATE journal_issues
     SET issue_label = $1, updated_at = NOW()
     WHERE _id = $2`,
    [issueLabel, issueId]
  );

  const issues = await fetchIssuesWithDetails({ issueId });
  res.json(issues[0]);
};

export const uploadIssuePdfs = async (req: Request, res: Response) => {
  const issueId = getParam(req.params.id);
  await ensureIssueExists(issueId);

  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) {
    throw new AppError('At least one PDF is required', 400);
  }

  await saveIssuePdfs(issueId, files);

  const issues = await fetchIssuesWithDetails({ issueId });
  res.json(issues[0]);
};

export const deleteIssue = async (req: Request, res: Response) => {
  const issueId = getParam(req.params.id);
  const result = await pool.query(
    'DELETE FROM journal_issues WHERE _id = $1 RETURNING _id',
    [issueId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Issue not found', 404);
  }

  res.json({ message: 'Issue deleted successfully' });
};
