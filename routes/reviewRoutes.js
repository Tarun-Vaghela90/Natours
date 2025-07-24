const express = require('express');
const router = express.Router({ mergeParams: true });
const authController = require('../controllers/authController');
const {
  getAllReviews,
  createReview,
  getReview,
  updateReview,
  deleteReview,
  setTourUserIds,
} = require('../controllers/reviewController');

// Public: Get all reviews, create review (only for logged-in users)
router
  .route('/')
  .get(getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    setTourUserIds, 
    createReview
  );

// Protected: Get, update, or delete a specific review
router
  .route('/:id')
  .get(getReview)
  .patch(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    updateReview
  )
  .delete(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    deleteReview
  );

module.exports = router;
