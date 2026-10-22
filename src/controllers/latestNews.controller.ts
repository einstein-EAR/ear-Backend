import { Request, Response } from 'express';
import pool from '../components/db';
import AppError from '../utils/AppError';
import { uploadLatestNewsImageToS3 } from '../services/upload.service';
import {
  ensureLatestNewsExists,
  fetchLatestNews,
} from '../services/latestNews.service';

const getParam = (value: string | string[]): string =>
  Array.isArray(value) ? value[0] : value;

const getOptionalString = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value.trim() : fallback;

const parseSortOrder = (value: unknown, fallback = 0) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new AppError('sortOrder must be a number', 400);
  }

  return parsed;
};

const parsePublishedAt = (value: unknown, fallback?: Date) => {
  if (value === undefined || value === null || value === '') {
    return fallback ?? new Date();
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('publishedAt must be a valid date', 400);
  }

  return parsed;
};

const validateNewsFields = (body: Record<string, unknown>, options?: { requireAll?: boolean }) => {
  const title = getOptionalString(body.title);
  const excerpt = getOptionalString(body.excerpt);

  if (options?.requireAll !== false) {
    if (!title) throw new AppError('title is required', 400);
    if (!excerpt) throw new AppError('excerpt is required', 400);
  }

  return {
    title,
    excerpt,
    publishedAt: parsePublishedAt(body.publishedAt),
    sortOrder: parseSortOrder(body.sortOrder),
  };
};

export const getAllLatestNews = async (_req: Request, res: Response) => {
  const news = await fetchLatestNews();
  res.json(news);
};

export const getLatestNewsById = async (req: Request, res: Response) => {
  const news = await fetchLatestNews({ id: getParam(req.params.id) });

  if (news.length === 0) {
    throw new AppError('Latest news item not found', 404);
  }

  res.json(news[0]);
};

export const createLatestNews = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('News image is required', 400);
  }

  const data = validateNewsFields(req.body);
  const imageKey = await uploadLatestNewsImageToS3(req.file);

  const result = await pool.query(
    `INSERT INTO latest_news (title, excerpt, image_url, published_at, sort_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.title, data.excerpt, imageKey, data.publishedAt, data.sortOrder]
  );

  const news = await fetchLatestNews({ id: result.rows[0]._id });
  res.status(201).json(news[0]);
};

export const updateLatestNews = async (req: Request, res: Response) => {
  const newsId = getParam(req.params.id);
  const existing = await ensureLatestNewsExists(newsId);

  const title =
    req.body.title !== undefined ? getOptionalString(req.body.title) : existing.title;
  const excerpt =
    req.body.excerpt !== undefined ? getOptionalString(req.body.excerpt) : existing.excerpt;

  if (!title) {
    throw new AppError('title cannot be empty', 400);
  }
  if (!excerpt) {
    throw new AppError('excerpt cannot be empty', 400);
  }

  const publishedAt =
    req.body.publishedAt !== undefined
      ? parsePublishedAt(req.body.publishedAt)
      : existing.published_at;
  const sortOrder =
    req.body.sortOrder !== undefined
      ? parseSortOrder(req.body.sortOrder)
      : existing.sort_order;

  let imageKey = existing.image_url;
  if (req.file) {
    imageKey = await uploadLatestNewsImageToS3(req.file);
  }

  await pool.query(
    `UPDATE latest_news
     SET title = $1,
         excerpt = $2,
         image_url = $3,
         published_at = $4,
         sort_order = $5,
         updated_at = NOW()
     WHERE _id = $6`,
    [title, excerpt, imageKey, publishedAt, sortOrder, newsId]
  );

  const news = await fetchLatestNews({ id: newsId });
  res.json(news[0]);
};

export const deleteLatestNews = async (req: Request, res: Response) => {
  const newsId = getParam(req.params.id);
  const result = await pool.query('DELETE FROM latest_news WHERE _id = $1 RETURNING _id', [
    newsId,
  ]);

  if (result.rows.length === 0) {
    throw new AppError('Latest news item not found', 404);
  }

  res.json({ message: 'Latest news item deleted successfully' });
};
