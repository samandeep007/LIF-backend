import { Router } from 'express';
import { check, validationResult } from 'express-validator';
import { asyncHandler, authMiddleware, userController, ApiError } from '../lib/index.js';

const router = Router();

// Validation middleware
const validateEditProfile = [
  check('name').optional().notEmpty().withMessage('Name cannot be empty'),
  check('age').optional().isInt({ min: 18 }).withMessage('Age must be a number and at least 18'),
  check('gender').optional().notEmpty().withMessage('Gender cannot be empty'),
  check('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters')
];

const validateChangePassword = [
  check('oldPassword').notEmpty().withMessage('Old password is required'),
  check('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
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
  '/me',
  authMiddleware,
  asyncHandler(userController.getProfile)
);

router.put(
  '/me',
  authMiddleware,
  validateEditProfile,
  checkValidation,
  asyncHandler(userController.editProfile)
);

router.put(
  '/me/password',
  authMiddleware,
  validateChangePassword,
  checkValidation,
  asyncHandler(userController.changePassword)
);

router.delete(
  '/me',
  authMiddleware,
  asyncHandler(userController.deleteProfile)
);

router.post(
  '/photos',
  authMiddleware,
  userController.upload,
  asyncHandler(userController.addPhoto)
);

router.delete(
  '/photos/:photoId',
  authMiddleware,
  asyncHandler(userController.deletePhoto)
);

export default router;