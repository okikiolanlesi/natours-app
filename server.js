/* eslint-disable no-console */
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: `${__dirname}/config.env` });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);

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

app.listen(process.env.PORT, () => {
  console.log(`listening on port ${process.env.PORT}`);
});
