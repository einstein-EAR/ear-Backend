import express from 'express';
import {
  getAllIssues,
  getIssuesByJournal,
  getIssueById,
  searchPdfs,
  createIssue,
  updateIssue,
  uploadIssuePdfs,
  updateIssuePdf,
  deleteIssuePdf,
  deleteIssue,
} from '../controllers/issue.controller';
import { catchAsync } from '../utils/catchAsync';
import { protect, authorize } from '../middlewares/authMiddleware';
import { uploadIssuePdfs as uploadIssuePdfsMiddleware } from '../middlewares/uploadMiddleware';

const router = express.Router();

// Public routes (no JWT)
router.get('/', catchAsync(getAllIssues));
router.get('/journal/:journalId', catchAsync(getIssuesByJournal));
router.get('/pdfs/search', catchAsync(searchPdfs));
router.get('/:id', catchAsync(getIssueById));

// Admin routes
router.post(
  '/',
  catchAsync(protect),
  catchAsync(authorize('admin')),
  catchAsync(createIssue)
);

router.put(
  '/:id',
  catchAsync(protect),
  catchAsync(authorize('admin')),
  catchAsync(updateIssue)
);

router.post(
  '/:id/pdfs',
  catchAsync(protect),
  catchAsync(authorize('admin')),
  uploadIssuePdfsMiddleware.array('pdfs', 20),
  catchAsync(uploadIssuePdfs)
);

router.put(
  '/pdfs/:pdfId',
  catchAsync(protect),
  catchAsync(authorize('admin')),
  uploadIssuePdfsMiddleware.single('pdf'),
  catchAsync(updateIssuePdf)
);

router.delete(
  '/pdfs/:pdfId',
  catchAsync(protect),
  catchAsync(authorize('admin')),
  catchAsync(deleteIssuePdf)
);

router.delete(
  '/:id',
  catchAsync(protect),
  catchAsync(authorize('admin')),
  catchAsync(deleteIssue)
);

export default router;
