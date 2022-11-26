const multer = require('multer');
const sharp = require('sharp');
const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/AppError');

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       success: false,
//       message: 'Missing name or price',
//     });
//   }
//   next();
// };
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);
// if you don't need to group your pictures just use the below statement
// upload.array('images', 5 );
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  // 1) Cover image
  const imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  req.body.imageCover = imageCoverFilename;
  sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${imageCoverFilename}`);

  // 2) Images
  // We use promise.all because we want to wait for all the images to be resized before we move on to the next middleware, without this we will get an error due to the fact that the images will not be resized in time
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (image, index) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;

      sharp(image.buffer)
        .resize(500, 700)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  );

  next();
});
exports.aliasTopTours = catchAsync((req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
});
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $avg: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    //  ` {
    //     $match: { _id: { $ne: 'EASY' } },
    //   },`
  ]);
  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1 || new Date().getFullYear();
  const plan = await Tour.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-01`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStats: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStats: -1,
      },
    },
    // {
    //   $limit: 6,
    // },
  ]);
  res.status(200).json({
    status: 'success',
    data: { plan },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  // saves the lat and lng in an array and gives them variable names as well (destructuring)
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
});
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }
  const distances = await Tour.aggregate([
    {
      // $geoNear must be the first stage in the pipeline and must be the only stage that uses the geoNear operator in a pipeline.
      // if you have multiple indexes, you can specify which one to use with the key option in the $geoNear stage. If you don't specify a key, the $geoNear stage uses the first geospatial index it finds.
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        // converts the distance to miles or kilometers since the distance is in meters
        distanceMultiplier: unit === 'mi' ? 0.000621371 : 0.001,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: { distances },
  });
});
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.searchTours = catchAsync(async (req, res, next) => {
  const output = await Tour.aggregate([
    {
      $search: {
        index: 'default',
        text: {
          query: req.body.search,
          path: 'name',
          fuzzy: {
            maxEdits: 2,
            maxExpansions: 100,
          },
        },
      },
    },
    {
      $limit: 5,
    },
    {
      $project: {
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    results: output.length,
    data: { output },
  });
});
exports.autoComplete = catchAsync(async (req, res, next) => {
  const output = await Tour.aggregate([
    {
      $search: {
        index: 'autocomplete',
        autocomplete: {
          path: 'name',
          query: req.body.search,
          fuzzy: {
            maxEdits: 1,
            // maxExpansions: 100,
          },
        },
      },
    },
    {
      $limit: 5,
    },
    {
      $project: {
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    results: output.length,
    data: { output },
  });
});
