import express from 'express';
import {
  getUsersForSidebar,
  getMessages,
  sendMessage,
} from '../controllers/messages.js';

const router = express.Router();

// USER
router.get('/users', getUsersForSidebar);
router.get('/:id', getMessages);
router.post('/send/:id', sendMessage);

export default router;
