const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// Public pages
router.get('/', authController.isLoggedIn, viewController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
router.get('/signup', authController.isLoggedIn, viewController.getSignupForm);

// Account & Protected pages
router.get('/me', authController.protect, viewController.getAccount);
router.get('/my-tours', authController.protect, viewController.getMyTours);
router.get('/my-bookings', authController.protect, bookingController.getMyBookings);

// Password reset pages
router.get('/forgotPassword', viewController.getForgotPasswordForm);
router.get('/resetPassword/:token', viewController.getResetPasswordForm);

module.exports = router;
