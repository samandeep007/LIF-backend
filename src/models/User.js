import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  bio: { type: String, maxLength: 500, default: '' },
  photos: [{ url: String, caption: String, _id: { type: mongoose.Schema.Types.ObjectId, auto: true } }], // Ensure _id is defined for subdocuments
  selfie: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
  filterPreferences: {
    ageRange: {
      min: { type: Number, default: 18 },
      max: { type: Number, default: 100 }
    },
    maxDistance: { type: Number, default: 100 },
    seekingGender: { type: String, default: 'any' },
    relationshipType: { type: String, default: 'any' }
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  }
});

UserSchema.index({ location: '2dsphere' });

export default mongoose.model('User', UserSchema);