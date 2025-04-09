import { Router } from 'express';
import { asyncHandler, authMiddleware, safetyController } from '../lib/index.js';

const router = Router();

// Routes (all protected by authMiddleware)
router.post(
  '/verify/selfie',
  authMiddleware,
  safetyController.upload,
  asyncHandler(safetyController.verifySelfie)
);

router.get(
  '/safety/guidelines',
  authMiddleware,
  asyncHandler(safetyController.getSafetyGuidelines)
);

export default router;