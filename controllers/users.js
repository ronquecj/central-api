import User from '../models/User.js';
import SuperAdmin from '../models/SuperAdmin.js';

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
