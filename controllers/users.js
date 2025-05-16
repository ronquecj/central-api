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

export const editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const restrictedFields = [
      'email',
      'status',
      'idPhoto',
      'history',
    ];

    const isRestrictedFieldPresent = Object.keys(updates).some(
      (field) => restrictedFields.includes(field)
    );

    if (isRestrictedFieldPresent) {
      return res.status(400).json({
        message: `Cannot update restricted fields: ${restrictedFields.join(
          ', '
        )}`,
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const allowedUpdates = [
      'firstName',
      'middleName',
      'lastName',
      'password',
      'dateOfBirth',
      'placeOfBirth',
      'sex',
      'phoneNumber',
    ];

    const filteredUpdates = {};
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    Object.assign(user, filteredUpdates);

    const updatedUser = await user.save();

    const userToReturn = updatedUser.toObject();
    delete userToReturn.password;

    res.status(200).json(userToReturn);
  } catch (error) {
    console.error('Error updating user:', error);
    res
      .status(500)
      .json({
        message: 'Error updating user information',
        error: error.message,
      });
  }
};
