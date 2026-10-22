import express from 'express';
import {
  getAllLatestNews,
  getLatestNewsById,
  createLatestNews,
  updateLatestNews,
  deleteLatestNews,
} from '../controllers/latestNews.controller';
import { catchAsync } from '../utils/catchAsync';
import { protect, authorize } from '../middlewares/authMiddleware';
import { uploadJournalImage } from '../middlewares/uploadMiddleware';

const router = express.Router();

router.get('/', catchAsync(getAllLatestNews));
router.get('/:id', catchAsync(getLatestNewsById));

router.post(
  '/',
  catchAsync(protect),
  catchAsync(authorize('admin')),
  uploadJournalImage.single('image'),
  catchAsync(createLatestNews)
);

router.put(
  '/:id',
  catchAsync(protect),
  catchAsync(authorize('admin')),
  uploadJournalImage.single('image'),
  catchAsync(updateLatestNews)
);

router.delete(
  '/:id',
  catchAsync(protect),
  catchAsync(authorize('admin')),
  catchAsync(deleteLatestNews)
);

export default router;
