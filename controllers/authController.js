const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
// const sendEmail = require('../utils/email');
const Email = require('../utils/email');

// Generate JWT
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.isLoggedIn = async (req, res, next) => {
  try {
    // 1. Get token from cookies (if exists)
    if (!req.cookies.jwt) return next();

    // 2. Verify token
    const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

    // 3. Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) return next();

    // 4. Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) return next();

    // ✅ There is a logged-in user: make user data available to views
    res.locals.user = currentUser;
    return next();
  } catch (err) {
    return next(); // continue even if not logged in
  }
};

// Send JWT and set cookie
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
  expires: new Date(
    Date.now() + Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
  ),
  httpOnly: true
};

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  user.password = undefined;

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// ✅ Signup
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  createSendToken(newUser, 201, res);
});

// ✅ Login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
});

// ✅ Logout
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

// ✅ Protect middleware
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in!', 401));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('User no longer exists.', 401));
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Password recently changed. Please login again.', 401));
  }

  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// ✅ Restrict to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    console.log('User role:', req.user.role);
    console.log('Allowed roles:', roles);
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};

// ✅ Forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {

  const user = await User.findOne({ email: req.body.email });
  console.log(req.body.email)
  if (!user) {
    return next(new AppError('No user with that email.', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetURL = `${req.protocol}://${req.get('host')}/resetPassword/${resetToken}`;
 
  await new Email(user, resetURL).sendPasswordReset();


// res.status(200).json({
//   status: 'success',
//   message: 'Token sent to email!'
// });
res.redirect('/login');
  
} catch (err) {
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save({ validateBeforeSave: false });
  console.error('❌ Email failed:', err);

    return next(new AppError('Email failed. Try again later.', 500));
  }
});

// ✅ Reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Token invalid or expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
});

// ✅ Update password (if logged in)
exports.updatePassword = catchAsync(async (req, res, next) => {
  console.log('BODY from authcontroller:', req.body);

  // 🛠️ Match frontend field names
  const { passwordCurrent, password, passwordConfirm } = req.body;

  // 1. Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2. Check if current password is correct
  if (!(await user.correctPassword(passwordCurrent, user.password))) {
    return next(new AppError('Current password is incorrect.', 401));
  }

  // 3. Update password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  // 4. Send new token
  createSendToken(user, 200, res);
});

