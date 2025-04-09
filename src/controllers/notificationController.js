import { Notification, ApiError, apiResponse } from '../lib/index.js';

const getNotifications = async (req, res) => {
  const userId = req.userId;
  const { unreadOnly } = req.query;

  const query = { userId };
  if (unreadOnly === 'true') {
    query.readStatus = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(50);

  apiResponse(res, 200, notifications, 'Notifications fetched successfully');
};

const markNotificationRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  // Validate notification ID
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApiError(400, 'Invalid notification ID');
  }

  const notification = await Notification.findOne({ _id: id, userId });
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  notification.readStatus = true;
  await notification.save();

  apiResponse(res, 200, null, 'Notification marked as read');
};

const clearNotifications = async (req, res) => {
  const userId = req.userId;

  await Notification.deleteMany({ userId });

  apiResponse(res, 200, null, 'Notifications cleared successfully');
};

export { getNotifications, markNotificationRead, clearNotifications };