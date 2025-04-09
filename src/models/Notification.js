import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['new_match', 'new_message', 'call_initiated', 'confession_received'], required: true },
  content: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed }, // E.g., { matchId, senderId }
  readStatus: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Notification', NotificationSchema);