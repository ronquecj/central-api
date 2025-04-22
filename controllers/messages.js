import Message from '../models/Message.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import SuperAdmin from '../models/SuperAdmin.js';
import { io, onlineUsers, offlineMessages } from '../server.js';

export const getUsersForSidebar = async (req, res) => {
  try {
    const { userId, userModel } = req.query;
    let filteredUsers = [];

    const getLatestMessage = async (user) => {
      const latestMessage = await Message.findOne({
        $or: [
          { senderId: userId, receiverId: user._id },
          { senderId: user._id, receiverId: userId },
        ],
      })
        .sort({ createdAt: -1 })
        .select('text createdAt');
      return { ...user.toObject(), latestMessage };
    };

    if (userModel === 'User') {
      const admin = await Admin.findOne().select('-password');
      const superAdmin = await SuperAdmin.findOne().select(
        '-password'
      );
      const userChats = await Message.distinct('receiverId', {
        senderId: userId,
        senderModel: 'User',
      });
      const users = await User.find({
        _id: { $in: userChats },
      }).select('-password');
      filteredUsers = [admin, superAdmin, ...users].filter(Boolean);
    } else if (userModel === 'Admin') {
      const superAdmin = await SuperAdmin.findOne().select(
        '-password'
      );
      const userChats = await Message.distinct('receiverId', {
        senderId: userId,
        senderModel: 'Admin',
      });
      const users = await User.find({
        _id: { $in: userChats },
      }).select('-password');
      filteredUsers = [superAdmin, ...users].filter(Boolean);
    } else if (userModel === 'SuperAdmin') {
      const admin = await Admin.findOne().select('-password');
      const userChats = await Message.distinct('receiverId', {
        senderId: userId,
        senderModel: 'SuperAdmin',
      });
      const users = await User.find({
        _id: { $in: userChats },
      }).select('-password');
      filteredUsers = [admin, ...users].filter(Boolean);
    } else {
      return res.status(403).json({ message: 'Invalid role' });
    }

    const usersWithMessages = await Promise.all(
      filteredUsers.map(getLatestMessage)
    );
    res.status(200).json(usersWithMessages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: chatPartnerId } = req.params;
    const { myId, myModel, chatPartnerModel } = req.query;

    if (
      !chatPartnerModel ||
      !['User', 'Admin', 'SuperAdmin'].includes(chatPartnerModel)
    ) {
      return res
        .status(400)
        .json({ message: 'Invalid chat partner model' });
    }

    if (
      (myModel === 'User' && chatPartnerModel !== 'Admin') ||
      (myModel === 'SuperAdmin' && chatPartnerModel === 'User')
    ) {
      return res
        .status(403)
        .json({ message: 'You are not allowed to chat this user' });
    }

    const messages = await Message.find({
      $or: [
        {
          senderId: myId,
          senderModel: myModel,
          receiverId: chatPartnerId,
          receiverModel: chatPartnerModel,
        },
        {
          senderId: chatPartnerId,
          senderModel: chatPartnerModel,
          receiverId: myId,
          receiverModel: myModel,
        },
      ],
    }).populate('senderId receiverId');

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find({});

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const sendMessage = async (req, res) => {
  try {
    let { text, receiverModel, senderId, senderModel } = req.body;
    const { id: receiverId } = req.params;

    if (!['User', 'Admin', 'SuperAdmin'].includes(receiverModel)) {
      return res
        .status(400)
        .json({ message: 'Invalid receiver model type' });
    }

    if (senderModel === 'SuperAdmin' && receiverModel === 'User') {
      text = `[SYSTEM]: ${text}`;
    }

    const newMessage = new Message({
      text,
      senderId,
      senderModel,
      receiverId,
      receiverModel,
    });

    await newMessage.save();

    // Just emit regardless of online status
    io.emit('receiveMessage', newMessage);

    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
