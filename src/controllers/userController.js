import bcrypt from 'bcrypt';
import multer from 'multer';
import { User, ApiError, apiResponse, uploadToCloudinary, deleteTempFile } from '../lib/index.js';

// Multer setup for in-memory storage (for Render compatibility)
const storage = multer.memoryStorage();
const upload = multer({ storage }).single('photo');

const getProfile = async (req, res) => {
  const user = await User.findById(req.userId).select('-password -verificationToken -resetPasswordToken -resetPasswordExpires');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  apiResponse(res, 200, user, 'Profile fetched successfully');
};

const editProfile = async (req, res) => {
  const { name, age, gender, bio } = req.body;

  const user = await User.findById(req.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Update fields if provided
  if (name) user.name = name;
  if (age) user.age = age;
  if (gender) user.gender = gender;
  if (bio) user.bio = bio;

  await user.save();
  console.log('User after bio update:', user);

  const updatedUser = user.toObject();
  delete updatedUser.password;
  delete updatedUser.verificationToken;
  delete updatedUser.resetPasswordToken;
  delete updatedUser.resetPasswordExpires;

  apiResponse(res, 200, updatedUser, 'Profile updated successfully');
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new ApiError(400, 'Incorrect old password');
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  apiResponse(res, 200, null, 'Password changed successfully');
};

const deleteProfile = async (req, res) => {
  const user = await User.findByIdAndDelete(req.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Note: In a full implementation, we'd also delete related data (matches, messages, etc.)
  apiResponse(res, 200, null, 'Profile deleted successfully');
};

const addPhoto = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.photos.length >= 9) {
    throw new ApiError(400, 'Maximum 9 photos allowed');
  }

  console.log('Received file:', req.file);
  console.log('Received body:', req.body);

  if (!req.file) {
    throw new ApiError(400, 'No photo uploaded');
  }

  // Since we're using memoryStorage, the file is in req.file.buffer
  // Upload to Cloudinary directly from buffer
  const photoUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);
  console.log('Photo uploaded to Cloudinary:', photoUrl);

  // Add photo to user
  user.photos.push({ url: photoUrl, caption: req.body.caption || '' });
  console.log('Photos array before save:', user.photos);

  try {
    await user.save();
    console.log('User after save:', user);
    // Fetch the user again from the database to confirm the update
    const updatedUser = await User.findById(req.userId);
    console.log('User fetched from database after save:', updatedUser);
  } catch (error) {
    console.error('Error saving user:', error);
    throw new ApiError(500, 'Failed to save photo to user profile');
  }

  apiResponse(res, 200, { url: photoUrl }, 'Photo added successfully');
};

const deletePhoto = async (req, res) => {
  const { photoId } = req.params;

  const user = await User.findById(req.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const photoIndex = user.photos.findIndex(photo => photo._id.toString() === photoId);
  if (photoIndex === -1) {
    throw new ApiError(404, 'Photo not found');
  }

  user.photos.splice(photoIndex, 1);
  await user.save();

  apiResponse(res, 200, null, 'Photo deleted successfully');
};

export { getProfile, editProfile, changePassword, deleteProfile, upload, addPhoto, deletePhoto };