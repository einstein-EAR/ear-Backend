"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveIssuePdfs = exports.ensurePdfExists = exports.ensureIssueExists = exports.ensureJournalExists = exports.searchPdfs = exports.fetchPdfById = exports.fetchIssuesWithDetails = exports.fetchJournals = exports.formatIssue = exports.formatPdf = void 0;
const db_1 = __importDefault(require("../components/db"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const upload_service_1 = require("../services/upload.service");
const formatPdf = async (pdf) => ({
    _id: pdf._id,
    title: pdf.title,
    author: pdf.author,
    doi: pdf.doi,
    pdfUrl: await (0, upload_service_1.getPresignedUrl)(pdf.pdf_url),
    created_at: pdf.created_at,
});
exports.formatPdf = formatPdf;
const formatIssue = async (issue, journal, pdfs) => ({
    _id: issue._id,
    journalId: issue.journal_id,
    issueLabel: issue.issue_label,
    title: journal.title,
    description: issue.description,
    pdfs: await Promise.all(pdfs.filter((pdf) => pdf.issue_id === issue._id).map(exports.formatPdf)),
    created_at: issue.created_at,
    updated_at: issue.updated_at,
});
exports.formatIssue = formatIssue;
const formatJournal = async (journal) => ({
    _id: journal._id,
    title: journal.title,
    description: journal.description,
    serialNumber: journal.serial_number,
    imageUrl: await (0, upload_service_1.getPresignedUrl)(journal.image_url),
    created_at: journal.created_at,
    updated_at: journal.updated_at,
});
const fetchJournals = async (journalFilter) => {
    let journalQuery = 'SELECT * FROM journals';
    const params = [];
    if (journalFilter?.id) {
        journalQuery += ' WHERE _id = $1';
        params.push(journalFilter.id);
    }
    journalQuery += ' ORDER BY serial_number ASC';
    const journalsResult = await db_1.default.query(journalQuery, params);
    return Promise.all(journalsResult.rows.map((journal) => formatJournal(journal)));
};
exports.fetchJournals = fetchJournals;
const fetchIssuesWithDetails = async (filter) => {
    let issueQuery = `
    SELECT ji.*, j.title AS journal_title
    FROM journal_issues ji
    JOIN journals j ON j._id = ji.journal_id
  `;
    const params = [];
    if (filter?.issueId) {
        issueQuery += ' WHERE ji._id = $1';
        params.push(filter.issueId);
    }
    else if (filter?.journalId) {
        issueQuery += ' WHERE ji.journal_id = $1';
        params.push(filter.journalId);
    }
    issueQuery += ' ORDER BY ji.created_at DESC';
    const issuesResult = await db_1.default.query(issueQuery, params);
    const rows = issuesResult.rows;
    if (rows.length === 0) {
        return [];
    }
    const issues = rows.map((row) => ({
        _id: row._id,
        journal_id: row.journal_id,
        issue_label: row.issue_label,
        description: row.description,
        created_at: row.created_at,
        updated_at: row.updated_at,
    }));
    const journals = rows.map((row) => ({
        _id: row.journal_id,
        title: row.journal_title,
        description: '',
        serial_number: '',
        image_url: '',
        created_at: row.created_at,
        updated_at: row.updated_at,
    }));
    const issueIds = issues.map((issue) => issue._id);
    const pdfsResult = await db_1.default.query('SELECT * FROM issue_pdfs WHERE issue_id = ANY($1) ORDER BY created_at ASC', [issueIds]);
    const pdfs = pdfsResult.rows;
    return Promise.all(issues.map((issue, index) => (0, exports.formatIssue)(issue, journals[index], pdfs)));
};
exports.fetchIssuesWithDetails = fetchIssuesWithDetails;
const fetchPdfById = async (pdfId) => {
    const result = await db_1.default.query('SELECT * FROM issue_pdfs WHERE _id = $1', [pdfId]);
    if (result.rows.length === 0) {
        throw new AppError_1.default('PDF not found', 404);
    }
    return (0, exports.formatPdf)(result.rows[0]);
};
exports.fetchPdfById = fetchPdfById;
const searchPdfs = async (filters) => {
    const title = filters.title?.trim();
    const author = filters.author?.trim();
    if (!title && !author) {
        throw new AppError_1.default('At least one of title or author is required', 400);
    }
    const conditions = [];
    const params = [];
    if (title) {
        params.push(`%${title}%`);
        conditions.push(`p.title ILIKE $${params.length}`);
    }
    if (author) {
        params.push(`%${author}%`);
        conditions.push(`p.author ILIKE $${params.length}`);
    }
    const result = await db_1.default.query(`SELECT p.*, ji.issue_label, ji.journal_id, j.title AS journal_title
     FROM issue_pdfs p
     JOIN journal_issues ji ON ji._id = p.issue_id
     JOIN journals j ON j._id = ji.journal_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY p.created_at DESC`, params);
    return Promise.all(result.rows.map(async (pdf) => ({
        ...(await (0, exports.formatPdf)(pdf)),
        issueId: pdf.issue_id,
        issueLabel: pdf.issue_label,
        journalId: pdf.journal_id,
        journalTitle: pdf.journal_title,
    })));
};
exports.searchPdfs = searchPdfs;
const ensureJournalExists = async (journalId) => {
    const result = await db_1.default.query('SELECT _id FROM journals WHERE _id = $1', [journalId]);
    if (result.rows.length === 0) {
        throw new AppError_1.default('Journal not found', 404);
    }
};
exports.ensureJournalExists = ensureJournalExists;
const ensureIssueExists = async (issueId) => {
    const result = await db_1.default.query('SELECT * FROM journal_issues WHERE _id = $1', [issueId]);
    if (result.rows.length === 0) {
        throw new AppError_1.default('Issue not found', 404);
    }
    return result.rows[0];
};
exports.ensureIssueExists = ensureIssueExists;
const ensurePdfExists = async (pdfId) => {
    const result = await db_1.default.query('SELECT * FROM issue_pdfs WHERE _id = $1', [pdfId]);
    if (result.rows.length === 0) {
        throw new AppError_1.default('PDF not found', 404);
    }
    return result.rows[0];
};
exports.ensurePdfExists = ensurePdfExists;
const saveIssuePdfs = async (issueId, files, meta) => {
    const savedPdfs = [];
    for (const file of files) {
        const pdfKey = await (0, upload_service_1.uploadIssuePdfToS3)(file);
        const title = meta.title?.trim() || file.originalname;
        const result = await db_1.default.query(`INSERT INTO issue_pdfs (issue_id, title, author, doi, pdf_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`, [issueId, title, meta.author, meta.doi, pdfKey]);
        savedPdfs.push(result.rows[0]);
    }
    return savedPdfs;
};
exports.saveIssuePdfs = saveIssuePdfs;
