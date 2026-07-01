import express from 'express';
import {
  getAllJournals,
  getJournalById,
  createJournal,
  updateJournal,
  deleteJournal,
} from '../controllers/journal.controller';
import { catchAsync } from '../utils/catchAsync';
import { protect, authorize } from '../middlewares/authMiddleware';
import { uploadJournalImage } from '../middlewares/uploadMiddleware';

const router = express.Router();

// Public routes (no JWT)
router.get('/', catchAsync(getAllJournals));
router.get('/:id', catchAsync(getJournalById));

// Admin routes
router.post(
  '/',
  catchAsync(protect),
  catchAsync(authorize('admin')),
  uploadJournalImage.single('image'),
  catchAsync(createJournal)
);

router.put(
  '/:id',
  catchAsync(protect),
  catchAsync(authorize('admin')),
  uploadJournalImage.single('image'),
  catchAsync(updateJournal)
);

router.delete(
  '/:id',
  catchAsync(protect),
  catchAsync(authorize('admin')),
  catchAsync(deleteJournal)
);

export default router;
