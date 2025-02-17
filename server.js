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

const PORT = process.env.PORT || 6001;
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('a user connected with id:', socket.id);

  socket.on('disconnect', () => {
    console.log('user disconnected with id:', socket.id);
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
