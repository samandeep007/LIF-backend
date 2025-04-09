import { User, ApiError, apiResponse, uploadToCloudinary, deleteTempFile } from '../lib/index.js';
import multer from 'multer';

// Multer setup for selfie upload
const storage = multer.diskStorage({
  destination: 'public/temp',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage }).single('selfie');

const verifySelfie = async (req, res) => {
  const userId = req.userId;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Upload selfie to Cloudinary
  const selfieUrl = await uploadToCloudinary(req.file.path);
  await deleteTempFile(req.file.path);

  // Placeholder for facial recognition (e.g., using OpenCV or a free API)
  // For now, we'll assume verification passes and store the selfie URL
  user.selfie = selfieUrl;
  user.isVerified = true; // In a real implementation, this would depend on facial recognition
  await user.save();

  apiResponse(res, 200, { selfieUrl }, 'Selfie verification completed (placeholder)');
};

const getSafetyGuidelines = async (req, res) => {
  const guidelines = [
    "Always meet in a public place for the first time.",
    "Tell a friend or family member about your plans, including where you'll be and who you're meeting.",
    "Verify the person's identity through video chat before meeting in person.",
    "Trust your instincts—if something feels off, leave.",
    "Keep your personal information private until you feel comfortable.",
    "Use the app's messaging system initially to communicate."
  ];

  apiResponse(res, 200, guidelines, 'Safety guidelines fetched successfully');
};

export { verifySelfie, getSafetyGuidelines, upload };