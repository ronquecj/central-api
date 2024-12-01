import express from 'express';
import {
  newRequest,
  getRequest,
  getRequestById,
  markRequestAs,
  verifyRequest,
  deleteRequest,
} from '../controllers/request.js';

const router = express.Router();

// REQUEST
router.post('/new', newRequest);
router.post('/mark', markRequestAs);
router.get('/', getRequest);
router.get('/:id', getRequestById);
router.get('/verify/:id', verifyRequest);
router.delete('/delete/:id', deleteRequest);

export default router;
