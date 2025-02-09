import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import SuperAdmin from '../models/SuperAdmin.js';

// REGISTER
export const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      email,
      password,
      dateOfBirth,
      placeOfBirth,
      sex,
      phoneNumber,
    } = req.body;

    const salt = await bcryptjs.genSalt();
    const passwordHash = await bcryptjs.hash(password, salt);

    const newUser = new User({
      firstName,
      middleName,
      lastName,
      email,
      password: passwordHash,
      dateOfBirth,
      placeOfBirth,
      sex,
      phoneNumber,
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const registerSuperAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const salt = await bcryptjs.genSalt();
    const passwordHash = await bcryptjs.hash(password, salt);

    const newSuperAdmin = new SuperAdmin({
      username,
      password: passwordHash,
    });

    const savedSuperAdmin = await newSuperAdmin.save();
    res.status(201).json(savedSuperAdmin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ msg: 'User does not exist.' });

    const isMatch = await bcryptjs.compare(password, user.password);

    if (!isMatch)
      return res.status(400).json({ msg: 'Invalid credentials.' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    delete user.password;
    res.status(200).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const loginSuperAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await SuperAdmin.findOne({ username: username });

    if (!user)
      return res.status(400).json({ msg: 'User does not exist.' });

    const isMatch = await bcryptjs.compare(password, user.password);

    if (!isMatch)
      return res.status(400).json({ msg: 'Invalid credentials.' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    delete user.password;
    res.status(200).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
