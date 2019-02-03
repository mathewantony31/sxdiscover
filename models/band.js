var mongoose = require('mongoose');
const {google} = require('googleapis');

var bandSchema = mongoose.Schema({
  name: String,
  price: String,
  venue: String,
  name_lower: String,
  link: String,
  time: String,
  date: String
});

var Band = exports.model = mongoose.model('_2018-03-03-v3', bandSchema);
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

            // For each result, add a property saying the source of that band in the user's Spotify. 
            // Source can be "playlist", "top", "album".
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

exports.saveToGoogleCalendar = function(auth, data){
  // Given Google auth credentials and show data, save a new event to the user's calendar
  const calendar = google.calendar({version: 'v3', auth});
  
  calendar.events.insert({
    auth: auth,
    calendarId: 'primary',
    resource: data,
  }, function(err, event) {
    if (err) {
      console.log(err);
      return;
    }
  });
}

function search(nameKey, myArray){

    for (var i=0; i < myArray.length; i++) {
        if (myArray[i].name === nameKey) {
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