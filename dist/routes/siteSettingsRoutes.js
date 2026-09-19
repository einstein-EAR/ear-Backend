"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const siteSettings_controller_1 = require("../controllers/siteSettings.controller");
const catchAsync_1 = require("../utils/catchAsync");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware");
const router = express_1.default.Router();
// Public
router.get('/', (0, catchAsync_1.catchAsync)(siteSettings_controller_1.getSiteSettings));
// Admin
router.put('/', (0, catchAsync_1.catchAsync)(authMiddleware_1.protect), (0, catchAsync_1.catchAsync)((0, authMiddleware_1.authorize)('admin')), uploadMiddleware_1.uploadSiteSettingsImages.fields([
    { name: 'favIcon', maxCount: 1 },
    { name: 'iconImage', maxCount: 1 },
]), (0, catchAsync_1.catchAsync)(siteSettings_controller_1.updateSiteSettings));
exports.default = router;
