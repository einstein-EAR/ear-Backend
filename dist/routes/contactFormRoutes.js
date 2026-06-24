"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const contactForm_controller_1 = require("../controllers/contactForm.controller");
const catchAsync_1 = require("../utils/catchAsync");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
router.post('/', (0, catchAsync_1.catchAsync)(contactForm_controller_1.createContactForm));
router.use((0, catchAsync_1.catchAsync)(authMiddleware_1.protect));
router.get('/', (0, catchAsync_1.catchAsync)((0, authMiddleware_1.authorize)('admin')), (0, catchAsync_1.catchAsync)(contactForm_controller_1.getAllContactForms));
router.get('/:id', (0, catchAsync_1.catchAsync)((0, authMiddleware_1.authorize)('admin')), (0, catchAsync_1.catchAsync)(contactForm_controller_1.getContactFormById));
router.put('/:id', (0, catchAsync_1.catchAsync)((0, authMiddleware_1.authorize)('admin')), (0, catchAsync_1.catchAsync)(contactForm_controller_1.updateContactForm));
router.delete('/:id', (0, catchAsync_1.catchAsync)((0, authMiddleware_1.authorize)('admin')), (0, catchAsync_1.catchAsync)(contactForm_controller_1.deleteContactForm));
exports.default = router;
