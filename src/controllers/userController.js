import bcrypt from 'bcrypt';
import multer from 'multer';
import { User, ApiError, apiResponse, uploadToCloudinary, deleteTempFile } from '../lib/index.js';

// Multer setup for in-memory storage (for Render compatibility)
const storage = multer.memoryStorage();
const upload = multer({ storage }).single('photo');

const getProfile = async (req, res) => {
  console.log(`Received GET request to /api/users/me for userId: ${req.userId}`);
  const user = await User.findById(req.userId).select('-password -verificationToken -resetPasswordToken -resetPasswordExpires');
  if (!user) {
    console.log('User not found');
    throw new ApiError(404, 'User not found');
  }
  console.log('User profile fetched successfully:', user);
  apiResponse(res, 200, user, 'Profile fetched successfully');
};

const editProfile = async (req, res) => {
  console.log(`Received PUT request to /api/users/me for userId: ${req.userId}`);
  console.log('Request body:', req.body);
  const { name, age, gender, bio, filterPreferences } = req.body;

  const user = await User.findById(req.userId);
  if (!user) {
    console.log('User not found');
    throw new ApiError(404, 'User not found');
  }

  // Update fields if provided
  if (name) user.name = name;
  if (age) user.age = age;
  if (gender) user.gender = gender;
  if (bio) user.bio = bio;

  // Update filterPreferences if provided
  if (filterPreferences) {
    console.log('Updating filterPreferences:', filterPreferences);
    if (filterPreferences.ageRange) {
      if (filterPreferences.ageRange.min) user.filterPreferences.ageRange.min = filterPreferences.ageRange.min;
      if (filterPreferences.ageRange.max) user.filterPreferences.ageRange.max = filterPreferences.ageRange.max;
    }
    if (filterPreferences.maxDistance) user.filterPreferences.maxDistance = filterPreferences.maxDistance;
    if (filterPreferences.seekingGender) user.filterPreferences.seekingGender = filterPreferences.seekingGender;
    if (filterPreferences.relationshipType) user.filterPreferences.relationshipType = filterPreferences.relationshipType;
  }

  await user.save();
  console.log('User after update:', user);

  const updatedUser = user.toObject();
  delete updatedUser.password;
  delete updatedUser.verificationToken;
  delete updatedUser.resetPasswordToken;
  delete updatedUser.resetPasswordExpires;

  console.log('Sending updated user profile:', updatedUser);
  apiResponse(res, 200, updatedUser, 'Profile updated successfully');
};

const changePassword = async (req, res) => {
  console.log(`Received PUT request to /api/users/me/password for userId: ${req.userId}`);
  console.log('Request body:', req.body);
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.userId);
  if (!user) {
    console.log('User not found');
    throw new ApiError(404, 'User not found');
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    console.log('Incorrect old password');
    throw new ApiError(400, 'Incorrect old password');
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  console.log('Password changed successfully for userId:', userId);

  apiResponse(res, 200, null, 'Password changed successfully');
};

const deleteProfile = async (req, res) => {
  console.log(`Received DELETE request to /api/users/me for userId: ${req.userId}`);
  const user = await User.findByIdAndDelete(req.userId);
  if (!user) {
    console.log('User not found');
    throw new ApiError(404, 'User not found');
  }

  console.log('User profile deleted successfully for userId:', req.userId);
  apiResponse(res, 200, null, 'Profile deleted successfully');
};

const addPhoto = async (req, res) => {
  console.log(`Received POST request to /api/users/photos for userId: ${req.userId}`);
  console.log('Request body:', req.body);
  const user = await User.findById(req.userId);
  if (!user) {
    console.log('User not found');
    throw new ApiError(404, 'User not found');
  }

  if (user.photos.length >= 9) {
    console.log('Maximum 9 photos allowed');
    throw new ApiError(400, 'Maximum 9 photos allowed');
  }

  console.log('Received file:', req.file);
  console.log('Received body:', req.body);

  if (!req.file) {
    console.log('No photo uploaded');
    throw new ApiError(400, 'No photo uploaded');
  }

  // Since we're using memoryStorage, the file is in req.file.buffer
  // Upload to Cloudinary directly from buffer
  const photoUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);
  console.log('Photo uploaded to Cloudinary:', photoUrl);

  // Add photo to user
  user.photos.push({ url: photoUrl, caption: req.body.caption || '' });
  console.log('Photos array before save:', user.photos);

  // Explicitly mark the photos array as modified
  user.markModified('photos');

  try {
    await user.save();
    console.log('User after save (in-memory):', user);
    // Fetch the user again from the database to confirm the update
    const updatedUser = await User.findById(req.userId);
    console.log('User fetched from database after save:', updatedUser);
    if (!updatedUser.photos.some(photo => photo.url === photoUrl)) {
      console.error('Photo URL not found in user document after save:', photoUrl);
      throw new ApiError(500, 'Failed to save photo to user profile');
    }
  } catch (error) {
    console.error('Error saving user:', error);
    throw new ApiError(500, 'Failed to save photo to user profile: ' + error.message);
  }

  console.log('Photo added successfully:', { url: photoUrl });
  apiResponse(res, 200, { url: photoUrl }, 'Photo added successfully');
};

const deletePhoto = async (req, res) => {
  console.log(`Received DELETE request to /api/users/photos/${req.params.photoId} for userId: ${req.userId}`);
  const { photoId } = req.params;

  const user = await User.findById(req.userId);
  if (!user) {
    console.log('User not found');
    throw new ApiError(404, 'User not found');
  }

  const photoIndex = user.photos.findIndex(photo => photo._id.toString() === photoId);
  if (photoIndex === -1) {
    console.log('Photo not found');
    throw new ApiError(404, 'Photo not found');
  }

  user.photos.splice(photoIndex, 1);
  await user.save();
  console.log('Photo deleted successfully, updated user:', user);

  apiResponse(res, 200, null, 'Photo deleted successfully');
};

const updateProfilePic = async (req, res) => {
  console.log(`Received POST request to /api/users/profile-pic for userId: ${req.userId}`);
  console.log('Request body:', req.body);
  const user = await User.findById(req.userId);
  if (!user) {
    console.log('User not found');
    throw new ApiError(404, 'User not found');
  }

  console.log('Received file:', req.file);

  if (!req.file) {
    console.log('No photo uploaded');
    throw new ApiError(400, 'No photo uploaded');
  }

  // Upload to Cloudinary directly from buffer
  const photoUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);
  console.log('Profile picture uploaded to Cloudinary:', photoUrl);

  // Update the user's selfie field
  user.selfie = photoUrl;

  try {
    await user.save();
    console.log('User after save (in-memory):', user);
    // Fetch the user again from the database to confirm the update
    const updatedUser = await User.findById(req.userId);
    console.log('User fetched from database after save:', updatedUser);
    if (updatedUser.selfie !== photoUrl) {
      console.error('Profile picture URL not found in user document after save:', photoUrl);
      throw new ApiError(500, 'Failed to save profile picture to user profile');
    }
  } catch (error) {
    console.error('Error saving user:', error);
    throw new ApiError(500, 'Failed to save profile picture to user profile: ' + error.message);
  }

  console.log('Profile picture updated successfully:', { selfieUrl: photoUrl });
  apiResponse(res, 200, { selfieUrl: photoUrl }, 'Profile picture updated successfully');
};

export { getProfile, editProfile, changePassword, deleteProfile, upload, addPhoto, deletePhoto, updateProfilePic };