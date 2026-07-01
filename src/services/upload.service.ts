import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import s3 from '../utils/S3Client';
import AppError from '../utils/AppError';

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const PRESIGNED_URL_EXPIRY = 60 * 60; // 1 hour

const PDF_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export const extractS3Key = (stored: string): string => {
  if (stored.startsWith('http')) {
    const url = new URL(stored);
    return decodeURIComponent(url.pathname.slice(1));
  }
  return stored;
};

export const getPresignedUrl = async (stored: string): Promise<string> => {
  const key = extractS3Key(stored);

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn: PRESIGNED_URL_EXPIRY });
};

export const getPresignedPaperUrl = getPresignedUrl;

const uploadToS3 = async (
  file: Express.Multer.File,
  folder: string,
  allowedMimeTypes: Set<string>,
  maxSize: number,
  typeLabel: string
): Promise<string> => {
  if (!BUCKET_NAME) {
    throw new AppError('AWS S3 bucket is not configured', 500);
  }

  if (!allowedMimeTypes.has(file.mimetype)) {
    throw new AppError(`Invalid ${typeLabel} file type`, 400);
  }

  if (file.size > maxSize) {
    throw new AppError(`${typeLabel} file size limit exceeded`, 400);
  }

  const key = `${folder}/${Date.now()}-${randomUUID()}-${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  return key;
};

export const uploadPaperToS3 = (file: Express.Multer.File) =>
  uploadToS3(file, 'paper-submissions', PDF_MIME_TYPES, MAX_PDF_SIZE, 'Paper');

export const uploadJournalImageToS3 = (file: Express.Multer.File) =>
  uploadToS3(file, 'journals/images', IMAGE_MIME_TYPES, MAX_IMAGE_SIZE, 'Image');

export const uploadIssuePdfToS3 = (file: Express.Multer.File) =>
  uploadToS3(file, 'journals/issue-pdfs', PDF_MIME_TYPES, MAX_PDF_SIZE, 'PDF');
