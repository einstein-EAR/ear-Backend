"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSiteSettingsImages = exports.uploadIssuePdfs = exports.uploadJournalImage = exports.uploadPaper = void 0;
const multer_1 = __importDefault(require("multer"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const storage = multer_1.default.memoryStorage();
const createFileFilter = (allowedMimeTypes, errorMessage) => (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
        return;
    }
    cb(new AppError_1.default(errorMessage, 400));
};
const PDF_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const SITE_IMAGE_MIME_TYPES = [
    ...IMAGE_MIME_TYPES,
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon',
];
exports.uploadPaper = (0, multer_1.default)({
    storage,
    fileFilter: createFileFilter(PDF_MIME_TYPES, 'Only PDF and DOC/DOCX files are allowed'),
    limits: { fileSize: 10 * 1024 * 1024 },
});
exports.uploadJournalImage = (0, multer_1.default)({
    storage,
    fileFilter: createFileFilter(IMAGE_MIME_TYPES, 'Only JPEG, PNG, WEBP and GIF images are allowed'),
    limits: { fileSize: 5 * 1024 * 1024 },
});
exports.uploadIssuePdfs = (0, multer_1.default)({
    storage,
    fileFilter: createFileFilter(PDF_MIME_TYPES, 'Only PDF and DOC/DOCX files are allowed'),
    limits: { fileSize: 10 * 1024 * 1024 },
});
exports.uploadSiteSettingsImages = (0, multer_1.default)({
    storage,
    fileFilter: createFileFilter(SITE_IMAGE_MIME_TYPES, 'Only JPEG, PNG, WEBP, GIF, SVG and ICO images are allowed'),
    limits: { fileSize: 5 * 1024 * 1024 },
});
