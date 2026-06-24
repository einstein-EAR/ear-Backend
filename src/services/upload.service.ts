import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import s3 from '../utils/S3Client';
import AppError from '../utils/AppError';

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const uploadPaperToS3 = async (file: Express.Multer.File): Promise<string> => {
  if (!BUCKET_NAME) {
    throw new AppError('AWS S3 bucket is not configured', 500);
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new AppError('Only PDF and DOC/DOCX files are allowed', 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new AppError('File size must be 10MB or less', 400);
  }

  const key = `paper-submissions/${Date.now()}-${randomUUID()}-${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};
