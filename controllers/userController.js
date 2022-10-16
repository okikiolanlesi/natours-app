const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};
// Another way of writing the above function
// const filterObj2 = (obj, allowedFields) => {
//   const newObj = {};
//   allowedFields.forEach((el) => {
//     newObj[el] = obj[el];
//   });
//   return newObj;
// };
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: 'success',
    data: {
      users,
    },
  });
});
exports.getUser = catchAsync(async (req, res, next) => {
  res
    .status(500)
    .json({ status: 'error', data: 'This route is not yet implemented' });
});
exports.createUser = catchAsync(async (req, res, next) => {
  res
    .status(500)
    .json({ status: 'error', data: 'This route is not yet implemented' });
});
exports.updateUser = catchAsync(async (req, res, next) => {
  res
    .status(500)
    .json({ status: 'error', data: 'This route is not yet implemented' });
});
exports.deleteUser = catchAsync(async (req, res, next) => {
  res
    .status(500)
    .json({ status: 'error', data: 'This route is not yet implemented' });
});
exports.updateMe = catchAsync(async (req, res, next) => {
  // Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatePassword',
        400
      )
    );
  }
  const filteredBody = filterObj(req.body, 'name', 'email');
  // Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    runValidators: true,
    new: true,
  });
  res.status(200).json({ status: 'success', data: { user: updatedUser } });
});
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({ status: 'success', data: null });
});
