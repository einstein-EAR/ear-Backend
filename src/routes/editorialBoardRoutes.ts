import express from 'express';
import {
  getEditorialBoard,
  getEditorialBoardCategories,
  getEditorialBoardCategoryById,
  createEditorialBoardCategory,
  updateEditorialBoardCategory,
  deleteEditorialBoardCategory,
  createEditorialBoardMember,
  updateEditorialBoardMember,
  deleteEditorialBoardMember,
} from '../controllers/editorialBoard.controller';
import { catchAsync } from '../utils/catchAsync';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', catchAsync(getEditorialBoard));
router.get('/categories', catchAsync(getEditorialBoardCategories));
router.get('/categories/:categoryId', catchAsync(getEditorialBoardCategoryById));

router.post(
  '/categories',
  catchAsync(protect),
  catchAsync(authorize('admin')),
  catchAsync(createEditorialBoardCategory)
);

router.put(
  '/categories/:categoryId',
  catchAsync(protect),
  catchAsync(authorize('admin')),
  catchAsync(updateEditorialBoardCategory)
);

router.delete(
  '/categories/:categoryId',
  catchAsync(protect),
  catchAsync(authorize('admin')),
  catchAsync(deleteEditorialBoardCategory)
);

router.post(
  '/categories/:categoryId/members',
  catchAsync(protect),
  catchAsync(authorize('admin')),
  catchAsync(createEditorialBoardMember)
);

router.put(
  '/members/:memberId',
  catchAsync(protect),
  catchAsync(authorize('admin')),
  catchAsync(updateEditorialBoardMember)
);

router.delete(
  '/members/:memberId',
  catchAsync(protect),
  catchAsync(authorize('admin')),
  catchAsync(deleteEditorialBoardMember)
);

export default router;
