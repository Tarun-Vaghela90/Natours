const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// Nested route: Forward requests to reviewRouter
router.use('/:tourId/reviews', reviewRouter);

// Alias route for top 5 cheap tours
router.route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

// Tour statistics
router.route('/tour-stats')
  .get(tourController.getTourStats);

// Monthly plan – protected and restricted to certain roles
router.route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

// Geospatial route – tours within a certain distance
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);


// Geospatial route – calculating distances
router.route('/distances/:latlng/unit/:unit')
  .get(tourController.getDistances);

// Base route for all tours
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
 .patch(
  authController.protect,
  authController.restrictTo('admin', 'lead-guide'),
  tourController.uploadTourImages,      
  tourController.resizeTourImages,      
  tourController.updateTour             
)

  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
