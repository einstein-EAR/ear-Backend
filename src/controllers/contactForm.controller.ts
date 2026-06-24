import { Request, Response } from 'express';
import pool from '../components/db';
import AppError from '../utils/AppError';

const REQUIRED_FIELDS = ['name', 'email', 'phone', 'subject', 'country', 'message'] as const;

type ContactFormInput = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  country: string;
  message: string;
};

type ContactFormRow = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  country: string;
  message: string;
  created_at: Date;
  updated_at: Date;
};

const formatContactForm = (row: ContactFormRow) => ({
  _id: row._id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  subject: row.subject,
  country: row.country,
  message: row.message,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const validateContactForm = (body: Record<string, unknown>): ContactFormInput => {
  for (const field of REQUIRED_FIELDS) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      throw new AppError(`${field} is required`, 400);
    }
  }

  return {
    name: (body.name as string).trim(),
    email: (body.email as string).trim(),
    phone: (body.phone as string).trim(),
    subject: (body.subject as string).trim(),
    country: (body.country as string).trim(),
    message: (body.message as string).trim(),
  };
};

export const createContactForm = async (req: Request, res: Response) => {
  const data = validateContactForm(req.body);

  const result = await pool.query(
    `INSERT INTO contact_forms (name, email, phone, subject, country, message)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.name, data.email, data.phone, data.subject, data.country, data.message]
  );

  res.status(201).json(formatContactForm(result.rows[0]));
};

export const getAllContactForms = async (_req: Request, res: Response) => {
  const result = await pool.query(
    'SELECT * FROM contact_forms ORDER BY created_at DESC'
  );

  res.json(result.rows.map(formatContactForm));
};

export const getContactFormById = async (req: Request, res: Response) => {
  const result = await pool.query(
    'SELECT * FROM contact_forms WHERE _id = $1',
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Contact form not found', 404);
  }

  res.json(formatContactForm(result.rows[0]));
};

export const updateContactForm = async (req: Request, res: Response) => {
  const data = validateContactForm(req.body);

  const result = await pool.query(
    `UPDATE contact_forms
     SET name = $1, email = $2, phone = $3, subject = $4, country = $5, message = $6, updated_at = NOW()
     WHERE _id = $7
     RETURNING *`,
    [data.name, data.email, data.phone, data.subject, data.country, data.message, req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Contact form not found', 404);
  }

  res.json(formatContactForm(result.rows[0]));
};

export const deleteContactForm = async (req: Request, res: Response) => {
  const result = await pool.query(
    'DELETE FROM contact_forms WHERE _id = $1 RETURNING _id',
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Contact form not found', 404);
  }

  res.json({ message: 'Contact form deleted successfully' });
};
