import express from 'express';
import { login, register, updateCredentials } from '../controllers/auth.controller';
import { catchAsync } from '../utils/catchAsync';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/register', catchAsync(register));
router.post('/login', catchAsync(login));
router.put(
  '/credentials',
  catchAsync(protect),
  catchAsync(authorize('admin')),
  catchAsync(updateCredentials)
);

export default router;
