import { Match, Message, User, Notification, ApiError, apiResponse, emitToChat, emitToUser, uploadToCloudinary } from '../lib/index.js';
import multer from 'multer';

const storage = multer.memoryStorage();
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
        .select('content createdAt isImage');

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
          photo: otherUser.selfie || (otherUser.photos && otherUser.photos.length > 0 ? otherUser.photos[0].url : '')
        },
        lastMessage: lastMessage ? { content: lastMessage.content, createdAt: lastMessage.createdAt, isImage: lastMessage.isImage } : null,
        unreadCount
      };
    })
  );

  apiResponse(res, 200, chats, 'Chats fetched successfully');
};

const getMessages = async (req, res) => {
  const { matchId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const userId = req.userId;

  console.log(`Fetching messages for matchId: ${matchId}, userId: ${userId}, page: ${page}, limit: ${limit}`);

  const match = await Match.findOne({
    _id: matchId,
    $or: [{ user1Id: userId }, { user2Id: userId }],
    isActive: true
  });
  if (!match) {
    console.log('Match not found');
    throw new ApiError(404, 'Match not found');
  }

  await Message.updateMany(
    { matchId, senderId: { $ne: userId }, readStatus: false },
    { readStatus: true }
  );

  const messages = await Message.find({ matchId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  console.log(`Fetched ${messages.length} messages for matchId: ${matchId}`);

  messages.reverse();

  apiResponse(res, 200, messages, 'Messages fetched successfully');
};

// ... (rest of the file remains unchanged)

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
  emitToChat(matchId.toString(), 'new_message', message);
  emitToUser(receiverId.toString(), 'new_notification', notification);

  apiResponse(res, 200, message, 'Message sent successfully');
};

const sendImageMessage = async (req, res) => {
  try {
    console.log('Received request to /api/chats/image-message');
    const { matchId } = req.body;
    const userId = req.userId;

    console.log('Match ID:', matchId);
    console.log('User ID:', userId);

    const match = await Match.findOne({
      _id: matchId,
      $or: [{ user1Id: userId }, { user2Id: userId }],
      isActive: true
    });
    if (!match) {
      console.log('Match not found');
      throw new ApiError(404, 'Match not found');
    }

    if (!req.file) {
      console.log('No image uploaded');
      throw new ApiError(400, 'No image uploaded');
    }

    console.log('Received file:', req.file);

    const imageUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    console.log('Image uploaded to Cloudinary:', imageUrl);

    const message = new Message({
      matchId,
      senderId: userId,
      content: imageUrl,
      isImage: true
    });
    await message.save();
    console.log('Message saved:', message);

    // Trigger notification for the other user
    const receiverId = match.user1Id.toString() === userId.toString() ? match.user2Id : match.user1Id;
    const notification = await Notification.create({
      userId: receiverId,
      type: 'new_message',
      content: 'You have a new image message!',
      metadata: { matchId, senderId: userId }
    });
    console.log('Notification created:', notification);

    // Emit real-time events
    emitToChat(matchId.toString(), 'new_message', message);
    emitToUser(receiverId.toString(), 'new_notification', notification);

    apiResponse(res, 200, message, 'Image message sent successfully');
  } catch (error) {
    console.error('Error in sendImageMessage:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      throw new ApiError(404, 'Message not found');
    }

    // Ensure the user can only delete their own message
    if (message.senderId.toString() !== userId.toString()) {
      throw new ApiError(403, 'You can only delete your own messages');
    }

    const matchId = message.matchId.toString();

    await Message.deleteOne({ _id: messageId });

    // Emit real-time event to update the chat
    emitToChat(matchId, 'message_deleted', { messageId });

    apiResponse(res, 200, null, 'Message deleted successfully');
  } catch (error) {
    console.error('Error in deleteMessage:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
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

export { getChats, getMessages, sendMessage, sendImageMessage, deleteMessage, deleteChat, upload };