const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/AppError');

exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  req.body.user = req.user.id;
  next();
};

// q: how to use $and operator in mongoose?
// a: https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
exports.checkIfUserBookedTheTour = catchAsync(async (req, res, next) => {
  const booking = await Booking.findOne({
    $and: [{ user: req.user._id }, { tour: req.params.tourId }],
  });
  if (!booking) {
    return next(
      new AppError(
        'Only users who have booked this tour can submit a review',
        401
      )
    );
  }
  next();
});
exports.getAllReviews = factory.getAll(Review);
exports.createReview = factory.createOne(Review);
exports.getReview = factory.getOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
