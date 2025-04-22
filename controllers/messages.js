// controllers/messages.js

import Message from '../models/Message.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import SuperAdmin from '../models/SuperAdmin.js';
import { io, onlineUsers, offlineMessages } from '../server.js'; // Assuming server.js exports these
import mongoose from 'mongoose';

// Function to determine model type (you might already have this elsewhere)
const determineModel = (userDoc) => {
  if (userDoc instanceof Admin) return 'Admin';
  if (userDoc instanceof SuperAdmin) return 'SuperAdmin';
  if (userDoc instanceof User) return 'User';
  // Fallback or error handling if needed
  return null;
};

export const getUsersForSidebar = async (req, res) => {
  try {
    const { userId, userModel } = req.query;
    let allRelatedUsers = []; // Store user documents here
    let userIds = new Set(); // Keep track of unique IDs

    // Helper function to add users to the list uniquely
    const addUniqueUsers = (users) => {
      users.forEach((u) => {
        if (u && !userIds.has(u._id.toString())) {
          userIds.add(u._id.toString());
          allRelatedUsers.push(u);
        }
      });
    };

    // Find users the current user has interacted with (sent to OR received from)
    const sentMessages = await Message.find({
      senderId: userId,
      senderModel: userModel,
    }).distinct('receiverId');
    const receivedMessages = await Message.find({
      receiverId: userId,
      receiverModel: userModel,
    }).distinct('senderId');

    const allInteractedIds = [
      ...new Set([
        ...sentMessages.map((id) => id.toString()),
        ...receivedMessages.map((id) => id.toString()),
      ]),
    ];

    // Fetch user details based on the role
    if (userModel === 'User') {
      const admin = await Admin.findOne().select('-password');
      const superAdmin = await SuperAdmin.findOne().select(
        '-password'
      );
      if (admin) addUniqueUsers([admin]);
      if (superAdmin) addUniqueUsers([superAdmin]);

      // Find Users interacted with
      const interactedUsers = await User.find({
        _id: { $in: allInteractedIds },
      }).select('-password');
      addUniqueUsers(interactedUsers);
    } else if (userModel === 'Admin') {
      const superAdmin = await SuperAdmin.findOne().select(
        '-password'
      );
      if (superAdmin) addUniqueUsers([superAdmin]);

      // Find Users interacted with
      const interactedUsers = await User.find({
        _id: { $in: allInteractedIds },
      }).select('-password');
      addUniqueUsers(interactedUsers);
    } else if (userModel === 'SuperAdmin') {
      const admin = await Admin.findOne().select('-password');
      if (admin) addUniqueUsers([admin]);

      // Find Users interacted with
      const interactedUsers = await User.find({
        _id: { $in: allInteractedIds },
      }).select('-password');
      addUniqueUsers(interactedUsers);

      // Find Admins interacted with (excluding the one already fetched if present)
      const interactedAdmins = await Admin.find({
        _id: { $in: allInteractedIds },
        _id: { $ne: admin?._id },
      }).select('-password');
      addUniqueUsers(interactedAdmins);
    } else {
      return res.status(403).json({ message: 'Invalid role' });
    }

    // Fetch the latest message for each unique user interaction
    const usersWithDetails = await Promise.all(
      allRelatedUsers.map(async (user) => {
        const latestMessage = await Message.findOne({
          $or: [
            { senderId: userId, receiverId: user._id },
            { senderId: user._id, receiverId: userId },
          ],
        })
          .sort({ createdAt: -1 })
          .select('text createdAt'); // Select necessary fields

        // *** CRITICAL: Add the model property ***
        const model = determineModel(user); // Determine model based on instance type

        if (!model) {
          console.warn(
            `Could not determine model for user ID: ${user._id}`
          );
          // Decide how to handle this - skip user, default model, etc.
          return null; // Skip user if model can't be determined
        }

        return {
          ...user.toObject(), // Convert Mongoose doc to plain object
          latestMessage: latestMessage
            ? latestMessage.toObject()
            : null, // Include latest message or null
          model: model, // *** ADD THE MODEL TYPE ***
        };
      })
    );

    // Filter out any null results (e.g., if model couldn't be determined)
    const validUsers = usersWithDetails.filter(Boolean);

    // Sort by latest message date (descending)
    validUsers.sort((a, b) => {
      const dateA = a.latestMessage
        ? new Date(a.latestMessage.createdAt).getTime()
        : 0;
      const dateB = b.latestMessage
        ? new Date(b.latestMessage.createdAt).getTime()
        : 0;
      return dateB - dateA;
    });

    res.status(200).json(validUsers);
  } catch (err) {
    console.error('Error in getUsersForSidebar:', err); // Log the full error
    res.status(500).json({
      message: err.message || 'Internal server error fetching users',
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: chatPartnerId } = req.params;
    // Ensure query params are correctly named and extracted
    const { myId, myModel, chatPartnerModel } = req.query;

    // Validate IDs early
    if (
      !mongoose.Types.ObjectId.isValid(chatPartnerId) ||
      !mongoose.Types.ObjectId.isValid(myId)
    ) {
      return res
        .status(400)
        .json({ message: 'Invalid user ID format' });
    }

    if (
      !chatPartnerModel ||
      !['User', 'Admin', 'SuperAdmin'].includes(chatPartnerModel)
    ) {
      return res
        .status(400)
        .json({ message: 'Invalid chat partner model provided' });
    }
    if (
      !myModel ||
      !['User', 'Admin', 'SuperAdmin'].includes(myModel)
    ) {
      return res
        .status(400)
        .json({ message: 'Invalid sender model provided' });
    }

    // NOTE: Removing this restriction for now, as it might be too strict depending on requirements
    // Let the frontend decide who can initiate chat, backend just retrieves messages if they exist
    // if (
    //   (myModel === 'User' && chatPartnerModel !== 'Admin' && chatPartnerModel !== 'SuperAdmin') || // User can chat Admin/SuperAdmin
    //   (myModel === 'Admin' && chatPartnerModel === 'Admin') || // Admin cannot chat Admin?
    //   (myModel === 'SuperAdmin' && chatPartnerModel === 'User') // SuperAdmin cannot chat User?
    // ) {
    //   console.log(`Chat restriction: ${myModel} to ${chatPartnerModel}`);
    //   // Return empty array instead of 403? Or keep 403 if it's a hard rule.
    //   return res.status(403).json({ message: 'You are not allowed to chat with this user type' });
    // }

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
    }).sort({ createdAt: 1 }); // Sort by creation time ascending
    // .populate('senderId receiverId'); // Keep populate if you need sender/receiver details with message

    res.status(200).json(messages);
  } catch (err) {
    console.error('Error in getMessages:', err);
    res.status(500).json({
      message: err.message || 'Failed to retrieve messages',
    });
  }
};

