import multer from 'multer';
import AppError from '../utils/AppError';

const storage = multer.memoryStorage();

const createFileFilter =
  (allowedMimeTypes: string[], errorMessage: string): multer.Options['fileFilter'] =>
  (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new AppError(errorMessage, 400));
  };

const PDF_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const uploadPaper = multer({
  storage,
  fileFilter: createFileFilter(PDF_MIME_TYPES, 'Only PDF and DOC/DOCX files are allowed'),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadJournalImage = multer({
  storage,
  fileFilter: createFileFilter(IMAGE_MIME_TYPES, 'Only JPEG, PNG, WEBP and GIF images are allowed'),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadIssuePdfs = multer({
  storage,
  fileFilter: createFileFilter(PDF_MIME_TYPES, 'Only PDF and DOC/DOCX files are allowed'),
  limits: { fileSize: 10 * 1024 * 1024 },
});
