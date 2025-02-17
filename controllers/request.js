import Request from '../models/Request.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import CryptoJS from 'crypto-js';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import ImageModule from 'docxtemplater-image-module-free';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// const SECRET_KEY = process.env.SECRET_KEY || 'test';
const SECRET_KEY = 'testkey';

// Function to generate QR code as base64
const generateQRCode = async (data) => {
  try {
    const dataURL = await QRCode.toDataURL(data); // Generates a data URL
    const base64 = dataURL.split(',')[1]; // Extracts the Base64 portion
    return base64;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
};

const sendEmail = async (email, attachmentPath) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'ejdumaya23@gmail.com',
      pass: 'oxgy nsgq rtso bnuh',
    },
  });

  const mailOptions = {
    from: 'docsswift94@gmail.com',
    to: email,
    subject: 'Your Request Document',
    text: 'Please find the document attached.',
    attachments: [
      {
        filename: 'request.docx',
        path: attachmentPath,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};

const base64Regex =
  /^(?:data:)?image\/(png|jpg|jpeg|svg|svg\+xml);base64,/;
const validBase64 =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
function base64Parser(tagValue) {
  if (typeof tagValue !== 'string' || !base64Regex.test(tagValue)) {
    throw new Error('Invalid base64 string format');
  }

  const stringBase64 = tagValue.replace(base64Regex, '');

  if (!validBase64.test(stringBase64)) {
    throw new Error(
      'Invalid base64 data, contains invalid characters'
    );
  }

  // For Node.js, return a Buffer
  if (typeof Buffer !== 'undefined' && Buffer.from) {
    return Buffer.from(stringBase64, 'base64');
  }

  // For browsers, return binary content as a Uint8Array
  const binaryString = window.atob(stringBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

const imageOptions = {
  getImage(tagValue) {
    // Parse the base64 image data
    return base64Parser(tagValue);
  },
  getSize(img, tagValue, tagName, context) {
    return [100, 100]; // Adjust the image size (as you see fit)
  },
};

const patchDocument = async (data) => {
  const docPath = path.join(
    __dirname,
    '../templates',
    'BARANGAY_CLEARANCE.docx'
  );
  console.log('Resolved document path:', docPath);

  if (!fs.existsSync(docPath)) {
    console.error('Template file does not exist at path:', docPath);
    throw new Error('Template file not found');
  }

  console.log(data);

  const content = fs.readFileSync(docPath, 'binary');
  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    modules: [new ImageModule(imageOptions)],
  });

  const decryptedDate = CryptoJS.AES.decrypt(
    data.date,
    SECRET_KEY
  ).toString(CryptoJS.enc.Utf8);

  const decryptedData = CryptoJS.AES.decrypt(
    data,
    SECRET_KEY
  ).toString(CryptoJS.enc.Utf8);

  const requestData = {
    data: decryptedData,
  };

  // Generate QR Code
  const qrCodeData = {
    requestData,
  };

  const qrCodeBase64 = await generateQRCode(
    JSON.stringify(qrCodeData)
  );

  // Directly render the document with the data
  await doc.renderAsync({
    name: data.name,
    date: decryptedDate,
    image: `data:image/png;base64,${qrCodeBase64}`, // Pass the base64 string directly
  });

  const buf = doc.getZip().generate({ type: 'nodebuffer' });

  if (!Buffer.isBuffer(buf)) {
    console.error('Generated buffer is not of type Buffer');
    throw new Error('Failed to generate a valid buffer');
  } else {
    console.log('Generated document saved successfully');
  }

  const outputPath = path.join(
    __dirname,
    '../output',
    `request_${data.id}.docx`
  );
  fs.writeFileSync(outputPath, buf);

  return outputPath;
};

// CREATE REQUEST
export const newRequest = async (req, res) => {
  try {
    const { type, date, purpose, quantity, id, name } = req.body;
    const user = await User.findById(id);

    const encryptedType = CryptoJS.AES.encrypt(
      type,
      SECRET_KEY
    ).toString();
    const encryptedDate = CryptoJS.AES.encrypt(
      date,
      SECRET_KEY
    ).toString();
    const encryptedPurpose = CryptoJS.AES.encrypt(
      purpose,
      SECRET_KEY
    ).toString();
    const encryptedQuantity = CryptoJS.AES.encrypt(
      quantity.toString(),
      SECRET_KEY
    ).toString();

    const requestData = `${type}-${date}-${purpose}-${quantity}-${user._id}`;
    const requestHash = CryptoJS.SHA256(requestData).toString();

    const newRequest = new Request({
      type: encryptedType,
      date: encryptedDate,
      purpose: encryptedPurpose,
      quantity,
      userData: user,
      requestHash: requestHash,
    });
    console.log(requestData);

    const savedRequest = await newRequest.save();

    res.status(201).json(savedRequest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const verifyRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findById(id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    const requestData = `${request.type}-${request.date}-${request.purpose}-${request.quantity}-${request.userData._id}`;
    const computedHash = CryptoJS.SHA256(requestData).toString();

    if (computedHash === request.requestHash) {
      res.status(200).json({ message: 'Request data is valid' });
    } else {
      res
        .status(400)
        .json({ error: 'Request data has been tampered with' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markRequestAs = async (req, res) => {
  try {
    const { id, status, name } = req.body;
    const filter = { _id: id };
    const update = { status };

    const updatedRequest = await Request.findOneAndUpdate(
      filter,
      update,
      {
        new: true,
      }
    );

    if (status === 'Processing') {
      const documentPath = await patchDocument({
        type: updatedRequest.type,
        date: updatedRequest.date,
        purpose: updatedRequest.purpose,
        quantity: updatedRequest.quantity,
        id: updatedRequest._id,
        name: `${updatedRequest.userData.firstName} ${updatedRequest.userData.lastName}`,
      });

      // Send email to user with the document
      await sendEmail(updatedRequest.userData.email, documentPath);

      res.status(200).json({
        message: 'Request processed, document sent via email',
        updatedRequest,
      });
    } else {
      res
        .status(200)
        .json({ message: 'Request status updated', updatedRequest });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET REQUEST
export const getRequest = async (req, res) => {
  try {
    const users = await Request.find({});
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET REQUEST BY ID
export const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const ObjectId = mongoose.Types.ObjectId;
    const requests = await Request.find({
      'userData._id': new ObjectId(id),
    }).exec();

    res.status(200).json({ count: requests.length, requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE REQUEST
export const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRequest = await Request.findByIdAndDelete(id);

    if (!deletedRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.status(200).json({
      message: 'Request deleted successfully',
      deletedRequest,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
