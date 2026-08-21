"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const catchAsync_1 = require("../utils/catchAsync");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
router.post('/register', (0, catchAsync_1.catchAsync)(auth_controller_1.register));
router.post('/login', (0, catchAsync_1.catchAsync)(auth_controller_1.login));
router.put('/credentials', (0, catchAsync_1.catchAsync)(authMiddleware_1.protect), (0, catchAsync_1.catchAsync)((0, authMiddleware_1.authorize)('admin')), (0, catchAsync_1.catchAsync)(auth_controller_1.updateCredentials));
exports.default = router;
