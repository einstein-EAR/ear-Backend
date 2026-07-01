"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteJournal = exports.updateJournal = exports.createJournal = exports.getJournalById = exports.getAllJournals = void 0;
const db_1 = __importDefault(require("../components/db"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const upload_service_1 = require("../services/upload.service");
const journal_service_1 = require("../services/journal.service");
const getParam = (value) => Array.isArray(value) ? value[0] : value;
const validateJournalFields = (body) => {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const serialNumber = typeof body.serialNumber === 'string' ? body.serialNumber.trim() : '';
    if (!title || !description || !serialNumber) {
        throw new AppError_1.default('title, description and serialNumber are required', 400);
    }
    return { title, description, serialNumber };
};
const getAllJournals = async (_req, res) => {
    const journals = await (0, journal_service_1.fetchJournals)();
    res.json(journals);
};
exports.getAllJournals = getAllJournals;
const getJournalById = async (req, res) => {
    const journals = await (0, journal_service_1.fetchJournals)({ id: getParam(req.params.id) });
    if (journals.length === 0) {
        throw new AppError_1.default('Journal not found', 404);
    }
    res.json(journals[0]);
};
exports.getJournalById = getJournalById;
const createJournal = async (req, res) => {
    if (!req.file) {
        throw new AppError_1.default('Journal image is required', 400);
    }
    const data = validateJournalFields(req.body);
    const imageKey = await (0, upload_service_1.uploadJournalImageToS3)(req.file);
    const result = await db_1.default.query(`INSERT INTO journals (title, description, serial_number, image_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`, [data.title, data.description, data.serialNumber, imageKey]);
    const journals = await (0, journal_service_1.fetchJournals)({ id: result.rows[0]._id });
    res.status(201).json(journals[0]);
};
exports.createJournal = createJournal;
const updateJournal = async (req, res) => {
    const journalId = getParam(req.params.id);
    const existing = await db_1.default.query('SELECT * FROM journals WHERE _id = $1', [journalId]);
    if (existing.rows.length === 0) {
        throw new AppError_1.default('Journal not found', 404);
    }
    const data = validateJournalFields(req.body);
    let imageKey = existing.rows[0].image_url;
    if (req.file) {
        imageKey = await (0, upload_service_1.uploadJournalImageToS3)(req.file);
    }
    await db_1.default.query(`UPDATE journals
     SET title = $1, description = $2, serial_number = $3,
         image_url = $4, updated_at = NOW()
     WHERE _id = $5`, [data.title, data.description, data.serialNumber, imageKey, journalId]);
    const journals = await (0, journal_service_1.fetchJournals)({ id: journalId });
    res.json(journals[0]);
};
exports.updateJournal = updateJournal;
const deleteJournal = async (req, res) => {
    const journalId = getParam(req.params.id);
    const result = await db_1.default.query('DELETE FROM journals WHERE _id = $1 RETURNING _id', [
        journalId,
    ]);
    if (result.rows.length === 0) {
        throw new AppError_1.default('Journal not found', 404);
    }
    res.json({ message: 'Journal deleted successfully' });
};
exports.deleteJournal = deleteJournal;
