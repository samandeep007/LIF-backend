import { User, Swipe, Match, Notification, ApiError, apiResponse, emitToUser } from '../lib/index.js';

const getPotentialMatches = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const swipedUsers = await Swipe.find({ userId: req.userId }).select('targetId');
  const swipedUserIds = swipedUsers.map(swipe => swipe.targetId);

  const query = {
    _id: { $ne: req.userId, $nin: swipedUserIds },
    isVerified: true,
    age: {
      $gte: user.filterPreferences.ageRange.min,
      $lte: user.filterPreferences.ageRange.max
    }
  };

  if (user.filterPreferences.seekingGender !== 'any') {
    query.gender = user.filterPreferences.seekingGender;
  }

  if (user.filterPreferences.relationshipType !== 'any') {
    query.relationshipType = user.filterPreferences.relationshipType;
  }

  if (user.location.coordinates[0] !== 0 || user.location.coordinates[1] !== 0) {
    query.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: user.location.coordinates
        },
        $maxDistance: user.filterPreferences.maxDistance * 1609.34
      }
    };
  }

  const matches = await User.find(query)
    .select('name age gender bio photos')
    .limit(10);

  apiResponse(res, 200, matches, 'Potential matches fetched successfully');
};

const swipe = async (req, res) => {
  const { targetId, direction } = req.body;
  const userId = req.userId;

  if (!['like', 'pass', 'swipe_up'].includes(direction)) {
    throw new ApiError(400, 'Invalid swipe direction');
  }

  const targetUser = await User.findById(targetId);
  if (!targetUser) {
    throw new ApiError(404, 'Target user not found');
  }

  const existingSwipe = await Swipe.findOne({ userId, targetId });
  if (existingSwipe) {
    throw new ApiError(400, 'Already swiped on this user');
  }

  const swipe = new Swipe({ userId, targetId, direction });
  await swipe.save();

  if (direction === 'pass' || direction === 'swipe_up') {
    apiResponse(res, 200, { swipeId: swipe._id }, `Swipe (${direction}) recorded`);
    return;
  }

  const reverseSwipe = await Swipe.findOne({ userId: targetId, targetId: userId, direction: 'like' });
  if (reverseSwipe) {
    const match = new Match({
      user1Id: userId,
      user2Id: targetId
    });
    await match.save();

    // Trigger notifications for both users
    const notification1 = await Notification.create({
      userId: targetId,
      type: 'new_match',
      content: 'You have a new match!',
      metadata: { matchId: match._id }
    });
    const notification2 = await Notification.create({
      userId,
      type: 'new_match',
      content: 'You have a new match!',
      metadata: { matchId: match._id }
    });

    // Emit real-time notifications
    emitToUser(targetId.toString(), 'new_notification', notification1);
    emitToUser(userId.toString(), 'new_notification', notification2);

    apiResponse(res, 200, { matchId: match._id }, 'Match created');
  } else {
    apiResponse(res, 200, { swipeId: swipe._id }, 'Swipe recorded');
  }
};

const undoSwipe = async (req, res) => {
  const { swipeId } = req.params;
  const userId = req.userId;

  const swipe = await Swipe.findOne({ _id: swipeId, userId });
  if (!swipe) {
    throw new ApiError(404, 'Swipe not found');
  }

  const match = await Match.findOne({
    $or: [
      { user1Id: userId, user2Id: swipe.targetId },
      { user1Id: swipe.targetId, user2Id: userId }
    ],
    isActive: true
  });

  if (match) {
    throw new ApiError(400, 'Cannot undo a mutual match');
  }

  await Swipe.deleteOne({ _id: swipeId });

  apiResponse(res, 200, null, 'Swipe undone successfully');
};

export { getPotentialMatches, swipe, undoSwipe };