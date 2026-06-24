import { Request, Response } from 'express';
import pool from '../components/db';

export const getAllUsers = async (_req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM users ORDER BY id');
  res.json(result.rows);
};
