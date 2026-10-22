"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEditorialBoardMember = exports.updateEditorialBoardMember = exports.createEditorialBoardMember = exports.deleteEditorialBoardCategory = exports.updateEditorialBoardCategory = exports.createEditorialBoardCategory = exports.getEditorialBoardCategoryById = exports.getEditorialBoardCategories = exports.getEditorialBoard = void 0;
const db_1 = __importDefault(require("../components/db"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const editorialBoard_service_1 = require("../services/editorialBoard.service");
const getParam = (value) => Array.isArray(value) ? value[0] : value;
const getOptionalString = (value, fallback = '') => typeof value === 'string' ? value.trim() : fallback;
const parseSortOrder = (value, fallback = 0) => {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw new AppError_1.default('sortOrder must be a number', 400);
    }
    return parsed;
};
const validateCategoryTitle = (body) => {
    const title = getOptionalString(body.title);
    if (!title) {
        throw new AppError_1.default('title is required', 400);
    }
    return {
        title,
        sortOrder: parseSortOrder(body.sortOrder),
    };
};
const validateMemberFields = (body) => {
    const name = getOptionalString(body.name);
    if (!name) {
        throw new AppError_1.default('name is required', 400);
    }
    const email = getOptionalString(body.email);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError_1.default('email is invalid', 400);
    }
    return {
        name,
        designation: getOptionalString(body.designation),
        affiliation: getOptionalString(body.affiliation),
        email,
        sortOrder: parseSortOrder(body.sortOrder),
    };
};
const getEditorialBoard = async (_req, res) => {
    const board = await (0, editorialBoard_service_1.fetchEditorialBoard)();
    res.json(board);
};
exports.getEditorialBoard = getEditorialBoard;
const getEditorialBoardCategories = async (_req, res) => {
    const categories = await (0, editorialBoard_service_1.fetchEditorialBoard)({ includeMembers: false });
    res.json(categories);
};
exports.getEditorialBoardCategories = getEditorialBoardCategories;
const getEditorialBoardCategoryById = async (req, res) => {
    const categoryId = getParam(req.params.categoryId);
    const categories = await (0, editorialBoard_service_1.fetchEditorialBoard)({ categoryId });
    if (categories.length === 0) {
        throw new AppError_1.default('Editorial board category not found', 404);
    }
    res.json(categories[0]);
};
exports.getEditorialBoardCategoryById = getEditorialBoardCategoryById;
const createEditorialBoardCategory = async (req, res) => {
    const data = validateCategoryTitle(req.body);
    const result = await db_1.default.query(`INSERT INTO editorial_board_categories (title, sort_order)
     VALUES ($1, $2)
     RETURNING *`, [data.title, data.sortOrder]);
    res.status(201).json((0, editorialBoard_service_1.formatCategory)(result.rows[0]));
};
exports.createEditorialBoardCategory = createEditorialBoardCategory;
const updateEditorialBoardCategory = async (req, res) => {
    const categoryId = getParam(req.params.categoryId);
    const existing = await (0, editorialBoard_service_1.ensureCategoryExists)(categoryId);
    const title = req.body.title !== undefined ? getOptionalString(req.body.title) : existing.title;
    if (!title) {
        throw new AppError_1.default('title cannot be empty', 400);
    }
    const sortOrder = req.body.sortOrder !== undefined
        ? parseSortOrder(req.body.sortOrder)
        : existing.sort_order;
    const result = await db_1.default.query(`UPDATE editorial_board_categories
     SET title = $1, sort_order = $2, updated_at = NOW()
     WHERE _id = $3
     RETURNING *`, [title, sortOrder, categoryId]);
    res.json((0, editorialBoard_service_1.formatCategory)(result.rows[0]));
};
exports.updateEditorialBoardCategory = updateEditorialBoardCategory;
const deleteEditorialBoardCategory = async (req, res) => {
    const categoryId = getParam(req.params.categoryId);
    const result = await db_1.default.query('DELETE FROM editorial_board_categories WHERE _id = $1 RETURNING _id', [categoryId]);
    if (result.rows.length === 0) {
        throw new AppError_1.default('Editorial board category not found', 404);
    }
    res.json({ message: 'Editorial board category deleted successfully' });
};
exports.deleteEditorialBoardCategory = deleteEditorialBoardCategory;
const createEditorialBoardMember = async (req, res) => {
    const categoryId = getParam(req.params.categoryId);
    await (0, editorialBoard_service_1.ensureCategoryExists)(categoryId);
    const data = validateMemberFields(req.body);
    const result = await db_1.default.query(`INSERT INTO editorial_board_members
       (category_id, name, designation, affiliation, email, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`, [
        categoryId,
        data.name,
        data.designation,
        data.affiliation,
        data.email,
        data.sortOrder,
    ]);
    res.status(201).json((0, editorialBoard_service_1.formatMember)(result.rows[0]));
};
exports.createEditorialBoardMember = createEditorialBoardMember;
const updateEditorialBoardMember = async (req, res) => {
    const memberId = getParam(req.params.memberId);
    const existing = await (0, editorialBoard_service_1.ensureMemberExists)(memberId);
    const name = req.body.name !== undefined ? getOptionalString(req.body.name) : existing.name;
    if (!name) {
        throw new AppError_1.default('name cannot be empty', 400);
    }
    const designation = req.body.designation !== undefined
        ? getOptionalString(req.body.designation)
        : existing.designation;
    const affiliation = req.body.affiliation !== undefined
        ? getOptionalString(req.body.affiliation)
        : existing.affiliation;
    const email = req.body.email !== undefined ? getOptionalString(req.body.email) : existing.email;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError_1.default('email is invalid', 400);
    }
    const sortOrder = req.body.sortOrder !== undefined
        ? parseSortOrder(req.body.sortOrder)
        : existing.sort_order;
    const categoryId = req.body.categoryId !== undefined
        ? getOptionalString(req.body.categoryId)
        : existing.category_id;
    if (categoryId !== existing.category_id) {
        await (0, editorialBoard_service_1.ensureCategoryExists)(categoryId);
    }
    const result = await db_1.default.query(`UPDATE editorial_board_members
     SET category_id = $1,
         name = $2,
         designation = $3,
         affiliation = $4,
         email = $5,
         sort_order = $6,
         updated_at = NOW()
     WHERE _id = $7
     RETURNING *`, [categoryId, name, designation, affiliation, email, sortOrder, memberId]);
    res.json((0, editorialBoard_service_1.formatMember)(result.rows[0]));
};
exports.updateEditorialBoardMember = updateEditorialBoardMember;
const deleteEditorialBoardMember = async (req, res) => {
    const memberId = getParam(req.params.memberId);
    const result = await db_1.default.query('DELETE FROM editorial_board_members WHERE _id = $1 RETURNING _id', [memberId]);
    if (result.rows.length === 0) {
        throw new AppError_1.default('Editorial board member not found', 404);
    }
    res.json({ message: 'Editorial board member deleted successfully' });
};
exports.deleteEditorialBoardMember = deleteEditorialBoardMember;
