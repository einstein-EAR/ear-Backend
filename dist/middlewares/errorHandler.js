"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFound = void 0;
const AppError_1 = __importDefault(require("../utils/AppError"));
const notFound = (req, res, next) => {
    next(new AppError_1.default(`Not Found - ${req.originalUrl}`, 404));
};
exports.notFound = notFound;
const errorHandler = (err, req, res, next) => {
    console.error(err);
    res.status(err.statusCode || 500).json({
        message: err.message || 'Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};
exports.errorHandler = errorHandler;
