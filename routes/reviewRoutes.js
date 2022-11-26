const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });
router.use(authController.protect);
router
  .route('/')
  .post(
    authController.restrictTo('user'),
    reviewController.checkIfUserBookedTheTour,
    reviewController.setTourUserIds,
    reviewController.createReview
  )
  .get(
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    reviewController.getAllReviews
  );
router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.setTourUserIds,
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.setTourUserIds,
    reviewController.deleteReview
  );
module.exports = router;
