import express from 'express';
import {
  createPaperSubmission,
  getAllPaperSubmissions,
  getPaperSubmissionById,
  updatePaperSubmission,
  deletePaperSubmission,
} from '../controllers/paperSubmission.controller';
import { catchAsync } from '../utils/catchAsync';
import { protect, authorize } from '../middlewares/authMiddleware';
import { uploadPaper } from '../middlewares/uploadMiddleware';

const router = express.Router();

router.post(
  '/',
  uploadPaper.single('paper'),
  catchAsync(createPaperSubmission)
);

router.use(catchAsync(protect));
router.get('/', catchAsync(authorize('admin')), catchAsync(getAllPaperSubmissions));
router.get('/:id', catchAsync(authorize('admin')), catchAsync(getPaperSubmissionById));
router.put(
  '/:id',
  uploadPaper.single('paper'),
  catchAsync(authorize('admin')),
  catchAsync(updatePaperSubmission)
);
router.delete('/:id', catchAsync(authorize('admin')), catchAsync(deletePaperSubmission));

export default router;
