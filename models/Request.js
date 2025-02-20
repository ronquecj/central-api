import mongoose from 'mongoose';

const RequestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    userData: {
      type: Object,
      required: true,
    },
    status: {
      type: String,
      default: 'Pending',
    },
    requestHash: {
      type: String,
      required: true,
    },
    previousHash: {
      type: String,
      default: null,
    },
    history: [
      {
        status: {
          type: String,
          required: true,
        },
        modifiedBy: {
          type: String,
          required: true,
        },
        modifiedAt: {
          type: Date,
          default: Date.now,
        },
        hash: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const Request = mongoose.model('Request', RequestSchema);
export default Request;
