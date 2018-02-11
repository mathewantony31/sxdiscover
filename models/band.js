var mongoose = require('mongoose');

var bandSchema = mongoose.Schema({
  name: String,
  date: String,
  time: String,
  venue: String,
  link: String
});

var Band = exports.model = mongoose.model('bands-2017-03-17', bandSchema);

exports.fetchBandInfo = function(bandList, callback){
    console.log("THIS IS RUNNING")
    return Band.find({name: { $in: bandList}}).exec(function (err, docs){
        if(err){
            return "Error fetching bands";
        } else {
            console.log(docs);
            callback(docs);
        }
    });
}