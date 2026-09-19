import { Request, Response } from 'express';
import pool from '../components/db';
import AppError from '../utils/AppError';
import { getPresignedUrl, uploadSiteImageToS3 } from '../services/upload.service';

type SiteSettingsRow = {
  _id: string;
  title: string;
  subtitle: string;
  phone: string;
  email: string;
  issn: string;
  fav_icon: string;
  icon_image: string;
  created_at: Date;
  updated_at: Date;
};

const getOptionalString = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value.trim() : fallback;

const formatSiteSettings = async (row: SiteSettingsRow) => ({
  _id: row._id,
  title: row.title,
  subtitle: row.subtitle,
  phone: row.phone,
  email: row.email,
  issn: row.issn,
  favIcon: row.fav_icon ? await getPresignedUrl(row.fav_icon) : '',
  iconImage: row.icon_image ? await getPresignedUrl(row.icon_image) : '',
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const ensureSiteSettings = async (): Promise<SiteSettingsRow> => {
  const existing = await pool.query('SELECT * FROM site_settings ORDER BY created_at ASC LIMIT 1');

  if (existing.rows.length > 0) {
    return existing.rows[0] as SiteSettingsRow;
  }

  const created = await pool.query(
    `INSERT INTO site_settings (title, subtitle, phone, email, issn, fav_icon, icon_image)
     VALUES ('', '', '', '', '', '', '')
     RETURNING *`
  );

  return created.rows[0] as SiteSettingsRow;
};

export const getSiteSettings = async (_req: Request, res: Response) => {
  const settings = await ensureSiteSettings();
  res.json(await formatSiteSettings(settings));
};

export const updateSiteSettings = async (req: Request, res: Response) => {
  const existing = await ensureSiteSettings();
  const files = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;

  const title =
    req.body.title !== undefined ? getOptionalString(req.body.title) : existing.title;
  const subtitle =
    req.body.subtitle !== undefined
      ? getOptionalString(req.body.subtitle)
      : existing.subtitle;
  const phone =
    req.body.phone !== undefined ? getOptionalString(req.body.phone) : existing.phone;
  const email =
    req.body.email !== undefined ? getOptionalString(req.body.email) : existing.email;
  const issn =
    req.body.issn !== undefined ? getOptionalString(req.body.issn) : existing.issn;

  let favIconKey = existing.fav_icon;
  let iconImageKey = existing.icon_image;

  const favIconFile = files?.favIcon?.[0];
  const iconImageFile = files?.iconImage?.[0];

  if (favIconFile) {
    favIconKey = await uploadSiteImageToS3(favIconFile, 'journals/site-settings/favicon');
  }

  if (iconImageFile) {
    iconImageKey = await uploadSiteImageToS3(iconImageFile, 'journals/site-settings/icon');
  }

  if (!title && !subtitle && !phone && !email && !issn && !favIconKey && !iconImageKey) {
    throw new AppError('At least one field is required', 400);
  }

  const result = await pool.query(
    `UPDATE site_settings
     SET title = $1,
         subtitle = $2,
         phone = $3,
         email = $4,
         issn = $5,
         fav_icon = $6,
         icon_image = $7,
         updated_at = NOW()
     WHERE _id = $8
     RETURNING *`,
    [title, subtitle, phone, email, issn, favIconKey, iconImageKey, existing._id]
  );

  res.json(await formatSiteSettings(result.rows[0] as SiteSettingsRow));
};
