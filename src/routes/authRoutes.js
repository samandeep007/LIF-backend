import { Router } from 'express';
import { check, validationResult } from 'express-validator';
import { asyncHandler, authController } from '../lib/index.js';

const router = Router();

// Validation middleware
const validateRegister = [
  check('email').isEmail().withMessage('Invalid email address'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  check('name').notEmpty().withMessage('Name is required'),
  check('age').isInt({ min: 18 }).withMessage('Age must be a number and at least 18'),
  check('gender').notEmpty().withMessage('Gender is required')
];

const validateLogin = [
  check('email').isEmail().withMessage('Invalid email address'),
  check('password').notEmpty().withMessage('Password is required')
];

const validateForgotPassword = [
  check('email').isEmail().withMessage('Invalid email address')
];

const validateResetPassword = [
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Check validation results
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg);
  }
  next();
};

// Routes
router.post(
  '/register',
  validateRegister,
  checkValidation,
  asyncHandler(authController.register)
);

router.get(
  '/verify/:token',
  asyncHandler(authController.verifyEmail)
);

router.post(
  '/login',
  validateLogin,
  checkValidation,
  asyncHandler(authController.login)
);

router.post(
  '/forgot-password',
  validateForgotPassword,
  checkValidation,
  asyncHandler(authController.forgotPassword)
);

router.post(
  '/reset-password/:token',
  validateResetPassword,
  checkValidation,
  asyncHandler(authController.resetPassword)
);

export default router;