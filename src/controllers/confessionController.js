import { User, Confession, Notification, ApiError, apiResponse, emitToUser } from '../lib/index.js';

const sendConfession = async (req, res) => {
  const { content } = req.body;
  const userId = req.userId;

  const confession = new Confession({
    content,
    anonymousId: userId
  });
  await confession.save();

  apiResponse(res, 200, { confessionId: confession._id }, 'Confession sent successfully');
};

const getRandomConfession = async (req, res) => {
  const userId = req.userId;

  const confession = await Confession.findOne({
    deliveredTo: null,
    anonymousId: { $ne: userId }
  }).sort({ createdAt: 1 });

  if (!confession) {
    throw new ApiError(404, 'No confessions available at this time');
  }

  confession.deliveredTo = userId;
  await confession.save();

  // Trigger notification for the user
  const notification = await Notification.create({
    userId,
    type: 'confession_received',
    content: 'You received a new confession!',
    metadata: { confessionId: confession._id }
  });

  // Emit real-time event
  emitToUser(userId.toString(), 'new_notification', notification);

  apiResponse(res, 200, { content: confession.content }, 'Random confession fetched successfully');
};

export { sendConfession, getRandomConfession };