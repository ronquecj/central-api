import express from 'express';
import {
  loginUser,
  registerUser,
  loginSuperAdmin,
  registerSuperAdmin,
  loginAdmin,
  registerAdmin,
  changeSuperAdminPassword,
} from '../controllers/auth.js';

const router = express.Router();

// USER
router.post('/user/login', loginUser);
router.post('/user/register', registerUser);

// SuperAdmin
router.post('/super-admin/login', loginSuperAdmin);
router.post('/super-admin/register', registerSuperAdmin);
router.post('/super-admin/change-password', changeSuperAdminPassword);

// Admin
router.post('/admin/login', loginAdmin);
router.post('/admin/register', registerAdmin);

export default router;
