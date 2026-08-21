"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const host = process.env.DB_HOST || '';
const useSsl = process.env.DB_SSL === 'true' ||
    host.includes('neon.tech') ||
    (host !== '' && host !== 'localhost' && host !== '127.0.0.1');
const pool = new pg_1.Pool({
    host,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});
exports.default = pool;
