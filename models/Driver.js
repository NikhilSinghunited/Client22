const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  model: { type: String, required: false },
  driverName: { type: String, required: false },
  downloadLink: { type: String, required: false },
  version: { type: String, required: false },
  releaseDate: { type: Date, required: false },
  driverpath: { type: String, required: false },
});

const Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver;
