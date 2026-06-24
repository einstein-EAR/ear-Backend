import express from 'express';
import { getAllUsers } from '../controllers/user.controller';
import { catchAsync } from '../utils/catchAsync';

const router = express.Router();

router.get('/', catchAsync(getAllUsers));

export default router;
