"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadIssuePdfToS3 = exports.uploadJournalImageToS3 = exports.uploadPaperToS3 = exports.getPresignedPaperUrl = exports.getPresignedUrl = exports.extractS3Key = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const crypto_1 = require("crypto");
const S3Client_1 = __importDefault(require("../utils/S3Client"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
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
const extractS3Key = (stored) => {
    if (stored.startsWith('http')) {
        const url = new URL(stored);
        return decodeURIComponent(url.pathname.slice(1));
    }
    return stored;
};
exports.extractS3Key = extractS3Key;
const getPresignedUrl = async (stored) => {
    const key = (0, exports.extractS3Key)(stored);
    const command = new client_s3_1.GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });
    return (0, s3_request_presigner_1.getSignedUrl)(S3Client_1.default, command, { expiresIn: PRESIGNED_URL_EXPIRY });
};
exports.getPresignedUrl = getPresignedUrl;
exports.getPresignedPaperUrl = exports.getPresignedUrl;
const uploadToS3 = async (file, folder, allowedMimeTypes, maxSize, typeLabel) => {
    if (!BUCKET_NAME) {
        throw new AppError_1.default('AWS S3 bucket is not configured', 500);
    }
    if (!allowedMimeTypes.has(file.mimetype)) {
        throw new AppError_1.default(`Invalid ${typeLabel} file type`, 400);
    }
    if (file.size > maxSize) {
        throw new AppError_1.default(`${typeLabel} file size limit exceeded`, 400);
    }
    const key = `${folder}/${Date.now()}-${(0, crypto_1.randomUUID)()}-${file.originalname}`;
    const command = new client_s3_1.PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    });
    await S3Client_1.default.send(command);
    return key;
};
const uploadPaperToS3 = (file) => uploadToS3(file, 'paper-submissions', PDF_MIME_TYPES, MAX_PDF_SIZE, 'Paper');
exports.uploadPaperToS3 = uploadPaperToS3;
const uploadJournalImageToS3 = (file) => uploadToS3(file, 'journals/images', IMAGE_MIME_TYPES, MAX_IMAGE_SIZE, 'Image');
exports.uploadJournalImageToS3 = uploadJournalImageToS3;
const uploadIssuePdfToS3 = (file) => uploadToS3(file, 'journals/issue-pdfs', PDF_MIME_TYPES, MAX_PDF_SIZE, 'PDF');
exports.uploadIssuePdfToS3 = uploadIssuePdfToS3;
