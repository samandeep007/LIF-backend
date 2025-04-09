import { Match, Message, User, Notification, ApiError, apiResponse, uploadToCloudinary, deleteTempFile, emitToUser } from '../lib/index.js';
import multer from 'multer';

const storage = multer.diskStorage({
  destination: 'public/temp',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage }).single('image');

const getChats = async (req, res) => {
  const userId = req.userId;

  const matches = await Match.find({
    $or: [{ user1Id: userId }, { user2Id: userId }],
    isActive: true
  }).populate('user1Id user2Id');

  const chats = await Promise.all(
    matches.map(async (match) => {
      const otherUserId = match.user1Id._id.toString() === userId.toString() ? match.user2Id._id : match.user1Id._id;
      const otherUser = await User.findById(otherUserId).select('name photos');

      const lastMessage = await Message.findOne({ matchId: match._id })
        .sort({ createdAt: -1 })
        .select('content createdAt');

      const unreadCount = await Message.countDocuments({
        matchId: match._id,
        senderId: { $ne: userId },
        readStatus: false
      });

      return {
        matchId: match._id,
        otherUser: {
          id: otherUser._id,
          name: otherUser.name,
          photo: otherUser.photos[0]?.url || ''
        },
        lastMessage: lastMessage ? { content: lastMessage.content, createdAt: lastMessage.createdAt } : null,
        unreadCount
      };
    })
  );

  apiResponse(res, 200, chats, 'Chats fetched successfully');
};

const getMessages = async (req, res) => {
  const { matchId } = req.params;
  const userId = req.userId;

  const match = await Match.findOne({
    _id: matchId,
    $or: [{ user1Id: userId }, { user2Id: userId }],
    isActive: true
  });
  if (!match) {
    throw new ApiError(404, 'Match not found');
  }

  await Message.updateMany(
    { matchId, senderId: { $ne: userId }, readStatus: false },
    { readStatus: true }
  );

  const messages = await Message.find({ matchId })
    .sort({ createdAt: 1 })
    .limit(50);

  apiResponse(res, 200, messages, 'Messages fetched successfully');
};

const sendMessage = async (req, res) => {
  const { matchId, content } = req.body;
  const userId = req.userId;

  const match = await Match.findOne({
    _id: matchId,
    $or: [{ user1Id: userId }, { user2Id: userId }],
    isActive: true
  });
  if (!match) {
    throw new ApiError(404, 'Match not found');
  }

  const message = new Message({
    matchId,
    senderId: userId,
    content
  });
  await message.save();

  // Trigger notification for the other user
  const receiverId = match.user1Id.toString() === userId.toString() ? match.user2Id : match.user1Id;
  const notification = await Notification.create({
    userId: receiverId,
    type: 'new_message',
    content: 'You have a new message!',
    metadata: { matchId, senderId: userId }
  });

  // Emit real-time events
  emitToUser(receiverId.toString(), 'new_message', message);
  emitToUser(receiverId.toString(), 'new_notification', notification);

  apiResponse(res, 200, message, 'Message sent successfully');
};

const sendImageMessage = async (req, res) => {
  const { matchId } = req.body;
  const userId = req.userId;

  const match = await Match.findOne({
    _id: matchId,
    $or: [{ user1Id: userId }, { user2Id: userId }],
    isActive: true
  });
  if (!match) {
    throw new ApiError(404, 'Match not found');
  }

  const imageUrl = await uploadToCloudinary(req.file.path);
  await deleteTempFile(req.file.path);

  const message = new Message({
    matchId,
    senderId: userId,
    content: imageUrl,
    isImage: true
  });
  await message.save();

  // Trigger notification for the other user
  const receiverId = match.user1Id.toString() === userId.toString() ? match.user2Id : match.user1Id;
  const notification = await Notification.create({
    userId: receiverId,
    type: 'new_message',
    content: 'You have a new image message!',
    metadata: { matchId, senderId: userId }
  });

  // Emit real-time events
  emitToUser(receiverId.toString(), 'new_message', message);
  emitToUser(receiverId.toString(), 'new_notification', notification);

  apiResponse(res, 200, message, 'Image message sent successfully');
};

const deleteChat = async (req, res) => {
  const { matchId } = req.params;
  const userId = req.userId;

  const match = await Match.findOne({
    _id: matchId,
    $or: [{ user1Id: userId }, { user2Id: userId }],
    isActive: true
  });
  if (!match) {
    throw new ApiError(404, 'Match not found');
  }

  match.isActive = false;
  await match.save();

  await Message.deleteMany({ matchId });

  apiResponse(res, 200, null, 'Chat deleted successfully');
};

export { getChats, getMessages, sendMessage, sendImageMessage, deleteChat, upload };