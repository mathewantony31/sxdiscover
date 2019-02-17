// Route that pdates the shows saved to current user's schedule

var express = require('express');
var router = express.Router();
var User = require('../models/user.js');

router.post('/updateSchedule', function(req, res){

  // can't figure out why this variable is named 'savedshows[]'
  // renaming it to avoid confusion
  var savedShows = req.body['savedShows[]'];

  // Get current user
  User.find({"uid": req.session.id}).exec(function(err, docs){
    if(err){
      return res.send({errors:"Error finding profile. If issue persists, please message us on Facebook."})
    }
    if(docs[0].name){
      currentUser = docs[0].name;
    }
    // Update saved shows in database
    User.update({ "name" : currentUser }, {$set: {"savedToSchedule" : savedShows}}, function(err){
    if(err){
      console.log("Error: Failed save shows to schedule");
      return res.send({errors: "Failed to save schedule!"});
    } else{
      return res.send({"success" : "Schedule updated!", "status" : 200})
    }
    });
  });
});

module.exports = router;