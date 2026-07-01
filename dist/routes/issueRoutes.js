"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const issue_controller_1 = require("../controllers/issue.controller");
const catchAsync_1 = require("../utils/catchAsync");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware");
const router = express_1.default.Router();
// Public routes (no JWT)
router.get('/', (0, catchAsync_1.catchAsync)(issue_controller_1.getAllIssues));
router.get('/journal/:journalId', (0, catchAsync_1.catchAsync)(issue_controller_1.getIssuesByJournal));
router.get('/:id', (0, catchAsync_1.catchAsync)(issue_controller_1.getIssueById));
// Admin routes
router.post('/', (0, catchAsync_1.catchAsync)(authMiddleware_1.protect), (0, catchAsync_1.catchAsync)((0, authMiddleware_1.authorize)('admin')), (0, catchAsync_1.catchAsync)(issue_controller_1.createIssue));
router.put('/:id', (0, catchAsync_1.catchAsync)(authMiddleware_1.protect), (0, catchAsync_1.catchAsync)((0, authMiddleware_1.authorize)('admin')), (0, catchAsync_1.catchAsync)(issue_controller_1.updateIssue));
router.post('/:id/pdfs', (0, catchAsync_1.catchAsync)(authMiddleware_1.protect), (0, catchAsync_1.catchAsync)((0, authMiddleware_1.authorize)('admin')), uploadMiddleware_1.uploadIssuePdfs.array('pdfs', 20), (0, catchAsync_1.catchAsync)(issue_controller_1.uploadIssuePdfs));
router.delete('/:id', (0, catchAsync_1.catchAsync)(authMiddleware_1.protect), (0, catchAsync_1.catchAsync)((0, authMiddleware_1.authorize)('admin')), (0, catchAsync_1.catchAsync)(issue_controller_1.deleteIssue));
exports.default = router;
