var mongoose = require('mongoose');

var bandSchema = mongoose.Schema({
  name: String,
  price: String,
  venue: String,
  name_lower: String,
  link: String,
  time: String,
  date: String
});

var Band = exports.model = mongoose.model('_2018-02-18', bandSchema);

exports.fetchBandInfo = function(bandList, callback){
    return Band.find({name_lower: { $in: bandList}}).exec(function (err, docs){
        if(err){
            return "Error fetching bands";
        } else {
            // console.log(docs);
            callback(docs);
        }
    });
}