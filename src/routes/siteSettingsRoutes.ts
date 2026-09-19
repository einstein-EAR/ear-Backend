import express from 'express';
import {
  getSiteSettings,
  updateSiteSettings,
} from '../controllers/siteSettings.controller';
import { catchAsync } from '../utils/catchAsync';
import { protect, authorize } from '../middlewares/authMiddleware';
import { uploadSiteSettingsImages } from '../middlewares/uploadMiddleware';

const router = express.Router();

// Public
router.get('/', catchAsync(getSiteSettings));

// Admin
router.put(
  '/',
  catchAsync(protect),
  catchAsync(authorize('admin')),
  uploadSiteSettingsImages.fields([
    { name: 'favIcon', maxCount: 1 },
    { name: 'iconImage', maxCount: 1 },
  ]),
  catchAsync(updateSiteSettings)
);

export default router;
