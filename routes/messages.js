import express from 'express';
import {
  getUsersForSidebar,
  getAllMessages,
  getMessages,
  sendMessage,
} from '../controllers/messages.js';

const router = express.Router();

// USER
router.get('/users', getUsersForSidebar);
router.get('/all', getAllMessages);
router.get('/:id', getMessages);
router.post('/send/:id', sendMessage);

export default router;
