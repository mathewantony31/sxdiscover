var mongoose = require('mongoose');
const {google} = require('googleapis');

var bandSchema = mongoose.Schema({
  name: String,
  price: String,
  venue: String,
  name_lower: String,
  image: String,
  link: String,
  time: String,
  date: String,
  showId: String,
  show_link: String
});

var Band = exports.model = mongoose.model('_2019-03-12', bandSchema);
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
              bandDictionary.showId = docs[i].showId
              bandDictionary.source = [search(docs[i].name, bandList)]
              docs[i] = bandDictionary
            }
            callback(docs);
          }
        });
}

exports.fetchShowInfoFromShowIds = function(showIdList, callback){

  return Band.find({showId: { $in: showIdList}}).exec(function (err, docs){
    if(err){
      return "Error fetching shows from showId";
    } else {

      // For each result, add a property saying the source of that band in the user's Spotify. 
      // Source can be "playlist", "top", "album".
      for(var i=0;i<docs.length;i++){
        var showDictionary = {}
        showDictionary.name = docs[i].name
        showDictionary.price = getConcisePriceName(docs[i].price)
        showDictionary.venue = docs[i].venue
        showDictionary.name_lower = docs[i].name_lower
        showDictionary.link = docs[i].link
        showDictionary.time = docs[i].time
        showDictionary.date = docs[i].date
        showDictionary.showId = docs[i].showId
        showDictionary.source = ["no source"]
        docs[i] = showDictionary
      }
      callback(docs);
    }
  });
}

exports.saveToGoogleCalendar = function(auth, data, callback){
  console.log("Saving "+data.summary+" to calendar, on date "+data.start.dateTime);
  // Given Google auth credentials and show data, save a new event to the user's calendar
  const calendar = google.calendar({version: 'v3', auth});
  
  calendar.events.insert({
    auth: auth,
    calendarId: 'primary',
    resource: data,
  }, function(err, event) {
    if (err) {
      console.log("ERROR")
      console.log(err); // Err is "TypeError: callback is not a function"
      if(callback){
        callback(false);
      }
      return;
    } else {
      console.log("SUCCESS")
      if(callback){
        callback(true);
      }
    }
  });
}

exports.parseShowData = function(shows){
  var dateList = [1];

  for(var i=0;i<shows.length;i++){

    var showDate = Date.parse(shows[i].date).getDate();
    var showDay = getDayName(Date.parse(shows[i].date).getDay());
    var showTime;
    if(shows[i].time=="TBD"){
      showTime = "TBD"
    } else {
      showTime = getTimeText(Date.parse(shows[i].time));
    }
    var showInfo = {
      name:shows[i].name,
      time:showTime,
      link:shows[i].link,
      venue:shows[i].venue,
      price:shows[i].price,
      source:getSource(shows[i].source[0]),
      showId:shows[i].showId
    }

    // For each element in dateList, check if the element.date equals an integer
    for(var j=0;j<dateList.length;j++){
      if(dateList[j].date==showDate){
        dateList[j].shows.push(showInfo)
        break;
      }

      // If we're at the last element and still haven't found a date match, create a new date in dateList
      if(j==dateList.length-1){
        dateList.push({
          date:showDate,
          shows:[showInfo],
          day:showDay
        })
        break;
      }
    }
  }

  // Remove first element
  dateList.shift();

  return dateList
  // Create an array of objects, where each item is a day with an array of show data 
  // e.g. [{'2019-03-12':[{show1},{show2},{show3}]}]
  // Each show contains the properties defined in the Band schema
}

// Function that takes in the source of a band (top, saved, related) 
// and returns the string that we should show in the itinerary 
// (e.g. "Because you like Hatchie", or "From your library")
function getSource(sourceData){
  switch(sourceData.source){
    case "top":
      return "Recently played"
      break;
    case "saved":
      return "From your library"
      break;
    case "related":
      return "Because you like "+sourceData.relatedTo
      break;
    default:
      return ""
  }
}

function getDayName(index){
  switch(index){
    case 0:
    return "Sunday"
    break;
    case 1:
    return "Monday"
    break;
    case 2:
    return "Tuesday"
    break;
    case 3:
    return "Wednesday"
    break;
    case 4:
    return "Thursday"
    break;
    case 5:
    return "Friday"
    break;
    case 6:
    return "Saturday"
    break;
  }
}

function getTimeText(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  if(minutes == '00') {
    minutes = '';
  } else {
    minutes = ':' + minutes.toString()
  } // if minutes is 00, remove it
  var strTime = hours + minutes + ' ' + ampm;

  switch(strTime){
    case "12 pm":
      strTime = "Noon"
      break;
    case "12 am":
      strTime = "Midnight"
      break;
  }

  return strTime;
}

function search(nameKey, myArray){

  for (var i=0; i < myArray.length; i++) {
    if (myArray[i].name.toLowerCase() === nameKey.toLowerCase()) {
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