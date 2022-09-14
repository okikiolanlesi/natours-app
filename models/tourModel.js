const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], unique: true },
  duration: { type: Number, required: [true, 'A tour must have a duration'] },
  maxGroupSize: {
    type: Number,
    required: [true, 'Tour must have a group size'],
  },
  difficulty: { type: String, required: [true, 'Tour mus have difficulty'] },
  ratingsAverage: { type: Number, default: 4.7 },
  ratingsQuantity: { type: Number, default: 0 },

  price: { type: Number, required: [true, 'Price is required'] },
  priceDiscount: { type: Number },
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
});

const Tour = new mongoose.model('Tour', tourSchema);

module.exports = Tour;
