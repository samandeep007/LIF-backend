import mongoose from 'mongoose';

const ConfessionSchema = new mongoose.Schema({
  content: { type: String, required: true },
  anonymousId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Sender (anonymous)
  deliveredTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Recipient (null until delivered)
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Confession', ConfessionSchema);