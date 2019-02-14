// Route that's called to access a full page view for a specific show

var express = require('express');
var router = express.Router();
var Band = require('../models/band.js');

router.get('/show/*', function(req, res, next){
  try{
    Band.model.find({showId: { $in: req.params[0]}}).exec(function (err, docs){
      if(err){
        // Error fetching anything from the database.
        console.log("Error fetching anything from the database.")
        res.sendStatus(404);
      } else {
        try{
          var results = JSON.stringify(docs)
          var name = docs[0].name
          var venue = docs[0].venue
          var image = docs[0].image

          var fullDate = new Date("2019-"+docs[0].date)
          var date = fullDate.getDate()
          var day = getDayName(fullDate.getDay())
          var time = formatAMPM(Date.parse(docs[0].time));

          res.render('show', {name:name, venue:venue, day:day, date:date, time:time, image:image})
        } catch(e){
          // Error: We fetched something from the database but hit an error trying to parse it.
          console.log("We fetched something from the database but hit an error trying to parse it.")

          // TODO: This most likely happens when we don't find a show. We should show an error message with an option to go back to the homepage.
          res.sendStatus(404);
        }
      }
    })
  } catch(e){
    console.log("Error searching database")
    res.sendStatus(404);
  }
});

module.exports = router;

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

function formatAMPM(date) {
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
  return strTime;
}