const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const upload = require('../utils/uploadImage'); // path to your multer config

const router = express.Router();

// ✅ Public Routes (NO protection needed)
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// ✅ Protect all routes after this middleware
router.use(authController.protect);

// ✅ User-specific routes (accessible to all logged-in users)
router.get('/me', userController.getMe, userController.getUser);
// router.patch('/updateMe', userController.updateMe);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.patch(
  '/updateMyPassword',
  authController.updatePassword
);

router.delete('/deleteMe', userController.deleteMe);

// ✅ Admin-only routes
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser); 

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);


// ✅ User-only nested review creation route
router
  .route('/:tourId/reviews')
  .post(
    authController.restrictTo('user'),
    reviewController.createReview
  );

module.exports = router;
