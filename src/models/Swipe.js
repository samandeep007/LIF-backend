import mongoose from 'mongoose';

const SwipeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  direction: { type: String, enum: ['like', 'pass', 'swipe_up'], required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Swipe', SwipeSchema);