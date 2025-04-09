import { Router } from 'express';
import { asyncHandler, authMiddleware, notificationController } from '../lib/index.js';

const router = Router();

// Routes (all protected by authMiddleware)
router.get(
  '/notifications',
  authMiddleware,
  asyncHandler(notificationController.getNotifications)
);

router.put(
  '/notifications/:id/read',
  authMiddleware,
  asyncHandler(notificationController.markNotificationRead)
);

router.delete(
  '/notifications',
  authMiddleware,
  asyncHandler(notificationController.clearNotifications)
);

export default router;