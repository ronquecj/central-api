import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    password: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: 'Pending',
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: true,
    },
    history: [
      {
        status: {
          type: String,
          default: 'Pending',
        },
        modifiedBy: {
          type: String,
          required: true,
        },
        modifiedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const Admin = mongoose.model('Admin', AdminSchema);
export default Admin;
