import 'dotenv/config';
import { app } from './src/app.js';
import { initSocket } from './src/utils/socket.js';
import { createServer } from 'http';

console.log('Environment variables loaded:', {
  PORT: process.env.PORT,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
});

const PORT = process.env.PORT || 3000;

// Create HTTP server and attach Socket.IO
const server = createServer(app);
initSocket(server);

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});