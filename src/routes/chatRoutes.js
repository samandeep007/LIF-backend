import { Router } from 'express';
import { check, validationResult } from 'express-validator';
import { asyncHandler, authMiddleware, chatController, ApiError } from '../lib/index.js';

const router = Router();

// Validation middleware
const validateSendMessage = [
  check('matchId').notEmpty().withMessage('Match ID is required'),
  check('content').notEmpty().withMessage('Message content is required')
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
  '/chats',
  authMiddleware,
  asyncHandler(chatController.getChats)
);

router.get(
  '/chats/:matchId/messages',
  authMiddleware,
  asyncHandler(chatController.getMessages)
);

router.post(
  '/chats/message',
  authMiddleware,
  validateSendMessage,
  checkValidation,
  asyncHandler(chatController.sendMessage)
);

router.post(
  '/chats/image-message',
  authMiddleware,
  chatController.upload,
  asyncHandler(chatController.sendImageMessage)
);

router.delete(
  '/chats/:matchId',
  authMiddleware,
  asyncHandler(chatController.deleteChat)
);

export default router;