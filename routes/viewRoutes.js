const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();
// router.use(authController.isLoggedIn);
router.get('/', authController.isLoggedIn, viewController.getOverview);
// router.get(
//   '/createBooking',
//   // bookingController.createBookingCheckout,
//   authController.protect,
//   viewController.getMyTours
// );
router.post('/paystackWebhook', bookingController.paystackWebHook);
router.get('/me', authController.protect, viewController.getAccount);
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
router.get('/signup', authController.isLoggedIn, viewController.getSignUpForm);
router.get('/myTours', authController.protect, viewController.getMyTours);
// to be used when we update user without api
router.post(
  '/submit-user-data',
  authController.protect,
  viewController.updateUserData
);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
module.exports = router;
