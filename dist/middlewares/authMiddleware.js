"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const JWT_1 = require("../utils/JWT");
const AppError_1 = __importDefault(require("../utils/AppError"));
const protect = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next(new AppError_1.default('Unauthorized', 401));
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = (0, JWT_1.verifyToken)(token);
        req.user = { userId: decoded.userId, role: decoded.role };
        next();
    }
    catch {
        next(new AppError_1.default('Invalid token', 401));
    }
};
exports.protect = protect;
const authorize = (...roles) => {
    return (req, _res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError_1.default('Forbidden: insufficient rights', 403));
        }
        next();
    };
};
exports.authorize = authorize;
