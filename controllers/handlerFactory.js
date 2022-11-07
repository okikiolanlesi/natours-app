const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const ApiFeatures = require('../utils/ApiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const deletedDocument = await Model.findByIdAndDelete(req.params.id);
    if (!deletedDocument) {
      return next(new AppError(`No document found With that ID`, 404));
    }
    res.status(200).json({
      status: 'success',
      data: null,
    });
  });
exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const updatedDocument = await Model.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedDocument) {
      return next(new AppError('No document found With that ID', 404));
    }
    res.status(201).json({
      status: 'success',
      data: {
        data: updatedDocument,
      },
    });
  });
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDocument = await Model.create(req.body);
    if (!newDocument) {
      return next(
        new AppError('Unable to create document, try again later', 404)
      );
    }
    res.status(201).json({
      status: 'success',
      data: { document: newDocument },
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    // .populate() is a mongoose method that allows us to populate the fields of a document with data from another collection
    // path is the name of the field in the document that we want to populate
    // select is the fields that we want to select from the other collection that we want to populate
    // const tour = await Tour.findById(req.params.id).populate({
    //   path: 'guides',
    //   select: '-__v -passwordChangedAt',
    // });

    let query = Model.findById(req.params.id);
    // ⤴ ⤴  shorthand for Tour.findOne({_id: req.params.id}) ⤴ ⤴
    if (populateOptions) query = query.populate(populateOptions);
    const document = await query;
    if (!document) {
      return next(new AppError('No tour found With that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: { document },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested get review on tour  (hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    // EXECUTE QUERY
    const features = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // Here we are using the .explain() method to get the query plan for the query that we are executing
    // const documents = await features.query.explain();
    const documents = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: { documents },
    });
  });
