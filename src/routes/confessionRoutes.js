import { Router } from 'express';
import { check, validationResult } from 'express-validator';
import { asyncHandler, authMiddleware, confessionController, ApiError } from '../lib/index.js';

const router = Router();

// Validation middleware
const validateConfession = [
  check('content').notEmpty().withMessage('Confession content is required').isLength({ max: 500 }).withMessage('Confession cannot exceed 500 characters')
];

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg);
  }
  next();
};

// Routes (all protected by authMiddleware)
router.post(
  '/confessions',
  authMiddleware,
  validateConfession,
  checkValidation,
  asyncHandler(confessionController.sendConfession)
);

router.get(
  '/confessions/random',
  authMiddleware,
  asyncHandler(confessionController.getRandomConfession)
);

export default router;