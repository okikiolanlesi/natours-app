const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const userRouter = require('./routes/userRoutes');
const tourRouter = require('./routes/tourRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// view engine setup
// sets view engine to pug
app.set('view engine', 'pug');

// sets the path to the views folder (default is views)
app.set('views', path.join(__dirname, 'views'));

// Serves static files
app.use(express.static(path.join(__dirname, 'public')));

// 1) MIDDLEWARES
// Sets security HTTP headers
app.use(helmet());

// Logs requests during development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Sets a limit on the amount of requests a user/IP address can make in a given time
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
});
app.use('/api', limiter);

// Parses the body of the request into json and limit the size/space of the body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS(Cross-site scripting) like injecting html/javascript code into the body
app.use(xss());

// Prevents parameter pollution by removing duplicate query parameters
// HPP stands for HTTP Parameter Pollution
// Also whitelists some parameters that are allowed to be duplicated
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// 3) ROUTES AND HANDLERS
app.get('/', (req, res) => {
  res.status(200).render('base', {
    tour: 'The Forest Hiker',
  });
});
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
//
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server`,
  // });
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.statusCode = 404;
  // err.status = 'fail';

  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});
app.use(globalErrorHandler);
// app.route('/api/v1/tours').get(getAllTours).post(createTour);
// app
//   .route('/api/v1/tours/:id')
//   .get(getTour)
//   .patch(updateTour)
//   .delete(deleteTour);

// app.route('/api/v1/users').get(getAllUsers).post(createUser);
// app
//   .route('/api/v1/users/:id')
//   .get(getUser)
//   .patch(updateUser)
//   .delete(deleteUser);

// 4) EXPORT APP TO SERVER.JS
module.exports = app;
