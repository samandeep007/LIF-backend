import jwt from 'jsonwebtoken';
import { ApiError } from '../lib/index.js';

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    throw new ApiError(401, 'No token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.userId = decoded.id;
  next();
};

export default authMiddleware;