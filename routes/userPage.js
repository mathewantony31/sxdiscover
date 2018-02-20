// Route that's called to load a user's itinerary

var express = require('express');
var router = express.Router();
var User = require('../models/user.js');
var Band = require('../models/band.js');

router.get('/pages/*', function(req, res) {

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

                console.log(link);

                var fbShareMessage = "My SXSW 🎉"
                var displayMessage = "Viewing someone else's itinerary"

                if(displayName != null){
                  fbShareMessage = displayName+"'s SXSW 🎉";
                  displayMessage = "Viewing "+displayName+"'s itinerary";
                }

                 // Check to see if page is set to public or private, or if user visiting their own page

                var results = Band.fetchBandInfo(docs[0].rawBands, function(result){

                  var r = JSON.stringify(result);
                  // console.log("JSON result is");
                  // console.log(r);

                  if(public==true){
                    if(requestSession==userSession){
                      // If user is visiting their own page, show the delete button
                      res.render('userPage', {displayMessage:displayMessage, bands:r, canDelete:'y', public:'y', status:"public", link:link, fbShareMessage:fbShareMessage});
                    } else {
                      res.render('userPage', {displayMessage:displayMessage, bands:r, canDelete:'n', public:'y', status:"public", link:link, fbShareMessage:fbShareMessage});
                    }
                  } else if(requestSession==userSession) {
                    res.render('userPage', {displayMessage:displayMessage, bands:r, canDelete:'y', public:'n', status:"private"});
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

module.exports = router;