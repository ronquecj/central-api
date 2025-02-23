import express from 'express';
import { getUser, getSuperAdmin } from '../controllers/users.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// READ
router.get('/superadmin', getSuperAdmin);
router.get('/:id', getUser);

// UPDATE

export default router;
