import { Request, Response } from 'express';
import pool from '../components/db';
import AppError from '../utils/AppError';
import { uploadPaperToS3, getPresignedPaperUrl } from '../services/upload.service';

const REQUIRED_FIELDS = ['name', 'emailId', 'titleOfPaper', 'country', 'mobile', 'message'] as const;

type PaperSubmissionInput = {
  name: string;
  emailId: string;
  titleOfPaper: string;
  country: string;
  mobile: string;
  message: string;
};

type PaperSubmissionRow = {
  _id: string;
  name: string;
  email_id: string;
  title_of_paper: string;
  country: string;
  mobile: string;
  message: string;
  paper_file_url: string;
  created_at: Date;
  updated_at: Date;
};

const formatPaperSubmission = async (row: PaperSubmissionRow) => ({
  _id: row._id,
  name: row.name,
  emailId: row.email_id,
  titleOfPaper: row.title_of_paper,
  country: row.country,
  mobile: row.mobile,
  message: row.message,
  paperFileUrl: await getPresignedPaperUrl(row.paper_file_url),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const validatePaperSubmission = (body: Record<string, unknown>): PaperSubmissionInput => {
  for (const field of REQUIRED_FIELDS) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      throw new AppError(`${field} is required`, 400);
    }
  }

  return {
    name: (body.name as string).trim(),
    emailId: (body.emailId as string).trim(),
    titleOfPaper: (body.titleOfPaper as string).trim(),
    country: (body.country as string).trim(),
    mobile: (body.mobile as string).trim(),
    message: (body.message as string).trim(),
  };
};

export const createPaperSubmission = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('Paper file (PDF or DOC) is required', 400);
  }

  const data = validatePaperSubmission(req.body);
  const paperFileKey = await uploadPaperToS3(req.file);

  const result = await pool.query(
    `INSERT INTO paper_submissions
      (name, email_id, title_of_paper, country, mobile, message, paper_file_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.name,
      data.emailId,
      data.titleOfPaper,
      data.country,
      data.mobile,
      data.message,
      paperFileKey,
    ]
  );

  res.status(201).json(await formatPaperSubmission(result.rows[0]));
};

export const getAllPaperSubmissions = async (_req: Request, res: Response) => {
  const result = await pool.query(
    'SELECT * FROM paper_submissions ORDER BY created_at DESC'
  );

  const submissions = await Promise.all(result.rows.map(formatPaperSubmission));
  res.json(submissions);
};

export const getPaperSubmissionById = async (req: Request, res: Response) => {
  const result = await pool.query(
    'SELECT * FROM paper_submissions WHERE _id = $1',
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Paper submission not found', 404);
  }

  res.json(await formatPaperSubmission(result.rows[0]));
};

export const updatePaperSubmission = async (req: Request, res: Response) => {
  const data = validatePaperSubmission(req.body);

  const existing = await pool.query(
    'SELECT * FROM paper_submissions WHERE _id = $1',
    [req.params.id]
  );

  if (existing.rows.length === 0) {
    throw new AppError('Paper submission not found', 404);
  }

  let paperFileKey = existing.rows[0].paper_file_url;

  if (req.file) {
    paperFileKey = await uploadPaperToS3(req.file);
  }

  const result = await pool.query(
    `UPDATE paper_submissions
     SET name = $1, email_id = $2, title_of_paper = $3, country = $4,
         mobile = $5, message = $6, paper_file_url = $7, updated_at = NOW()
     WHERE _id = $8
     RETURNING *`,
    [
      data.name,
      data.emailId,
      data.titleOfPaper,
      data.country,
      data.mobile,
      data.message,
      paperFileKey,
      req.params.id,
    ]
  );

  res.json(await formatPaperSubmission(result.rows[0]));
};

export const deletePaperSubmission = async (req: Request, res: Response) => {
  const result = await pool.query(
    'DELETE FROM paper_submissions WHERE _id = $1 RETURNING _id',
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Paper submission not found', 404);
  }

  res.json({ message: 'Paper submission deleted successfully' });
};
