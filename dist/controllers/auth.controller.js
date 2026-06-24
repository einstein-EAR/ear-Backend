"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../components/db"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const JWT_1 = require("../utils/JWT");
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
