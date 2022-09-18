const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

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
    },
    ratingsQuantity: { type: Number, default: 0 },

    price: { type: Number, required: [true, 'Price is required'] },
    priceDiscount: {
      type: Number,
      validate: {
        message: 'Discount price({VALUE}) should be less than actual price',
        validator: function (val) {
          // this only only points to the current document on new document creation and not update
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
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// VIRTUAL PROPERTIES do not get save to the database but is calculated and appears after getting the data
tourSchema.virtual('durationWeeks').get(function () {
  return Math.ceil(this.duration / 7);
});

// DOCUMENT MIDDLEWARE runs before or after the .save() and. create() command is executed but not on .insertMany()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
// tourSchema.pre('find', function (next) {
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
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  this._pipeline.unshift({
    $match: { secretTour: { $ne: true } },
  });
  next();
});
const Tour = new mongoose.model('Tour', tourSchema);

module.exports = Tour;
