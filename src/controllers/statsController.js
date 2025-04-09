import { Message, Match, ApiError, apiResponse } from '../lib/index.js';

const getGhostingStats = async (req, res) => {
  const userId = req.userId;

  // Get all matches for the user
  const matches = await Match.find({
    $or: [{ user1Id: userId }, { user2Id: userId }],
    isActive: true
  });

  const matchIds = matches.map(match => match._id);

  // Calculate average response time (in hours)
  const messages = await Message.find({
    matchId: { $in: matchIds },
    senderId: userId
  }).sort({ createdAt: 1 });

  let totalResponseTime = 0;
  let responseCount = 0;

  for (let i = 0; i < messages.length - 1; i++) {
    const currentMessage = messages[i];
    const nextMessage = messages[i + 1];

    // Check if the next message is a reply (different match or sender)
    if (currentMessage.matchId.toString() === nextMessage.matchId.toString() && currentMessage.senderId.toString() !== nextMessage.senderId.toString()) {
      const responseTime = (nextMessage.createdAt - currentMessage.createdAt) / (1000 * 60 * 60); // Hours
      totalResponseTime += responseTime;
      responseCount++;
    }
  }

  const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

  // Calculate ghosting frequency (messages without a reply within 24 hours)
  let ghostedCount = 0;
  for (const matchId of matchIds) {
    const lastMessage = await Message.findOne({ matchId, senderId: userId }).sort({ createdAt: -1 });
    if (lastMessage) {
      const lastReply = await Message.findOne({
        matchId,
        senderId: { $ne: userId },
        createdAt: { $gt: lastMessage.createdAt }
      });

      if (!lastReply) {
        const timeSinceLastMessage = (Date.now() - lastMessage.createdAt) / (1000 * 60 * 60); // Hours
        if (timeSinceLastMessage > 24) {
          ghostedCount++;
        }
      }
    }
  }

  const stats = {
    averageResponseTime: avgResponseTime.toFixed(2), // Hours
    ghostedCount,
    totalMatches: matches.length
  };

  apiResponse(res, 200, stats, 'Ghosting stats fetched successfully');
};

export { getGhostingStats };