// No changes needed for getAllMessages, but generally avoid using it for chat display
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
    // Destructure expected fields from body
    const { text, senderId, senderModel, receiverModel } = req.body;
    // Receiver ID comes from URL params
    const { id: receiverId } = req.params;

    // --- Input Validation ---
    if (
      !text ||
      !senderId ||
      !senderModel ||
      !receiverId ||
      !receiverModel
    ) {
      return res
        .status(400)
        .json({ message: 'Missing required message fields' });
    }
    if (
      !mongoose.Types.ObjectId.isValid(senderId) ||
      !mongoose.Types.ObjectId.isValid(receiverId)
    ) {
      return res
        .status(400)
        .json({ message: 'Invalid sender or receiver ID format' });
    }
    if (!['User', 'Admin', 'SuperAdmin'].includes(senderModel)) {
      return res
        .status(400)
        .json({ message: 'Invalid sender model type' });
    }
    if (!['User', 'Admin', 'SuperAdmin'].includes(receiverModel)) {
      return res
        .status(400)
        .json({ message: 'Invalid receiver model type' });
    }

    // Optional: Modify text based on sender/receiver
    // let modifiedText = text;
    // if (senderModel === 'SuperAdmin' && receiverModel === 'User') {
    //   modifiedText = `[SYSTEM]: ${text}`; // Keep if this is desired behavior
    // }

    const newMessage = new Message({
      text: text, // Use original or modified text
      senderId,
      senderModel,
      receiverId,
      receiverModel,
      // systemMessage: senderModel === 'SuperAdmin' && receiverModel === 'User' // Example if needed
    });

    await newMessage.save();

    // Populate sender/receiver details IF the client needs them immediately with the emitted message
    // Otherwise, sending just newMessage.toObject() is lighter.
    // Choose one approach:
    // Approach 1: Emit raw saved message
    // const messageToSend = newMessage.toObject();

    // Approach 2: Populate before emitting (heavier)
    await newMessage.populate(
      'senderId',
      'username firstName lastName'
    ); // Adjust fields as needed
    await newMessage.populate(
      'receiverId',
      'username firstName lastName'
    ); // Adjust fields as needed
    const messageToSend = newMessage.toObject();

    // Emit the message to all connected clients
    io.emit('receiveMessage', messageToSend); // Send the plain object

    // Respond to the sender
    res.status(201).json(messageToSend); // Send back the same populated object
  } catch (err) {
    console.error('Error in sendMessage:', err);
    res
      .status(500)
      .json({ message: err.message || 'Failed to send message' });
  }
};
