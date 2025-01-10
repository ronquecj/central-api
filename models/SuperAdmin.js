import mongoose from 'mongoose';

const SuperAdminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    isSuperAdmin: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true }
);

const SuperAdmin = mongoose.model('SuperAdmin', SuperAdminSchema);
export default SuperAdmin;
