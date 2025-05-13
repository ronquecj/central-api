import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      min: 2,
      max: 50,
    },
    middleName: {
      type: String,
      required: true,
      min: 2,
      max: 50,
    },
    lastName: {
      type: String,
      required: true,
      min: 2,
      max: 50,
    },
    email: {
      type: String,
      required: false,
      max: 100,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 5,
    },
    dateOfBirth: {
      type: String,
      required: true,
    },
    placeOfBirth: {
      type: String,
      required: true,
    },
    sex: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: 'Pending',
    },
    idPhoto: {
      type: String,
      required: true,
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

const User = mongoose.model('User', UserSchema);
export default User;
