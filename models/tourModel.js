const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      unique: true,
      maxlength: ['40', 'A tour name must have <= 40 characters'],
      minlength: ['10', 'A tour name must have >= 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: { type: String },
    duration: { type: Number, required: [true, 'A tour must have a duration'] },
    maxGroupSize: {
      type: Number,
      required: [true, 'Tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'Tour mus have difficulty'],
      enum: {
        values: ['difficult', 'medium', 'easy'],
        message: 'Difficulty must be either difficult, medium or easy',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.7,
      min: [1, 'Rating must be >= 1'],
      max: [5, 'Rating must be <= 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: { type: Number, default: 0 },

    price: { type: Number, required: [true, 'Price is required'] },
    priceDiscount: {
      type: Number,
      validate: {
        message: 'Discount price({VALUE}) should be less than actual price',
        validator: function (val) {
          // this only only points to the current document on new document creation and won't when we try to update an existing tour
          if (val >= this.price) {
            return false;
          }
          return true;
        },
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'Tour must have summary'],
    },
    description: { type: String, trim: true },
    imageCover: {
      type: String,
      trim: true,
      required: [true, 'Tour must have cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    secretTour: { type: Boolean, default: false },
    startLocation: {
      // GeoJSON is used to specify geo-spatial data
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number], //array of numbers in order [longitude, latitude]
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        // Array of ObjectIds
        type: mongoose.Schema.ObjectId,
        // Reference to the User model
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
// Indexing for geospatial data (2dsphere) is required for geoJSON data types to work properly in MongoDB
tourSchema.index({ startLocation: '2dsphere' });
// VIRTUAL PROPERTIES do not get save to the database but is calculated and appears after getting the data
tourSchema.virtual('durationWeeks').get(function () {
  return Math.ceil(this.duration / 7);
});
// Virtual populate - populate the reviews field in the tour document with the reviews of the tour
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// DOCUMENT MIDDLEWARE runs before or after the .save() and. create() command is executed but not on .insertMany()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function (next) {
//   this.guides = await User.find({ _id: { $in: this.guides } });
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
// Query middleware does not have access to the document but only to the query
tourSchema.pre(/^find/, function (next) {
  // .populate() is a mongoose method that allows us to populate the fields of a document with data from another collection
  // path is the name of the field in the document that we want to populate
  // select is the fields that we want to select from the other collection that we want to populate
  this.populate({ path: 'guides', select: '-__v -passwordChangedAt' });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});
// long method
// tourSchema.pre('findOne', function (next) {
//   this.find({ secretTour: { $ne: true } });
//   next();
// });

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(docs);
//   next();
// });
// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds`);
//   next();
// });

// // AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   this._pipeline.unshift({
//     $match: { secretTour: { $ne: true } },
//   });
//   next();
// });
// eslint-disable-next-line new-cap
const Tour = new mongoose.model('Tour', tourSchema);

module.exports = Tour;
