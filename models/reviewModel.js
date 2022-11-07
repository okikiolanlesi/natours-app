const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Review must have a rating'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
reviewSchema.pre(/^find/, function (next) {
  // this.populate({ path: 'user', select: 'name photo' }).populate({
  //   path: 'tour',
  //   select: 'name',
  // });
  // More efficient way to do the above since we are only need the user field
  this.populate({ path: 'user', select: 'name photo' });
  next();
});
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: {
        tour: tourId,
      },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        aveRatings: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].aveRatings,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};
reviewSchema.index({ user: 1, tour: 1 }, { unique: true });
reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.tour);
});
/*query middleware does not have access to the document but only to the query */
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // this is the query and not the document so we cannot use this.constructor here because this.constructor is the query and not the document  so we need to use the model instead of the query to access the document so we use this.r.constructor instead of this.constructor to access the model and then we can use the model to access the document and then we can use the document to access the tour id and then we can use the tour id to calculate the average ratings and then we can update the tour document with the new average ratings and the new ratings quantity and then we can save the tour document to the database and then we can call the next middleware function in the middleware stack
  //  .clone is a mongoose method that allows us to clone the query so that we can use the query to access the document and then we can use the document to access the tour id and then we can use the tour id to calculate the average ratings and then we can update the tour document with the new average ratings and the new ratings quantity and then we can save the tour document to the database and then we can call the next middleware function in the middleware stack
  this.r = await this.findOne().clone();
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  // this.r = await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
