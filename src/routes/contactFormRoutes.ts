import express from 'express';
import {
  createContactForm,
  getAllContactForms,
  getContactFormById,
  updateContactForm,
  deleteContactForm,
} from '../controllers/contactForm.controller';
import { catchAsync } from '../utils/catchAsync';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', catchAsync(createContactForm));

router.use(catchAsync(protect));
router.get('/', catchAsync(authorize('admin')), catchAsync(getAllContactForms));
router.get('/:id', catchAsync(authorize('admin')), catchAsync(getContactFormById));
router.put('/:id', catchAsync(authorize('admin')), catchAsync(updateContactForm));
router.delete('/:id', catchAsync(authorize('admin')), catchAsync(deleteContactForm));

export default router;
