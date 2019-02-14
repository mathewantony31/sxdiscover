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
          var date = docs[0].date
          var time = docs[0].time
          var image = docs[0].image

          res.render('show', {name:name, venue:venue, date:date, time:time, image:image})
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