"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const journal_controller_1 = require("../controllers/journal.controller");
const catchAsync_1 = require("../utils/catchAsync");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware");
const router = express_1.default.Router();
// Public routes (no JWT)
router.get('/', (0, catchAsync_1.catchAsync)(journal_controller_1.getAllJournals));
router.get('/:id', (0, catchAsync_1.catchAsync)(journal_controller_1.getJournalById));
// Admin routes
router.post('/', (0, catchAsync_1.catchAsync)(authMiddleware_1.protect), (0, catchAsync_1.catchAsync)((0, authMiddleware_1.authorize)('admin')), uploadMiddleware_1.uploadJournalImage.single('image'), (0, catchAsync_1.catchAsync)(journal_controller_1.createJournal));
router.put('/:id', (0, catchAsync_1.catchAsync)(authMiddleware_1.protect), (0, catchAsync_1.catchAsync)((0, authMiddleware_1.authorize)('admin')), uploadMiddleware_1.uploadJournalImage.single('image'), (0, catchAsync_1.catchAsync)(journal_controller_1.updateJournal));
router.delete('/:id', (0, catchAsync_1.catchAsync)(authMiddleware_1.protect), (0, catchAsync_1.catchAsync)((0, authMiddleware_1.authorize)('admin')), (0, catchAsync_1.catchAsync)(journal_controller_1.deleteJournal));
exports.default = router;
