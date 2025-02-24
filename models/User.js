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
      validate: {
        validator: async function (value) {
          const emailCount = await YourModel.countDocuments({
            email: value,
          });
          return emailCount === 0;
        },
        message: 'This email is already registered.',
      },
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
  },
  { timestamps: true }
);

const User = mongoose.model('User', UserSchema);
export default User;
