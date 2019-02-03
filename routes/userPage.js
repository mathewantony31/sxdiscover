// Route that's called to load a user's itinerary

var express = require('express');
var router = express.Router();
var User = require('../models/user.js');
var Band = require('../models/band.js');

router.get('/pages/*', function(req, res){

  try{

    // Find user with name "*" in Users database. "*" is accessed with req.params[0]
    User.find({name: req.params[0]}).exec(function(err, docs){

      if(err){
        return res.send({errors: "Error connecting to our database"});
      } else{
        try{
        // Check to see if current page matches the user's logged in session
        var requestSession = req.session.id;
        var userSession = docs[0].uid;
        var displayName = docs[0].displayName;
        var public = docs[0].public;
        var link = "http://sxdiscover.co/pages/"+req.params[0];

        // Check to see if page is set to public or private, or if user visiting their own page

        var results = Band.fetchBandInfo(docs[0].rawBandsFromSpotify, function(result){

          result.sort(function(a,b){

            if(a.time=='TBD'){
              a.time = '00:00'
            }
            if(b.time=='TBD'){
              b.time = '00:00'
            }
            return Date.parse(a.date+" 2018 "+a.time)-Date.parse(b.date+" 2018 "+b.time);
          })

          var r = parseShowData(result);
          console.log(r);

          if(public==true){
            if(requestSession==userSession){
            // If user is visiting their own page, show the delete button
            res.render('userPage', {shows:r, canDelete:'y', public:'y', status:"public", link:link});
          } else {
            res.render('userPage', {shows:r, canDelete:'n', public:'y', status:"public", link:link});
          }
        } else if(requestSession==userSession){
          res.render('userPage', {shows:r, canDelete:'y', public:'n', status:"private"});
        } else {
          return res.render('privateUser');
        }
      });
      } catch (e){
        console.log("Error is " + e);
        return res.send({errors: "User page doesn't exist"});
      }
    }
  });
  } catch (e){
    res.send(404);
  }
});

router.get('/summary', function(req, res){
  var user = req.query.user;

  fetchBandSummary(user, function(result){
    res.render('summary', {name:user, bands:result});
  });
});

function fetchBandSummary(user, callback){
  User.find({name: user}).exec(function(err, docs){
    if(err){
      return {errors: "Error connecting to our database"};
    } else {
      try{
        console.log("Result from fetching user is "+JSON.stringify(docs))
        var results = Band.fetchBandInfo(docs[0].rawBandsFromSpotify, function(result){

          var bandList = []
          var resultsJson = JSON.parse(JSON.stringify(result));

          for (var i=0; i < resultsJson.length; i++){
            // Check if top artists
            // TODO: actually clean this up
            if(resultsJson[i].source[0].source=='top' || resultsJson[i].source[0].source=='saved' || resultsJson[i].source[0].source=='playlist'){
              // Check if we've already added this artist to bandList
              if(bandList.indexOf(resultsJson[i].name)==-1){
                bandList.push(resultsJson[i].name)
              }
            }
          }

          callback(bandList);
        });
      } catch(e){
        console.log("! Error is " + e);
        return {errors: "User page doesn't exist"};
      }
    }
  }); 
}

function parseShowData(shows){

  var dateList = [1];

  for(var i=0;i<shows.length;i++){

    var showDate = Date.parse(shows[i].date).getDate();
    var showInfo = {
      name:shows[i].name,
      time:shows[i].time,
      link:shows[i].link,
      venue:shows[i].venue,
      price:shows[i].price
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
          shows:[showInfo]
        })
      }
    }
  }

  // Remove first element
  dateList.shift();

  return dateList
  // Create an array of objects, where each item is a day with an array of show data, e.g. [{'2019-03-12':[{show1},{show2},{show3}]}]. Each show contains the properties defined in the Band schema
}

// Function that returns the correct suffix for a given date, e.g. if you input 22, it will return "nd" to form "22nd". The approach here is to extract the second digit from the date (e.g. if you input 23, it'll just look at 3), and return a string based on the value of the second digit: 1 = "st", 2 = "nd", 3 = "rd", everything else = "th".

function getDateSuffix(date){
// Pull the second digit
var secondDigit = date % 10

// Special cases: 11, 12 and 13 are treated as "th"
if(date==11 || date==12 || date==13){
  return "th"
}
  // 1st, 2nd, 3rd, 4th, 21st, 22nd, 23rd
  switch(secondDigit){
    case 1:
    return "st"
    break;
    case 2:
    return "nd"
    break;
    case 3:
    return "rd"
    break;
    default:
    return "th"
  }
}

module.exports = router;