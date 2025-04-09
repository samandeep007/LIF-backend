import User from '../models/User.js';
import Match from '../models/Match.js';
import Swipe from '../models/Swipe.js';
import Message from '../models/Message.js';
import Call from '../models/Call.js';
import Confession from '../models/Confession.js';
import Notification from '../models/Notification.js';
import { connectDB } from '../db/index.js';
import sendEmail from '../utils/email.js';
import uploadToCloudinary from '../utils/cloudinary.js';
import deleteTempFile from '../utils/file.js';
import ApiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import errorMiddleware from '../middlewares/errorMiddleware.js';
import { initSocket, emitToUser } from '../utils/socket.js';
import * as authController from '../controllers/authController.js';
import * as userController from '../controllers/userController.js';
import * as swipeController from '../controllers/swipeController.js';
import * as chatController from '../controllers/chatController.js';
import * as callController from '../controllers/callController.js';
import * as confessionController from '../controllers/confessionController.js';
import * as notificationController from '../controllers/notificationController.js';
import * as statsController from '../controllers/statsController.js';
import * as safetyController from '../controllers/safetyController.js';
import authRoutes from '../routes/authRoutes.js';
import userRoutes from '../routes/userRoutes.js';
import swipeRoutes from '../routes/swipeRoutes.js';
import chatRoutes from '../routes/chatRoutes.js';
import callRoutes from '../routes/callRoutes.js';
import confessionRoutes from '../routes/confessionRoutes.js';
import notificationRoutes from '../routes/notificationRoutes.js';
import statsRoutes from '../routes/statsRoutes.js';
import safetyRoutes from '../routes/safetyRoutes.js';

export {
  User,
  Match,
  Swipe,
  Message,
  Call,
  Confession,
  Notification,
  connectDB,
  sendEmail,
  uploadToCloudinary,
  deleteTempFile,
  ApiError,
  apiResponse,
  asyncHandler,
  authMiddleware,
  errorMiddleware,
  initSocket,
  emitToUser,
  authController,
  userController,
  swipeController,
  chatController,
  callController,
  confessionController,
  notificationController,
  statsController,
  safetyController,
  authRoutes,
  userRoutes,
  swipeRoutes,
  chatRoutes,
  callRoutes,
  confessionRoutes,
  notificationRoutes,
  statsRoutes,
  safetyRoutes
};