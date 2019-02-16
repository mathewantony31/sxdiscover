// Route that pdates the shows saved to current user's schedule

var express = require('express');
var router = express.Router();
var User = require('../models/user.js');

router.post('/updateSchedule', function(req, res){

  // can't figure out why this variable is named 'savedshows[]'
  var savedShows = req.body['savedShows[]'];
  console.log("received " + savedShows.length + " shows");

  // Get current user
  User.find({"uid": req.session.id}).exec(function(err, docs){
    if(err){
      return res.send({errors:"Error finding profile. If issue persists, please message us on Facebook."})
    }

    currentUser = req.session.id;
    console.log(currentUser);

    // Update saved shows in database
    // User.update({ "uid" : req.session.id }, {$set: {"savedToShedule" : savedToSchedule}}, function(err){
    // if(err){
    //   console.log("Error: Failed to make user private");
    //   return res.send({errors: "Failed to make itinerary private. If issue persists, please message us on Facebook."});
    // }
    //   return res.send("Page is now "+statusStr+".");
    // });
  });
});

module.exports = router;