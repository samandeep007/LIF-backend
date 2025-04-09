import { Router } from 'express';
import { check, validationResult } from 'express-validator';
import { asyncHandler, authMiddleware, swipeController, ApiError } from '../lib/index.js';

const router = Router();

// Validation middleware
const validateSwipe = [
  check('targetId').notEmpty().withMessage('Target user ID is required'),
  check('direction').isIn(['like', 'pass', 'swipe_up']).withMessage('Invalid swipe direction')
];

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg);
  }
  next();
};

// Routes (all protected by authMiddleware)
router.get(
  '/potential-matches',
  authMiddleware,
  asyncHandler(swipeController.getPotentialMatches)
);

router.post(
  '/swipes',
  authMiddleware,
  validateSwipe,
  checkValidation,
  asyncHandler(swipeController.swipe)
);

router.post(
  '/swipes/undo/:swipeId',
  authMiddleware,
  asyncHandler(swipeController.undoSwipe)
);

export default router;