import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, sendEmail, ApiError, apiResponse } from '../lib/index.js';

const generateToken = () => crypto.randomBytes(32).toString('hex');

const register = async (req, res) => {
  const { email, password, name, age, gender } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'Email already in use');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user with verification token
  const verificationToken = generateToken();
  const user = new User({
    email,
    password: hashedPassword,
    name,
    age,
    gender,
    verificationToken
  });
  await user.save();

  // Send verification email
  const verificationLink = `${process.env.APP_URL}/api/auth/verify/${verificationToken}`;
  await sendEmail(
    email,
    'Welcome to L.I.F - Verify Your Email',
    `Click here to verify your email: ${verificationLink}. Expires in 24 hours.`
  );

  apiResponse(res, 201, null, 'Check your email to verify your account');
};

const verifyEmail = async (req, res) => {
  const { token } = req.params;

  // Find user by token
  const user = await User.findOne({ verificationToken: token });
  if (!user) {
    throw new ApiError(400, 'Invalid or expired verification token');
  }

  // Verify user
  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();

  // Generate JWT
  const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  apiResponse(res, 200, { token: jwtToken }, 'Email verified successfully');
};

const login = async (req, res) => {
  const { email, password } = req.body;

  // Find user with case-insensitive email
  const user = await User.findOne({ email: { $regex: `^${email}$`, $options: 'i' } });
  if (!user) {
    throw new ApiError(400, 'Invalid email or password');
  }

  // Check if verified
  if (!user.isVerified) {
    throw new ApiError(403, 'Please verify your email first');
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(400, 'Invalid email or password');
  }

  // Generate JWT
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  apiResponse(res, 200, { token }, 'Login successful');
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Generate reset token
  const resetToken = generateToken();
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  // Send reset email
  const resetLink = `${process.env.APP_URL}/api/auth/reset-password/${resetToken}`;
  await sendEmail(
    email,
    'L.I.F - Reset Your Password',
    `Click here to reset your password: ${resetLink}. Expires in 1 hour.`
  );

  apiResponse(res, 200, null, 'Password reset link sent to your email');
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // Find user by reset token
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  // Update password
  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  apiResponse(res, 200, null, 'Password reset successfully');
};

export { register, verifyEmail, login, forgotPassword, resetPassword };