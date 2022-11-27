const axios = require('axios');
const payStack = require('paystack-api')(process.env.PAYSTACK_SECRET_KEY);

const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  // 1a - Get the tourId from the url
  const tour = await Tour.findById(req.params.tourId);

  if (!tour) return next(new AppError('There is no tour with that ID', 404));

  const tourDate = tour.startDates.filter(
    (date) => date.date.toISOString() === req.params.tourDate
  );
  if (tourDate[0].date < Date.now())
    return next(new AppError('You cannot book a tour in the past', 400));
  if (tourDate[0].soldOut === true) {
    return next(
      new AppError('Sorry, this tour is fully booked for this date', 400)
    );
  }

  if (tourDate[0].participants >= tour.maxGroupSize) {
    if (!tourDate[0].soldOut) {
      tourDate[0].soldOut = true;
      await tour.save({ validateBeforeSave: false });
    }

    return next(
      new AppError('Sorry, this tour is fully booked for this date', 400)
    );
  }

  // 1b - check if the tour is already booked by the user
  const alreadyBooked = await Booking.findOne({
    $and: [{ tour: req.params.tourId }, { user: req.user.id }],
  });

  if (alreadyBooked)
    return next(new AppError('You have already booked this tour', 400));

  // 2) Create checkout session/transaction
  const transaction = await payStack.transaction.initialize({
    amount: tour.price * 100,
    email: req.user.email,
    callback_url: `${req.protocol}://${req.get('host')}/createBooking`,
    currency: 'NGN',
    // metadata holds additional information about the transaction like cart items, cart total, cart id, etc
    // this is optional
    // this controller/endpoint handles only one item at a time but can be modified to handle multiple items like this: metadata: { cart: JSON.stringify(req.body) } or metadata: { cart:Number(req.body.items.length), total:Number, items:[{}] } etc
    metadata: {
      userId: req.user.id,
      tourId: tour.id,
      items: [{ tour, date: tourDate[0] }],
    },
  });
  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    transaction,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  if (!req.query.reference && !req.query.trxref) return next();
  const response = await axios.get(
    `https://api.paystack.co/transaction/verify/${req.query.reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );
  // if transaction is successful create a booking and update the tour date participants
  if (response.data.data.status === 'success') {
    const { tourId, userId, items } = response.data.data.metadata;
    await Booking.create({
      bookingId: req.query.reference,
      tour: tourId,
      user: userId,
      price: response.data.data.amount / 100,
      date: items[0].date.date,
    });

    // This way might cause concurrency issues
    // const tour = await Tour.findById(tourId);

    // const index = tour.startDates.findIndex(
    //   (date) =>
    //     date.date.toISOString() ===
    //     response.data.data.metadata.items[0].date.date
    // );
    // tour.startDates[index].participants += 1;
    // await tour.save({ validateBeforeSave: false });

    // This way helps to avoid concurrency issues
    await Tour.findOneAndUpdate(
      { _id: tourId },
      { $inc: { 'startDates.$[elemMatch].participants': 1 } },
      {
        arrayFilters: [
          {
            'elemMatch.date': response.data.data.metadata.items[0].date.date,
          },
        ],
      }
    );
  }
  // if transaction is not successful send an error message
  if (response.data.data.status === 'fail')
    return next(new AppError('Payment failed, please try again', 400));

  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
