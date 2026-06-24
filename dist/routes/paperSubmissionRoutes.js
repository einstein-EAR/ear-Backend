"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paperSubmission_controller_1 = require("../controllers/paperSubmission.controller");
const catchAsync_1 = require("../utils/catchAsync");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware");
const router = express_1.default.Router();
router.post('/', uploadMiddleware_1.uploadPaper.single('paper'), (0, catchAsync_1.catchAsync)(paperSubmission_controller_1.createPaperSubmission));
router.use((0, catchAsync_1.catchAsync)(authMiddleware_1.protect));
router.get('/', (0, catchAsync_1.catchAsync)((0, authMiddleware_1.authorize)('admin')), (0, catchAsync_1.catchAsync)(paperSubmission_controller_1.getAllPaperSubmissions));
router.get('/:id', (0, catchAsync_1.catchAsync)((0, authMiddleware_1.authorize)('admin')), (0, catchAsync_1.catchAsync)(paperSubmission_controller_1.getPaperSubmissionById));
router.put('/:id', uploadMiddleware_1.uploadPaper.single('paper'), (0, catchAsync_1.catchAsync)((0, authMiddleware_1.authorize)('admin')), (0, catchAsync_1.catchAsync)(paperSubmission_controller_1.updatePaperSubmission));
router.delete('/:id', (0, catchAsync_1.catchAsync)((0, authMiddleware_1.authorize)('admin')), (0, catchAsync_1.catchAsync)(paperSubmission_controller_1.deletePaperSubmission));
exports.default = router;
