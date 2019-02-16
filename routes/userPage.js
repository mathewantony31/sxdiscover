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
        var link = "https://www.sxdiscover.com/pages/"+req.params[0];

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

          var r = Band.parseShowData(result);

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

  fetchBandSummary(user, function(topOrSaved, related){
    res.render('summary', {name:user, topOrSaved:topOrSaved, related:related});
  });
});

function fetchBandSummary(user, callback){
  User.find({name: user}).exec(function(err, docs){
    if(err){
      return {errors: "Error connecting to our database"};
    } else {
      try{
        var results = Band.fetchBandInfo(docs[0].rawBandsFromSpotify, function(result){

          var topOrSavedBandList = [];
          var relatedBandList = [];

          var resultsJson = JSON.parse(JSON.stringify(result));

          for (var i=0; i < resultsJson.length; i++){
            // Check if top artists
            // TODO: actually clean this up
            if(resultsJson[i].source[0].source=='top' || resultsJson[i].source[0].source=='saved'){
              // Check if we've already added this artist
              if(topOrSavedBandList.indexOf(resultsJson[i].name)==-1){
                topOrSavedBandList.push(resultsJson[i].name)
              }
            } else if(resultsJson[i].source[0].source=='related'){
              if(relatedBandList.indexOf(resultsJson[i].name)==-1){
                relatedBandList.push(resultsJson[i].name)
              }
            }
          }

          callback(topOrSavedBandList, relatedBandList);
        });
      } catch(e){
        console.log("! Error is " + e);
        return {errors: "User page doesn't exist"};
      }
    }
  }); 
}

module.exports = router;