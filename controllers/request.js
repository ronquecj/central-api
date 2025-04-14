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
import tf from '@tensorflow/tfjs';
import { performance } from 'perf_hooks';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// const SECRET_KEY = process.env.SECRET_KEY || 'test';
const SECRET_KEY = 'testkey';

// Function to generate QR code as base64
const generateQRCode = async (data) => {
  try {
    const dataURL = await QRCode.toDataURL(data);
    const base64 = dataURL.split(',')[1];
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

  if (typeof Buffer !== 'undefined' && Buffer.from) {
    return Buffer.from(stringBase64, 'base64');
  }

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

  const requestData = {
    date: data.date,
    purpose: data.purpose,
    type: data.type,
    quantity: data.quantity,
    id: data.id,
    name: data.name,
  };

  const qrCodeData = {
    requestData,
  };

  const qrCodeBase64 = await generateQRCode(
    JSON.stringify(qrCodeData)
  );

  const dateNow = new Date();
  const birthDate = new Date(data.dateOfBirth);
  const age = dateNow.getFullYear() - birthDate.getFullYear();

  const day = now.getDate();
  const month = now.toLocaleString('en-US', { month: 'long' }); // e.g. April
  const year = now.getFullYear();

  const formatted = dateNow.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  await doc.renderAsync({
    name: data.name,
    dateOfBirth: data.dateOfBirth,
    age: age,
    day: day,
    month: month,
    year: year,
    date: decryptedDate,
    image: `data:image/png;base64,${qrCodeBase64}`,
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
    const startTime = performance.now();

    const requestHash = CryptoJS.SHA256(requestData).toString();
    const endTime = performance.now();

    const hashingTime = endTime - startTime;

    const newRequest = new Request({
      type: encryptedType,
      date: encryptedDate,
      purpose: encryptedPurpose,
      quantity,
      userData: user,
      requestHash: requestHash,
      history: [
        {
          status: 'Created',
          modifiedBy: `${user.firstName} ${user.lastName}`,
          hash: requestHash,
          previousHash: null,
          hashingTime: hashingTime,
        },
      ],
    });

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
    const { id, status, modifiedBy } = req.body;
    const request = await Request.findById(id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const updateData = `${status}-${modifiedBy}-${request.requestHash}`;
    const startTime = performance.now();
    const updateHash = CryptoJS.SHA256(updateData).toString();
    const endTime = performance.now();
    const hashingTime = endTime - startTime;

    const updatedRequest = await Request.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          previousHash: request.requestHash,
          requestHash: updateHash,
        },
        $push: {
          history: {
            status,
            modifiedBy,
            hash: updateHash,
            previousHash: request.requestHash,
            hashingTime: hashingTime,
          },
        },
      },
      { new: true }
    );

    if (status === 'Processing') {
      const documentPath = await patchDocument({
        type: updatedRequest.type,
        date: updatedRequest.date,
        purpose: updatedRequest.purpose,
        quantity: updatedRequest.quantity,
        dateOfBirth: updatedRequest.dateOfBirth,
        placeOfBirth: updatedRequest.placeOfBirth,
        id: updatedRequest._id,
        name: `${updatedRequest.userData.firstName} ${updatedRequest.userData.lastName}`,
      });

      await sendEmail(updatedRequest.userData.email, documentPath);

      return res.status(200).json({
        message: 'Request processed, document sent via email',
        updatedRequest,
      });
    }

    res
      .status(200)
      .json({ message: 'Request status updated', updatedRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRequestHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findById(id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.status(200).json({ history: request.history });
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

export const deleteAllRequest = async (req, res) => {
  try {
    const deletedRequests = await Request.deleteMany({});

    res.status(200).json({
      message: 'All requests deleted successfully',
      deletedCount: deletedRequests.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllRequestHistory = async (req, res) => {
  try {
    const requests = await Request.find(
      {},
      'email type status quantity date purpose userData history requestHash previousHash'
    );
    console.log('request', requests);

    if (!requests.length) {
      return res
        .status(404)
        .json({ message: 'No request history found' });
    }

    const historyData = requests.map((request) => ({
      user: `${request.userData.firstName} ${request.userData.lastName}`,
      email: request.userData.email,
      type: request.type,
      status: request.status,
      quantity: request.quantity,
      date: request.date,
      purpose: request.purpose,
      userData: request.userData,
      requestHash: request.requestHash,
      previousHash: request.previousHash,
      history: request.history.map((entry) => ({
        status: entry.status,
        modifiedBy: entry.modifiedBy,
        hash: entry.hash,
        timestamp: entry.modifiedAt,
        previousHash: entry.previousHash,
        hashingTime: entry.hashingTime,
      })),
    }));

    res.status(200).json({ history: historyData });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
  }
};

export const predictRequests = async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: 1 });

    if (requests.length < 2) {
      return res
        .status(400)
        .json({ message: 'Not enough data for accurate prediction' });
    }

    const requestData = requests.map((req) => ({
      date: new Date(req.createdAt).getTime(),
      quantity: req.quantity,
    }));

    const minDate = requestData[0].date;
    const inputs = requestData.map(
      (d) => (d.date - minDate) / 86400000
    );
    const outputs = requestData.map((d) => d.quantity);

    const xs = tf.tensor2d(inputs, [inputs.length, 1]);
    const ys = tf.tensor2d(outputs, [outputs.length, 1]);

    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        units: 10,
        activation: 'relu',
        inputShape: [1],
      })
    );
    model.add(tf.layers.dense({ units: 5, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1 }));
    model.compile({ loss: 'meanSquaredError', optimizer: 'adam' });

    await model.fit(xs, ys, { epochs: 50 });

    const futureDays = {
      oneWeek: 7,
      oneMonth: 30,
      oneYear: 365,
      fiveYears: 365 * 5,
      tenYears: 365 * 10,
    };

    const predictions = {};

    for (const [key, days] of Object.entries(futureDays)) {
      const futureDate = (Date.now() - minDate) / 86400000 + days;
      const prediction = model.predict(
        tf.tensor2d([futureDate], [1, 1])
      );
      const predictedQuantity = prediction.dataSync()[0];

      const avgQuantity =
        outputs.reduce((a, b) => a + b, 0) / outputs.length;
      predictions[key] =
        predictedQuantity > 0
          ? Math.round(predictedQuantity)
          : Math.round(avgQuantity);
    }

    res.json({
      predictedDates: {
        oneWeek: new Date(
          Date.now() + futureDays.oneWeek * 86400000
        ).toISOString(),
        oneMonth: new Date(
          Date.now() + futureDays.oneMonth * 86400000
        ).toISOString(),
        oneYear: new Date(
          Date.now() + futureDays.oneYear * 86400000
        ).toISOString(),
        fiveYears: new Date(
          Date.now() + futureDays.fiveYears * 86400000
        ).toISOString(),
        tenYears: new Date(
          Date.now() + futureDays.tenYears * 86400000
        ).toISOString(),
      },
      predictedQuantities: predictions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllRequest = async (req, res) => {
  try {
    const requests = await Request.find({});

    res.status(200).json({ requests });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
