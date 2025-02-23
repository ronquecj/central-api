import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import requestRoutes from './routes/requests.js';
import messageRoutes from './routes/messages.js';
import { Server } from 'socket.io';
import { createServer } from 'http'; // Make sure tama ito!

dotenv.config();
const app = express();

app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(morgan('common'));
app.use(bodyParser.json({ limit: '30mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }));
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/request', requestRoutes);
app.use('/api/message', messageRoutes);

const PORT = process.env.PORT || 6001;
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const onlineUsers = new Map();
const offlineMessages = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Register user as online
  socket.on('userOnline', (userId) => {
    onlineUsers.set(userId, socket.id);

    // Send any pending messages
    if (offlineMessages.has(userId)) {
      offlineMessages.get(userId).forEach((msg) => {
        io.to(socket.id).emit('receiveMessage', msg);
      });
      offlineMessages.delete(userId); // Clear sent messages
    }
  });

  // Handle incoming messages
  socket.on('sendMessage', (messageData) => {
    const { receiverId } = messageData;

    // Save message to DB (already happens in sendMessage controller)

    // Check if recipient is online
    const recipientSocket = onlineUsers.get(receiverId.toString());
    if (recipientSocket) {
      io.to(recipientSocket).emit('receiveMessage', messageData);
    } else {
      // Store in offline queue if recipient is offline
      if (!offlineMessages.has(receiverId.toString())) {
        offlineMessages.set(receiverId.toString(), []);
      }
      offlineMessages.get(receiverId.toString()).push(messageData);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    onlineUsers.forEach((value, key) => {
      if (value === socket.id) {
        onlineUsers.delete(key);
      }
    });
  });
});

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    server.listen(PORT, () =>
      console.log(`listening on Port ${PORT}...`)
    );
  })
  .catch((err) => console.log(`${err} did not connect`));
export { io, onlineUsers, offlineMessages };
