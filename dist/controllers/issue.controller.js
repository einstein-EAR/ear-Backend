"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteIssue = exports.uploadIssuePdfs = exports.updateIssue = exports.createIssue = exports.getIssueById = exports.getIssuesByJournal = exports.getAllIssues = void 0;
const db_1 = __importDefault(require("../components/db"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const journal_service_1 = require("../services/journal.service");
const getParam = (value) => Array.isArray(value) ? value[0] : value;
const getAllIssues = async (_req, res) => {
    const issues = await (0, journal_service_1.fetchIssuesWithDetails)();
    res.json(issues);
};
exports.getAllIssues = getAllIssues;
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
    const issueLabel = typeof req.body.issueLabel === 'string' ? req.body.issueLabel.trim() : '';
    if (!journalId || !issueLabel) {
        throw new AppError_1.default('journalId and issueLabel are required', 400);
    }
    await (0, journal_service_1.ensureJournalExists)(journalId);
    const issueResult = await db_1.default.query(`INSERT INTO journal_issues (journal_id, issue_label)
     VALUES ($1, $2)
     RETURNING *`, [journalId, issueLabel]);
    const issues = await (0, journal_service_1.fetchIssuesWithDetails)({ issueId: issueResult.rows[0]._id });
    res.status(201).json(issues[0]);
};
exports.createIssue = createIssue;
const updateIssue = async (req, res) => {
    const issueId = getParam(req.params.id);
    await (0, journal_service_1.ensureIssueExists)(issueId);
    const issueLabel = typeof req.body.issueLabel === 'string' ? req.body.issueLabel.trim() : '';
    if (!issueLabel) {
        throw new AppError_1.default('issueLabel is required', 400);
    }
    await db_1.default.query(`UPDATE journal_issues
     SET issue_label = $1, updated_at = NOW()
     WHERE _id = $2`, [issueLabel, issueId]);
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
    await (0, journal_service_1.saveIssuePdfs)(issueId, files);
    const issues = await (0, journal_service_1.fetchIssuesWithDetails)({ issueId });
    res.json(issues[0]);
};
exports.uploadIssuePdfs = uploadIssuePdfs;
const deleteIssue = async (req, res) => {
    const issueId = getParam(req.params.id);
    const result = await db_1.default.query('DELETE FROM journal_issues WHERE _id = $1 RETURNING _id', [issueId]);
    if (result.rows.length === 0) {
        throw new AppError_1.default('Issue not found', 404);
    }
    res.json({ message: 'Issue deleted successfully' });
};
exports.deleteIssue = deleteIssue;
