import express from 'express';
import {
  newRequest,
  getRequest,
  getRequestById,
  markRequestAs,
  verifyRequest,
  deleteRequest,
  getRequestHistory,
  getAllRequestHistory,
  predictRequests,
} from '../controllers/request.js';

const router = express.Router();

// REQUEST
router.post('/new', newRequest);
router.post('/mark', markRequestAs);
router.get('/', getRequest);
router.get('/verify/:id', verifyRequest);
router.get('/:id/history', getRequestHistory);
router.get('/predict', predictRequests);
router.delete('/delete/:id', deleteRequest);
router.get('/history', getAllRequestHistory);
router.get('/:id', getRequestById);

export default router;
