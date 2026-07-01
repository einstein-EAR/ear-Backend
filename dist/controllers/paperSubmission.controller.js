"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePaperSubmission = exports.updatePaperSubmission = exports.getPaperSubmissionById = exports.getAllPaperSubmissions = exports.createPaperSubmission = void 0;
const db_1 = __importDefault(require("../components/db"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const upload_service_1 = require("../services/upload.service");
const REQUIRED_FIELDS = ['name', 'emailId', 'titleOfPaper', 'country', 'mobile', 'message'];
const formatPaperSubmission = async (row) => ({
    _id: row._id,
    name: row.name,
    emailId: row.email_id,
    titleOfPaper: row.title_of_paper,
    country: row.country,
    mobile: row.mobile,
    message: row.message,
    paperFileUrl: await (0, upload_service_1.getPresignedPaperUrl)(row.paper_file_url),
    created_at: row.created_at,
    updated_at: row.updated_at,
});
const validatePaperSubmission = (body) => {
    for (const field of REQUIRED_FIELDS) {
        if (typeof body[field] !== 'string' || !body[field].trim()) {
            throw new AppError_1.default(`${field} is required`, 400);
        }
    }
    return {
        name: body.name.trim(),
        emailId: body.emailId.trim(),
        titleOfPaper: body.titleOfPaper.trim(),
        country: body.country.trim(),
        mobile: body.mobile.trim(),
        message: body.message.trim(),
    };
};
const createPaperSubmission = async (req, res) => {
    if (!req.file) {
        throw new AppError_1.default('Paper file (PDF or DOC) is required', 400);
    }
    const data = validatePaperSubmission(req.body);
    const paperFileKey = await (0, upload_service_1.uploadPaperToS3)(req.file);
    const result = await db_1.default.query(`INSERT INTO paper_submissions
      (name, email_id, title_of_paper, country, mobile, message, paper_file_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`, [
        data.name,
        data.emailId,
        data.titleOfPaper,
        data.country,
        data.mobile,
        data.message,
        paperFileKey,
    ]);
    res.status(201).json(await formatPaperSubmission(result.rows[0]));
};
exports.createPaperSubmission = createPaperSubmission;
const getAllPaperSubmissions = async (_req, res) => {
    const result = await db_1.default.query('SELECT * FROM paper_submissions ORDER BY created_at DESC');
    const submissions = await Promise.all(result.rows.map(formatPaperSubmission));
    res.json(submissions);
};
exports.getAllPaperSubmissions = getAllPaperSubmissions;
const getPaperSubmissionById = async (req, res) => {
    const result = await db_1.default.query('SELECT * FROM paper_submissions WHERE _id = $1', [req.params.id]);
    if (result.rows.length === 0) {
        throw new AppError_1.default('Paper submission not found', 404);
    }
    res.json(await formatPaperSubmission(result.rows[0]));
};
exports.getPaperSubmissionById = getPaperSubmissionById;
const updatePaperSubmission = async (req, res) => {
    const data = validatePaperSubmission(req.body);
    const existing = await db_1.default.query('SELECT * FROM paper_submissions WHERE _id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
        throw new AppError_1.default('Paper submission not found', 404);
    }
    let paperFileKey = existing.rows[0].paper_file_url;
    if (req.file) {
        paperFileKey = await (0, upload_service_1.uploadPaperToS3)(req.file);
    }
    const result = await db_1.default.query(`UPDATE paper_submissions
     SET name = $1, email_id = $2, title_of_paper = $3, country = $4,
         mobile = $5, message = $6, paper_file_url = $7, updated_at = NOW()
     WHERE _id = $8
     RETURNING *`, [
        data.name,
        data.emailId,
        data.titleOfPaper,
        data.country,
        data.mobile,
        data.message,
        paperFileKey,
        req.params.id,
    ]);
    res.json(await formatPaperSubmission(result.rows[0]));
};
exports.updatePaperSubmission = updatePaperSubmission;
const deletePaperSubmission = async (req, res) => {
    const result = await db_1.default.query('DELETE FROM paper_submissions WHERE _id = $1 RETURNING _id', [req.params.id]);
    if (result.rows.length === 0) {
        throw new AppError_1.default('Paper submission not found', 404);
    }
    res.json({ message: 'Paper submission deleted successfully' });
};
exports.deletePaperSubmission = deletePaperSubmission;
