// Route that's called to access all bands playing a particular venue

var express = require('express');
var router = express.Router();
var Band = require('../models/band.js');

router.get('/venues/*', function(req, res, next) {
  try{
      Band.model.find({venue: { $in: req.params[0]}}).exec(function (err, docs){
        if(err){ return "Error fetching bands";
        } else {
          var displayMessage = "Bands playing at "+req.params[0];
          var fbShareMessage = "Viewing " +req.params[0]+ "'s SXSW itinerary";
          var r = JSON.stringify(docs);
          res.render('userPage', {displayMessage:displayMessage, bands:r, canDelete:'n', public:'y', status:"public", link:"", fbShareMessage:fbShareMessage});
      }
    });

  } catch (e){
    res.send(404);
  }
});

module.exports = router;