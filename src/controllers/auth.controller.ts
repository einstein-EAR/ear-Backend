import { Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../components/db';
import AppError from '../utils/AppError';
import { generateAccessToken } from '../utils/JWT';
import { AuthRequest } from '../middlewares/authMiddleware';

const getOptionalString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

export const register = async (req: AuthRequest, res: Response) => {
  const { name, email, password, role = 'user' } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Name, email and password are required', 400);
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new AppError('Email already exists', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role`,
    [name, email, hashedPassword, role]
  );

  const user = result.rows[0];
  const token = generateAccessToken(String(user.id), user.role);

  res.status(200).json({ user, token });
};

export const login = async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  if (!user?.password) {
    throw new AppError('Invalid credentials', 400);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 400);
  }

  const token = generateAccessToken(String(user.id), user.role);

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  });
};

export const updateCredentials = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const name = getOptionalString(req.body.name);
  const email = getOptionalString(req.body.email);
  const password = getOptionalString(req.body.password);
  const currentPassword = getOptionalString(req.body.currentPassword);

  if (!name && !email && !password) {
    throw new AppError('At least one of name, email or password is required', 400);
  }

  const existingResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  const existing = existingResult.rows[0];

  if (!existing) {
    throw new AppError('User not found', 404);
  }

  if (password) {
    if (!currentPassword) {
      throw new AppError('currentPassword is required to update password', 400);
    }

    const isMatch = await bcrypt.compare(currentPassword, existing.password);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400);
    }
  }

  if (email && email !== existing.email) {
    const emailTaken = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id <> $2',
      [email, userId]
    );
    if (emailTaken.rows.length > 0) {
      throw new AppError('Email already exists', 400);
    }
  }

  const nextName = name || existing.name;
  const nextEmail = email || existing.email;
  const nextPassword = password
    ? await bcrypt.hash(password, 10)
    : existing.password;

  const result = await pool.query(
    `UPDATE users
     SET name = $1, email = $2, password = $3
     WHERE id = $4
     RETURNING id, name, email, role`,
    [nextName, nextEmail, nextPassword, userId]
  );

  const user = result.rows[0];
  const token = generateAccessToken(String(user.id), user.role);

  res.json({
    message: 'Credentials updated successfully',
    user,
    token,
  });
};
