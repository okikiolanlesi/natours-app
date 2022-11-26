/* eslint-disable no-console */
const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message, err.stack);
  console.log('UNCAUGHT EXCEPTION, Shutting down ...');
  process.exit();
});
dotenv.config({ path: `${__dirname}/config.env` });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);
// console.log(process.env.DATABASE_PASSWORD);
mongoose
  .connect(DB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('DB connection successful');
  })
  .catch((error) => {
    console.log('could not connect to MongoDB');
    console.log(error);
  });

console.log(process.env.NODE_ENV);

const server = app.listen(process.env.PORT, () => {
  console.log(`listening on port ${process.env.PORT}`);
});
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message, err.stack);
  console.log('UNHANDLED REJECTION, Shutting down ...');

  server.close(() => {
    process.exit();
  });
});
