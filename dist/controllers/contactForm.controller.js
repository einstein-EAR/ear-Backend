"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteContactForm = exports.updateContactForm = exports.getContactFormById = exports.getAllContactForms = exports.createContactForm = void 0;
const db_1 = __importDefault(require("../components/db"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const REQUIRED_FIELDS = ['name', 'email', 'phone', 'subject', 'country', 'message'];
const formatContactForm = (row) => ({
    _id: row._id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    country: row.country,
    message: row.message,
    created_at: row.created_at,
    updated_at: row.updated_at,
});
const validateContactForm = (body) => {
    for (const field of REQUIRED_FIELDS) {
        if (typeof body[field] !== 'string' || !body[field].trim()) {
            throw new AppError_1.default(`${field} is required`, 400);
        }
    }
    return {
        name: body.name.trim(),
        email: body.email.trim(),
        phone: body.phone.trim(),
        subject: body.subject.trim(),
        country: body.country.trim(),
        message: body.message.trim(),
    };
};
const createContactForm = async (req, res) => {
    const data = validateContactForm(req.body);
    const result = await db_1.default.query(`INSERT INTO contact_forms (name, email, phone, subject, country, message)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`, [data.name, data.email, data.phone, data.subject, data.country, data.message]);
    res.status(201).json(formatContactForm(result.rows[0]));
};
exports.createContactForm = createContactForm;
const getAllContactForms = async (_req, res) => {
    const result = await db_1.default.query('SELECT * FROM contact_forms ORDER BY created_at DESC');
    res.json(result.rows.map(formatContactForm));
};
exports.getAllContactForms = getAllContactForms;
const getContactFormById = async (req, res) => {
    const result = await db_1.default.query('SELECT * FROM contact_forms WHERE _id = $1', [req.params.id]);
    if (result.rows.length === 0) {
        throw new AppError_1.default('Contact form not found', 404);
    }
    res.json(formatContactForm(result.rows[0]));
};
exports.getContactFormById = getContactFormById;
const updateContactForm = async (req, res) => {
    const data = validateContactForm(req.body);
    const result = await db_1.default.query(`UPDATE contact_forms
     SET name = $1, email = $2, phone = $3, subject = $4, country = $5, message = $6, updated_at = NOW()
     WHERE _id = $7
     RETURNING *`, [data.name, data.email, data.phone, data.subject, data.country, data.message, req.params.id]);
    if (result.rows.length === 0) {
        throw new AppError_1.default('Contact form not found', 404);
    }
    res.json(formatContactForm(result.rows[0]));
};
exports.updateContactForm = updateContactForm;
const deleteContactForm = async (req, res) => {
    const result = await db_1.default.query('DELETE FROM contact_forms WHERE _id = $1 RETURNING _id', [req.params.id]);
    if (result.rows.length === 0) {
        throw new AppError_1.default('Contact form not found', 404);
    }
    res.json({ message: 'Contact form deleted successfully' });
};
exports.deleteContactForm = deleteContactForm;
