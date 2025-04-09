import { Match, Call, Notification, ApiError, apiResponse, emitToUser } from '../lib/index.js';

const initiateCall = async (req, res) => {
  const { matchId, type } = req.body;
  const userId = req.userId;

  if (!['audio', 'video'].includes(type)) {
    throw new ApiError(400, 'Invalid call type');
  }

  const match = await Match.findOne({
    _id: matchId,
    $or: [{ user1Id: userId }, { user2Id: userId }],
    isActive: true
  });
  if (!match) {
    throw new ApiError(404, 'Match not found');
  }

  const receiverId = match.user1Id.toString() === userId.toString() ? match.user2Id : match.user1Id;

  const existingCall = await Call.findOne({
    matchId,
    status: { $in: ['pending', 'active'] }
  });
  if (existingCall) {
    throw new ApiError(400, 'A call is already in progress for this match');
  }

  const call = new Call({
    matchId,
    initiatorId: userId,
    receiverId,
    type,
    status: 'pending'
  });
  await call.save();

  // Trigger notification for the receiver
  const notification = await Notification.create({
    userId: receiverId,
    type: 'call_initiated',
    content: `You have an incoming ${type} call!`,
    metadata: { matchId, callId: call._id }
  });

  // Emit real-time events
  emitToUser(receiverId.toString(), 'call_initiated', { callId: call._id, type, initiatorId: userId });
  emitToUser(receiverId.toString(), 'new_notification', notification);

  apiResponse(res, 200, { callId: call._id }, 'Call initiated successfully');
};

const getCallStatus = async (req, res) => {
  const { matchId } = req.params;
  const userId = req.userId;

  if (!matchId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApiError(400, 'Invalid match ID');
  }

  const match = await Match.findOne({
    _id: matchId,
    $or: [{ user1Id: userId }, { user2Id: userId }],
    isActive: true
  });
  if (!match) {
    throw new ApiError(404, 'Match not found');
  }

  const call = await Call.findOne({ matchId })
    .sort({ createdAt: -1 })
    .select('status type initiatorId receiverId startTime endTime');
  if (!call) {
    throw new ApiError(404, 'No call found for this match');
  }

  apiResponse(res, 200, call, 'Call status fetched successfully');
};

const endCall = async (req, res) => {
  const { callId } = req.params;
  const userId = req.userId;

  if (!callId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApiError(400, 'Invalid call ID');
  }

  const call = await Call.findOne({
    _id: callId,
    initiatorId: userId,
    status: { $in: ['pending', 'active'] }
  });
  if (!call) {
    throw new ApiError(404, 'Call not found, already ended, or you are not the initiator');
  }

  call.status = 'ended';
  call.endTime = new Date();
  if (!call.startTime) {
    call.startTime = call.createdAt;
  }
  await call.save();

  // Emit real-time event to the receiver
  emitToUser(call.receiverId.toString(), 'call_ended', { callId: call._id });

  apiResponse(res, 200, null, 'Call ended successfully');
};

export { initiateCall, getCallStatus, endCall };