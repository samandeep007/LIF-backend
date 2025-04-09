import { Router } from 'express';
import { asyncHandler, authMiddleware, statsController } from '../lib/index.js';

const router = Router();

// Routes (all protected by authMiddleware)
router.get(
  '/stats/ghosting',
  authMiddleware,
  asyncHandler(statsController.getGhostingStats)
);

export default router;