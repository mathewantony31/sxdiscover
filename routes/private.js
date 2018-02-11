// Route that toggles user's itinerary between private and public

var express = require('express');
var router = express.Router();
var User = require('../models/user.js');

router.get('/private', function(req, res, next){

  // By default, set public to true
  var status = true
  var statusStr = "public";

  // Check to see user's public status
  User.find({"uid": req.session.id}).exec(function(err, docs){
    if(err){
      return res.send({errors:"Error finding profile. If issue persists, please message us on Facebook."})
    }

    status = docs[0].public;

    // Toggle status
    if (status == true){
      status = false;
      statusStr = "private"
    } else {
      status = true;
      statusStr = "public"
    }

    console.log(req.session.id);

    // Update status
    User.update({ "uid" : req.session.id }, {$set: {"public" : status}}, function(err){
    if(err){
      console.log("Error: Failed to make user private");
      return res.send({errors: "Failed to make itinerary private. If issue persists, please message us on Facebook."});
    }
      return res.send("Page is now "+statusStr+".");
    });
  });
});

module.exports = router;