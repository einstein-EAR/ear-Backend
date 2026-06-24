"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPaperToS3 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const crypto_1 = require("crypto");
const S3Client_1 = __importDefault(require("../utils/S3Client"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const uploadPaperToS3 = async (file) => {
    if (!BUCKET_NAME) {
        throw new AppError_1.default('AWS S3 bucket is not configured', 500);
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        throw new AppError_1.default('Only PDF and DOC/DOCX files are allowed', 400);
    }
    if (file.size > MAX_FILE_SIZE) {
        throw new AppError_1.default('File size must be 10MB or less', 400);
    }
    const key = `paper-submissions/${Date.now()}-${(0, crypto_1.randomUUID)()}-${file.originalname}`;
    const command = new client_s3_1.PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    });
    await S3Client_1.default.send(command);
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};
exports.uploadPaperToS3 = uploadPaperToS3;
