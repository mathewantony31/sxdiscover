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
var priceMap = require('../public/javascripts/priceMapping.js')

exports.fetchBandInfo = function(bandList, callback){
  var bandNames = []
  for(var i=0;i<bandList.length;i++){
    bandNames.push(bandList[i].name.toLowerCase())
  }
    return Band.find({name_lower: { $in: bandNames}}).exec(function (err, docs){
        if(err){
            return "Error fetching bands";
        } else {

            // For each result, add a property saying the source of that band in the user's Spotify. Source can be "playlist", "top", "album".
            for(var i=0;i<docs.length;i++){
              var bandDictionary = {}
              bandDictionary.name = docs[i].name
              bandDictionary.price = getConcisePriceName(docs[i].price)
              bandDictionary.venue = docs[i].venue
              bandDictionary.name_lower = docs[i].name_lower
              bandDictionary.link = docs[i].link
              bandDictionary.time = docs[i].time
              bandDictionary.date = docs[i].date
              bandDictionary.source = [search(docs[i].name, bandList)]
              docs[i] = bandDictionary
            }
            callback(docs);
        }
    });
}

function search(nameKey, myArray){
    for (var i=0; i < myArray.length; i++) {
        if (myArray[i].name === nameKey) {
            console.log("RETURNING "+myArray[i])
            return myArray[i];
        }
    }

    return "none"
}

function getConcisePriceName(price){
  for (var i=0; i < priceMap.map.length; i++) {
        if (priceMap.map[i].original === price) {
            return priceMap.map[i].concise;
        }
    }
  return ""
}