var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  name: String,
  displayName: String,
  email: String,
  uid: String,
  rawBandsFromSpotify: [mongoose.Schema.Types.Mixed],
  public: Boolean,
  savedToSchedule: Array
});

module.exports = mongoose.model('users-2019', userSchema);