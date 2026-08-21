"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCredentials = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../components/db"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const JWT_1 = require("../utils/JWT");
const getOptionalString = (value) => typeof value === 'string' ? value.trim() : '';
const register = async (req, res) => {
    const { name, email, password, role = 'user' } = req.body;
    if (!name || !email || !password) {
        throw new AppError_1.default('Name, email and password are required', 400);
    }
    const existing = await db_1.default.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
        throw new AppError_1.default('Email already exists', 400);
    }
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const result = await db_1.default.query(`INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role`, [name, email, hashedPassword, role]);
    const user = result.rows[0];
    const token = (0, JWT_1.generateAccessToken)(String(user.id), user.role);
    res.status(200).json({ user, token });
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new AppError_1.default('Email and password are required', 400);
    }
    const result = await db_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user?.password) {
        throw new AppError_1.default('Invalid credentials', 400);
    }
    const isMatch = await bcrypt_1.default.compare(password, user.password);
    if (!isMatch) {
        throw new AppError_1.default('Invalid credentials', 400);
    }
    const token = (0, JWT_1.generateAccessToken)(String(user.id), user.role);
    res.json({
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
        token,
    });
};
exports.login = login;
const updateCredentials = async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new AppError_1.default('Unauthorized', 401);
    }
    const name = getOptionalString(req.body.name);
    const email = getOptionalString(req.body.email);
    const password = getOptionalString(req.body.password);
    const currentPassword = getOptionalString(req.body.currentPassword);
    if (!name && !email && !password) {
        throw new AppError_1.default('At least one of name, email or password is required', 400);
    }
    const existingResult = await db_1.default.query('SELECT * FROM users WHERE id = $1', [userId]);
    const existing = existingResult.rows[0];
    if (!existing) {
        throw new AppError_1.default('User not found', 404);
    }
    if (password) {
        if (!currentPassword) {
            throw new AppError_1.default('currentPassword is required to update password', 400);
        }
        const isMatch = await bcrypt_1.default.compare(currentPassword, existing.password);
        if (!isMatch) {
            throw new AppError_1.default('Current password is incorrect', 400);
        }
    }
    if (email && email !== existing.email) {
        const emailTaken = await db_1.default.query('SELECT id FROM users WHERE email = $1 AND id <> $2', [email, userId]);
        if (emailTaken.rows.length > 0) {
            throw new AppError_1.default('Email already exists', 400);
        }
    }
    const nextName = name || existing.name;
    const nextEmail = email || existing.email;
    const nextPassword = password
        ? await bcrypt_1.default.hash(password, 10)
        : existing.password;
    const result = await db_1.default.query(`UPDATE users
     SET name = $1, email = $2, password = $3
     WHERE id = $4
     RETURNING id, name, email, role`, [nextName, nextEmail, nextPassword, userId]);
    const user = result.rows[0];
    const token = (0, JWT_1.generateAccessToken)(String(user.id), user.role);
    res.json({
        message: 'Credentials updated successfully',
        user,
        token,
    });
};
exports.updateCredentials = updateCredentials;
