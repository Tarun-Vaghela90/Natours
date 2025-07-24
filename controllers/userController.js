const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const multer = require('multer');

// 1. Configure multer storage to memory
const multerStorage = multer.memoryStorage();

// Middleware to filter only current logged-in user
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// 2. Filter files to allow only images
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError('Not an image! Please upload only images.', 400), false);
};

// 3. Set up upload middleware
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// Export middleware for single photo upload
exports.uploadUserPhoto = upload.single('photo');

// 4. Resize and save image to disk
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

// 5. Filter fields to allow only name and email
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// 6. Update user data
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Error if password fields are sent
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError('This route is not for password updates. Use /updateMyPassword.', 400)
    );
  }

  // 2) Filter allowed fields: name, email
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Add photo to body if uploaded
  if (req.file) filteredBody.photo = req.file.filename;

  // 4) Update user
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});


// Deactivate current user
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// DO NOT update passwords with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead'
  });
};
