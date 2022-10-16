const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
// const catchAsync = require('../utils/catchAsync');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'User must have name'] },
  email: {
    type: String,
    required: [true, 'User must have email'],
    unique: true,
    lowercase: true,
    validate: {
      message: 'User email must be a valid email address',
      validator: validator.isEmail,
    },
  },
  photo: { type: String },
  role: {
    type: String,
    enum: {
      values: ['admin', 'user', 'guide', 'lead-guide'],
      message: 'role must be either admin, user, guide or lead-guide',
    },
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'User must have password'],
    minlength: 8,
    // Makes it so that it doesn't show up in outputs when reading the database
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'User must have passwordConfirm'],
    validate: {
      // (important) This only works on SAVE and CREATE!!!
      validator: function (el) {
        // if (el === this.password) return true;
        // return false;
        return el === this.password;
      },
      message: 'Password and passwordConfirm do not match',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});
// MIDDLEWARE
userSchema.pre('save', async function (next) {
  // Only run if password is actually modified
  if (!this.isModified('password')) return next();
  // encrypt the password with cost of 12 and set password to the encrypted string
  this.password = await bcrypt.hash(this.password, 12);
  // remove passwordConfirm since we only need it to validate the user password
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password' || this.isNew)) return next();
  this.passwordChangedAt = Date.now() - 1000; // subtract 1 second to make sure the token is created before the password is changed;
  next();
});
userSchema.pre(/^find/, async function (next) {
  this.find({ active: { $ne: false } });
  next();
});
// INSTANCE METHODS
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.changedPasswordAfter = async function (JWTTIMESTAMP) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return changedTimeStamp > JWTTIMESTAMP;
  }
  return false;
};
userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  // console.log(this.passwordResetToken, resetToken);
  return resetToken;
};
// eslint-disable-next-line new-cap
const User = new mongoose.model('User', userSchema);
module.exports = User;
