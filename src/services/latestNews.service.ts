import pool from '../components/db';
import AppError from '../utils/AppError';
import { getPresignedUrl } from './upload.service';

export type LatestNewsRow = {
  _id: string;
  title: string;
  excerpt: string;
  image_url: string;
  published_at: Date;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
};

export const formatLatestNews = async (item: LatestNewsRow) => ({
  _id: item._id,
  title: item.title,
  excerpt: item.excerpt,
  imageUrl: await getPresignedUrl(item.image_url),
  publishedAt: item.published_at,
  sortOrder: item.sort_order,
  created_at: item.created_at,
  updated_at: item.updated_at,
});

export const fetchLatestNews = async (filter?: { id?: string }) => {
  let query = 'SELECT * FROM latest_news';
  const params: string[] = [];

  if (filter?.id) {
    query += ' WHERE _id = $1';
    params.push(filter.id);
  }

  query += ' ORDER BY sort_order ASC, published_at DESC, created_at DESC';

  const result = await pool.query(query, params);
  return Promise.all((result.rows as LatestNewsRow[]).map(formatLatestNews));
};

export const ensureLatestNewsExists = async (id: string) => {
  const result = await pool.query('SELECT * FROM latest_news WHERE _id = $1', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Latest news item not found', 404);
  }

  return result.rows[0] as LatestNewsRow;
};
