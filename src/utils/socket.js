import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Message } from '../lib/index.js';

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Update this in production to your frontend URL
      methods: ['GET', 'POST']
    }
  });

  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join a room for the user
    socket.join(socket.userId);

    // Join chat rooms for all active matches
    socket.on('join_chats', async (matchIds) => {
      matchIds.forEach(matchId => {
        socket.join(`chat:${matchId}`);
      });
      console.log(`User ${socket.userId} joined chat rooms:`, matchIds);
    });

    // Handle typing indicator
    socket.on('typing', ({ matchId, isTyping }) => {
      socket.to(`chat:${matchId}`).emit('typing', { userId: socket.userId, isTyping });
    });

    // Handle read receipt
    socket.on('read_message', async ({ messageId, matchId }) => {
      try {
        const message = await Message.findById(messageId);
        if (message && message.matchId.toString() === matchId) {
          message.readStatus = true;
          await message.save();
          socket.to(`chat:${matchId}`).emit('message_read', { messageId });
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // WebRTC signaling events
    socket.on('offer', ({ callId, offer, toUserId }) => {
      socket.to(toUserId).emit('offer', { callId, offer, fromUserId: socket.userId });
    });

    socket.on('answer', ({ callId, answer, toUserId }) => {
      socket.to(toUserId).emit('answer', { callId, answer, fromUserId: socket.userId });
    });

    socket.on('ice-candidate', ({ callId, candidate, toUserId }) => {
      socket.to(toUserId).emit('ice-candidate', { callId, candidate, fromUserId: socket.userId });
    });

    socket.on('end-call', ({ callId, toUserId }) => {
      socket.to(toUserId).emit('call_ended', { callId });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
};

// Emit an event to a specific user
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(userId).emit(event, data);
  }
};

// Emit an event to a specific chat room
const emitToChat = (matchId, event, data) => {
  if (io) {
    io.to(`chat:${matchId}`).emit(event, data);
  }
};

export { initSocket, emitToUser, emitToChat };