/* eslint-disable no-console */
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: `${__dirname}/../../config.env` });

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);

const tours = fs.readFileSync(path.join(__dirname, 'tours.json'), 'utf8');
const users = fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8');
const reviews = fs.readFileSync(path.join(__dirname, 'reviews.json'), 'utf8');

const parsedTours = JSON.parse(tours);
const parsedUsers = JSON.parse(users);
const parsedReviews = JSON.parse(reviews);
const importData = async (data, Model) => {
  try {
    await Model.create(data, { validateBeforeSave: false });
    console.log('Import done');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
const deleteData = async (Model) => {
  try {
    await Model.deleteMany();
    console.log('Delete done');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

const importAndDelete = async () => {
  await mongoose
    .connect(DB, { useNewUrlParser: true, useUnifiedTopology: true })
    // eslint-disable-next-line no-console
    .then(() => {
      console.log('connected');
    })
    .catch((error) => {
      console.log('could not connect');
      console.log(error);
    });
  if (process.argv[2] === '--import') {
    if (process.argv[3] === '--tours') {
      importData(parsedTours, Tour);
    } else if (process.argv[3] === '--users') {
      importData(parsedUsers, User);
    } else if (process.argv[3] === '--reviews') {
      importData(parsedReviews, Review);
    } else {
      console.log('Please provide a valid collection name');
    }
  } else if (process.argv[2] === '--delete') {
    if (process.argv[3] === '--tours') {
      deleteData(Tour);
    } else if (process.argv[3] === '--users') {
      deleteData(User);
    } else if (process.argv[3] === '--reviews') {
      deleteData(Review);
    } else {
      console.log('Please specify the collection to delete');
    }
  }
};
importAndDelete();
console.log(process.argv);
