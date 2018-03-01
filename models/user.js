var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  name: String,
  displayName: String,
  email: String,
  uid: String,
  rawBands: [mongoose.Schema.Types.Mixed],
  sxswBands: [mongoose.Schema.Types.Mixed],
  public: Boolean
});

module.exports = mongoose.model('users', userSchema);