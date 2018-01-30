var mongoose = require('mongoose');

var bandSchema = mongoose.Schema({
  name: String,
  date: String,
  time: String,
  venue: String,
  link: String
});

module.exports = mongoose.model('bands-2017-03-17', bandSchema);