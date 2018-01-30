var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  name: String,
  displayName: String,
  email: String,
  uid: String,
  rawBands: [String],
  sxswBands: [String],
  public: Boolean
});

module.exports = mongoose.model('users', userSchema);