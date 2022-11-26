const multer = require('multer');
const sharp = require('sharp');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const factory = require('./handlerFactory');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const { promisify } = require('util');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Saves file to file system
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
// Saves file to memory which is a buffer in req.file.buffer and then we can do whatever we want with it like resize it
// A buffer is a temporary holding spot for a stream of data. It is filled with data, then processed, then discarded.
// Are objects buffers?

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

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

exports.uploadUserPhoto = upload.single('photo');

// Sharp is used to modify image and save to filesystem here
// exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
//   if (!req.file) return next();

//   // reason for saving the filename to req.file.filename is so that we can use it in the updateMe function
//   req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
//   await sharp(req.file.buffer)
//     .resize(500, 500)
//     .toFormat('jpeg')
//     .jpeg({ quality: 90 })
//     .toFile(`public/img/users/${req.file.filename}`);
//   next();
// });

// This middleware uses cloudinary to handle image storage and resizing
exports.resizeAndUploadUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // promise version of cloudinary.uploader.upload_stream so we can use await with it instead of callback function and then get the desired response
  // Got this from   https://support.cloudinary.com/hc/en-us/community/posts/360007581379-Correct-way-of-uploading-from-buffer-

  const uploadStream = (req) => {
    return new Promise((resolve, reject) => {
      let stream = cloudinary.uploader.upload_stream(
        {
          // resize will resize the image to 500x500 and crop it to a square
          eager: [{ width: 500, height: 500, crop: 'limit' }],
          // this specifies the folder under which the image is stored in cloudinary
          folder: 'natoursUsers',
          // the public_id is used to specify the file name
          public_id: req.user.id,
        },
        function (error, result) {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });
  };
  const result = await uploadStream(req);
  req.body.photo = result.secure_url;
  next();
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};
exports.getMe = (req, res, next) => {
  req.params.id = `user-${req.user.id}-${Date.now()}`;
  next();
};

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
  const filteredBody = filterObj(req.body, 'name', 'email', 'photo');

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

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// Do NOT update passwords with this! since it doesn't use the pre save middleware to encrypt the password
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
