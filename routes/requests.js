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
  deleteAllRequest,
  getAllRequest,
} from '../controllers/request.js';

import { markAdminAs, markUserAs } from '../controllers/adminver.js';

const router = express.Router();

// REQUEST
router.get('/all', getAllRequest);
router.post('/new', newRequest);
router.post('/mark', markRequestAs);
router.get('/', getRequest);
router.get('/verify/:id', verifyRequest);
router.get('/:id/history', getRequestHistory);
router.get('/predict', predictRequests);
router.delete('/deleteall', deleteAllRequest);
router.delete('/delete/:id', deleteRequest);
router.get('/history', getAllRequestHistory);
router.get('/:id', getRequestById);

router.post('/mark-admin', markAdminAs);
router.post('/mark-user', markUserAs);

export default router;
