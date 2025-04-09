import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true }, // Text or Cloudinary URL for images
  isImage: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  readStatus: { type: Boolean, default: false }
});

export default mongoose.model('Message', MessageSchema);