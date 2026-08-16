"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteIssue = exports.deleteIssuePdf = exports.updateIssuePdf = exports.uploadIssuePdfs = exports.updateIssue = exports.createIssue = exports.getIssueById = exports.getIssuesByJournal = exports.searchPdfs = exports.getAllIssues = void 0;
const db_1 = __importDefault(require("../components/db"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const upload_service_1 = require("../services/upload.service");
const journal_service_1 = require("../services/journal.service");
const getParam = (value) => Array.isArray(value) ? value[0] : value;
const getOptionalString = (value) => typeof value === 'string' ? value.trim() : '';
const validateIssueFields = (body) => {
    const issueLabel = typeof body.issueLabel === 'string' ? body.issueLabel.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    if (!issueLabel || !description) {
        throw new AppError_1.default('issueLabel and description are required', 400);
    }
    return { issueLabel, description };
};
const getAllIssues = async (_req, res) => {
    const issues = await (0, journal_service_1.fetchIssuesWithDetails)();
    res.json(issues);
};
exports.getAllIssues = getAllIssues;
const searchPdfs = async (req, res) => {
    const title = typeof req.query.title === 'string' ? req.query.title : undefined;
    const author = typeof req.query.author === 'string' ? req.query.author : undefined;
    const pdfs = await (0, journal_service_1.searchPdfs)({ title, author });
    res.json(pdfs);
};
exports.searchPdfs = searchPdfs;
const getIssuesByJournal = async (req, res) => {
    const journalId = getParam(req.params.journalId);
    await (0, journal_service_1.ensureJournalExists)(journalId);
    const issues = await (0, journal_service_1.fetchIssuesWithDetails)({ journalId });
    res.json(issues);
};
exports.getIssuesByJournal = getIssuesByJournal;
const getIssueById = async (req, res) => {
    const issues = await (0, journal_service_1.fetchIssuesWithDetails)({ issueId: getParam(req.params.id) });
    if (issues.length === 0) {
        throw new AppError_1.default('Issue not found', 404);
    }
    res.json(issues[0]);
};
exports.getIssueById = getIssueById;
const createIssue = async (req, res) => {
    const journalId = typeof req.body.journalId === 'string' ? req.body.journalId.trim() : '';
    const { issueLabel, description } = validateIssueFields(req.body);
    if (!journalId) {
        throw new AppError_1.default('journalId is required', 400);
    }
    await (0, journal_service_1.ensureJournalExists)(journalId);
    const issueResult = await db_1.default.query(`INSERT INTO journal_issues (journal_id, issue_label, description)
     VALUES ($1, $2, $3)
     RETURNING *`, [journalId, issueLabel, description]);
    const issues = await (0, journal_service_1.fetchIssuesWithDetails)({ issueId: issueResult.rows[0]._id });
    res.status(201).json(issues[0]);
};
exports.createIssue = createIssue;
const updateIssue = async (req, res) => {
    const issueId = getParam(req.params.id);
    await (0, journal_service_1.ensureIssueExists)(issueId);
    const { issueLabel, description } = validateIssueFields(req.body);
    await db_1.default.query(`UPDATE journal_issues
     SET issue_label = $1, description = $2, updated_at = NOW()
     WHERE _id = $3`, [issueLabel, description, issueId]);
    const issues = await (0, journal_service_1.fetchIssuesWithDetails)({ issueId });
    res.json(issues[0]);
};
exports.updateIssue = updateIssue;
const uploadIssuePdfs = async (req, res) => {
    const issueId = getParam(req.params.id);
    await (0, journal_service_1.ensureIssueExists)(issueId);
    const files = req.files;
    if (!files?.length) {
        throw new AppError_1.default('At least one PDF is required', 400);
    }
    const author = getOptionalString(req.body.author);
    const doi = getOptionalString(req.body.doi);
    const title = getOptionalString(req.body.title) || undefined;
    await (0, journal_service_1.saveIssuePdfs)(issueId, files, { title, author, doi });
    const issues = await (0, journal_service_1.fetchIssuesWithDetails)({ issueId });
    res.status(201).json(issues[0]);
};
exports.uploadIssuePdfs = uploadIssuePdfs;
const updateIssuePdf = async (req, res) => {
    const pdfId = getParam(req.params.pdfId);
    const existing = await (0, journal_service_1.ensurePdfExists)(pdfId);
    const title = req.body.title !== undefined
        ? getOptionalString(req.body.title) || existing.title
        : existing.title;
    const author = req.body.author !== undefined ? getOptionalString(req.body.author) : existing.author;
    const doi = req.body.doi !== undefined ? getOptionalString(req.body.doi) : existing.doi;
    let pdfUrl = existing.pdf_url;
    if (req.file) {
        pdfUrl = await (0, upload_service_1.uploadIssuePdfToS3)(req.file);
    }
    await db_1.default.query(`UPDATE issue_pdfs
     SET title = $1, author = $2, doi = $3, pdf_url = $4
     WHERE _id = $5`, [title, author, doi, pdfUrl, pdfId]);
    const pdf = await (0, journal_service_1.fetchPdfById)(pdfId);
    res.json(pdf);
};
exports.updateIssuePdf = updateIssuePdf;
const deleteIssuePdf = async (req, res) => {
    const pdfId = getParam(req.params.pdfId);
    const result = await db_1.default.query('DELETE FROM issue_pdfs WHERE _id = $1 RETURNING _id', [pdfId]);
    if (result.rows.length === 0) {
        throw new AppError_1.default('PDF not found', 404);
    }
    res.json({ message: 'PDF deleted successfully' });
};
exports.deleteIssuePdf = deleteIssuePdf;
const deleteIssue = async (req, res) => {
    const issueId = getParam(req.params.id);
    const result = await db_1.default.query('DELETE FROM journal_issues WHERE _id = $1 RETURNING _id', [issueId]);
    if (result.rows.length === 0) {
        throw new AppError_1.default('Issue not found', 404);
    }
    res.json({ message: 'Issue deleted successfully' });
};
exports.deleteIssue = deleteIssue;
