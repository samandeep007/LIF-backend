import { Router } from 'express';
import { check, validationResult } from 'express-validator';
import { asyncHandler, authMiddleware, callController, ApiError } from '../lib/index.js';

const router = Router();

// Validation middleware
const validateInitiateCall = [
  check('matchId').notEmpty().withMessage('Match ID is required').matches(/^[0-9a-fA-F]{24}$/).withMessage('Invalid match ID'),
  check('type').isIn(['audio', 'video']).withMessage('Invalid call type')
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
  '/calls/initiate',
  authMiddleware,
  validateInitiateCall,
  checkValidation,
  asyncHandler(callController.initiateCall)
);

router.get(
  '/calls/status/:matchId',
  authMiddleware,
  asyncHandler(callController.getCallStatus)
);

router.post(
  '/calls/end/:callId',
  authMiddleware,
  asyncHandler(callController.endCall)
);

export default router;