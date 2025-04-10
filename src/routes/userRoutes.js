import { Router } from 'express';
import { check, validationResult } from 'express-validator';
import { asyncHandler, authMiddleware, userController, ApiError } from '../lib/index.js';

const router = Router();

// Validation middleware
const validateEditProfile = [
  check('name').optional().notEmpty().withMessage('Name cannot be empty'),
  check('age').optional().isInt({ min: 18 }).withMessage('Age must be a number and at least 18'),
  check('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  check('filterPreferences.ageRange.min')
    .optional()
    .isInt({ min: 18 })
    .withMessage('Minimum age must be at least 18'),
  check('filterPreferences.ageRange.max')
    .optional()
    .isInt({ max: 100 })
    .withMessage('Maximum age cannot exceed 100'),
  check('filterPreferences.maxDistance')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max distance must be at least 1 km'),
  check('filterPreferences.seekingGender')
    .optional()
    .isIn(['male', 'female', 'any'])
    .withMessage('Seeking gender must be "male", "female", or "any"'),
  check('filterPreferences.relationshipType')
    .optional()
    .isIn(['casual', 'serious', 'any'])
    .withMessage('Relationship type must be "casual", "serious", or "any"'),
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

router.post(
  '/profile-pic',
  authMiddleware,
  userController.upload,
  asyncHandler(userController.updateProfilePic)
);

export default router;