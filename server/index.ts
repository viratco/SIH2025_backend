const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors());

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Store active rooms with type information
interface RoomData {
  participants: string[];
}

const rooms = new Map<string, RoomData>();

// Define types for better type safety
interface Room {
  participants: string[];
}

interface SignalData {
  to: string;
  from: string;
  signal: any; // WebRTC signaling data
}

// Socket.IO connection handler
io.on('connection', (socket: any) => {
  console.log(`User connected: ${socket.id}`);

  // Handle room creation
  socket.on('create-room', () => {
    const roomId = uuidv4();
    rooms.set(roomId, { participants: [socket.id] });
    socket.join(roomId);
    socket.emit('room-created', { roomId });
    console.log(`Room created: ${roomId}`);
  });

  // Handle joining a room
  socket.on('join-room', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (room.participants.length >= 2) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    // Add participant to room
    room.participants.push(socket.id);
    socket.join(roomId);
    
    // Notify existing participants about new user
    socket.to(roomId).emit('user-joined', { userId: socket.id });
    
    // Send list of existing participants to the new user
    const otherParticipants = room.participants.filter((id: string) => id !== socket.id);
    socket.emit('existing-participants', { participants: otherParticipants });
    
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Handle signaling messages
  socket.on('signal', ({ to, signal, from }: SignalData) => {
    io.to(to).emit('signal', { signal, from });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Find and clean up rooms with disconnected users
    for (const [roomId, room] of rooms.entries()) {
      const index = room.participants.indexOf(socket.id);
      if (index !== -1) {
        room.participants.splice(index, 1);
        socket.to(roomId).emit('user-left', { userId: socket.id });
        
        // Clean up empty rooms
        if (room.participants.length === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted (no participants)`);
        }
        break;
      }
    }
  });
});

// Start the server
const PORT = process.env.PORT || 5001;
const HOST = '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log('Access the app from other devices using your computer\'s IP address');
});
