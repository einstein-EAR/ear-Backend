"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = void 0;
const db_1 = __importDefault(require("../components/db"));
const getAllUsers = async (_req, res) => {
    const result = await db_1.default.query('SELECT * FROM users ORDER BY id');
    res.json(result.rows);
};
exports.getAllUsers = getAllUsers;
