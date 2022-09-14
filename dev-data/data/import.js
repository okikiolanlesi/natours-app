const fs = require('fs');
const mongoose = require('mongoose');
const Tour = require('../../models/tourModel');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: `${__dirname}/../../config.env` });

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('connected');
  })
  .catch((error) => {
    console.log('could not connect');
    console.log(error);
  });

const data = fs.readFileSync(path.join(__dirname, 'tours-simple.json'), 'utf8');

const parsedData = JSON.parse(data);
const importData = async () => {
  try {
    await Tour.create(parsedData);
    console.log('Import done');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Delete done');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

console.log(process.argv);
