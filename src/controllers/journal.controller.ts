import { Request, Response } from 'express';
import pool from '../components/db';
import AppError from '../utils/AppError';
import { uploadJournalImageToS3 } from '../services/upload.service';
import { fetchJournals } from '../services/journal.service';

const getParam = (value: string | string[]): string =>
  Array.isArray(value) ? value[0] : value;

const validateJournalFields = (body: Record<string, unknown>) => {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const serialNumber =
    typeof body.serialNumber === 'string' ? body.serialNumber.trim() : '';

  if (!title || !description || !serialNumber) {
    throw new AppError('title, description and serialNumber are required', 400);
  }

  return { title, description, serialNumber };
};

export const getAllJournals = async (_req: Request, res: Response) => {
  const journals = await fetchJournals();
  res.json(journals);
};

export const getJournalById = async (req: Request, res: Response) => {
  const journals = await fetchJournals({ id: getParam(req.params.id) });

  if (journals.length === 0) {
    throw new AppError('Journal not found', 404);
  }

  res.json(journals[0]);
};

export const createJournal = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('Journal image is required', 400);
  }

  const data = validateJournalFields(req.body);
  const imageKey = await uploadJournalImageToS3(req.file);

  const result = await pool.query(
    `INSERT INTO journals (title, description, serial_number, image_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.title, data.description, data.serialNumber, imageKey]
  );

  const journals = await fetchJournals({ id: result.rows[0]._id });
  res.status(201).json(journals[0]);
};

export const updateJournal = async (req: Request, res: Response) => {
  const journalId = getParam(req.params.id);
  const existing = await pool.query('SELECT * FROM journals WHERE _id = $1', [journalId]);

  if (existing.rows.length === 0) {
    throw new AppError('Journal not found', 404);
  }

  const data = validateJournalFields(req.body);

  let imageKey = existing.rows[0].image_url;
  if (req.file) {
    imageKey = await uploadJournalImageToS3(req.file);
  }

  await pool.query(
    `UPDATE journals
     SET title = $1, description = $2, serial_number = $3,
         image_url = $4, updated_at = NOW()
     WHERE _id = $5`,
    [data.title, data.description, data.serialNumber, imageKey, journalId]
  );

  const journals = await fetchJournals({ id: journalId });
  res.json(journals[0]);
};

export const deleteJournal = async (req: Request, res: Response) => {
  const journalId = getParam(req.params.id);
  const result = await pool.query('DELETE FROM journals WHERE _id = $1 RETURNING _id', [
    journalId,
  ]);

  if (result.rows.length === 0) {
    throw new AppError('Journal not found', 404);
  }

  res.json({ message: 'Journal deleted successfully' });
};
