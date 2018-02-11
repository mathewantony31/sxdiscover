var exports = module.exports = {};

var Band = require('../models/band.js');

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