"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureMemberExists = exports.ensureCategoryExists = exports.fetchEditorialBoard = exports.formatCategory = exports.formatMember = void 0;
const db_1 = __importDefault(require("../components/db"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const formatMember = (member) => ({
    _id: member._id,
    categoryId: member.category_id,
    name: member.name,
    designation: member.designation,
    affiliation: member.affiliation,
    email: member.email,
    sortOrder: member.sort_order,
    created_at: member.created_at,
    updated_at: member.updated_at,
});
exports.formatMember = formatMember;
const formatCategory = (category, members = []) => ({
    _id: category._id,
    title: category.title,
    sortOrder: category.sort_order,
    members: members.map(exports.formatMember),
    created_at: category.created_at,
    updated_at: category.updated_at,
});
exports.formatCategory = formatCategory;
const fetchEditorialBoard = async (options) => {
    const includeMembers = options?.includeMembers !== false;
    let categoryQuery = 'SELECT * FROM editorial_board_categories';
    const categoryParams = [];
    if (options?.categoryId) {
        categoryQuery += ' WHERE _id = $1';
        categoryParams.push(options.categoryId);
    }
    categoryQuery += ' ORDER BY sort_order ASC, created_at ASC';
    const categoriesResult = await db_1.default.query(categoryQuery, categoryParams);
    const categories = categoriesResult.rows;
    if (categories.length === 0) {
        return [];
    }
    if (!includeMembers) {
        return categories.map((category) => (0, exports.formatCategory)(category));
    }
    const categoryIds = categories.map((category) => category._id);
    const membersResult = await db_1.default.query(`SELECT * FROM editorial_board_members
     WHERE category_id = ANY($1)
     ORDER BY sort_order ASC, created_at ASC`, [categoryIds]);
    const members = membersResult.rows;
    return categories.map((category) => (0, exports.formatCategory)(category, members.filter((member) => member.category_id === category._id)));
};
exports.fetchEditorialBoard = fetchEditorialBoard;
const ensureCategoryExists = async (categoryId) => {
    const result = await db_1.default.query('SELECT * FROM editorial_board_categories WHERE _id = $1', [categoryId]);
    if (result.rows.length === 0) {
        throw new AppError_1.default('Editorial board category not found', 404);
    }
    return result.rows[0];
};
exports.ensureCategoryExists = ensureCategoryExists;
const ensureMemberExists = async (memberId) => {
    const result = await db_1.default.query('SELECT * FROM editorial_board_members WHERE _id = $1', [memberId]);
    if (result.rows.length === 0) {
        throw new AppError_1.default('Editorial board member not found', 404);
    }
    return result.rows[0];
};
exports.ensureMemberExists = ensureMemberExists;
