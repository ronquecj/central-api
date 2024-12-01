import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    firstName: {
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
      required: true,
      max: 100,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      max: 50,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 5,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    // dateOfBirth: {
    //   type: String,
    //   required: true,
    // },
    // gender: {
    //   type: String,
    //   required: true,
    // },
    // age: {
    //   type: Number,
    //   required: true,
    // },
    // phoneNumber: {
    //   type: String,
    //   required: true,
    // },
    // city: {
    //   type: String,
    //   required: true,
    // },
    // province: {
    //   type: String,
    //   required: true,
    // },
    // zipcode: {
    //   type: String,
    //   required: true,
    // },
  },
  { timestamps: true }
);

const User = mongoose.model('User', UserSchema);
export default User;
