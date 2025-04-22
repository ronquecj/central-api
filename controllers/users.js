import User from '../models/User.js';
import SuperAdmin from '../models/SuperAdmin.js';
import Admin from '../models/Admin.js';

// READ
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getSuperAdmin = async (req, res) => {
  try {
    const superAdmin = await SuperAdmin.find({});

    res.status(200).json(superAdmin);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({});

    res.status(200).json(admins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
