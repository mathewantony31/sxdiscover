// Route that's called to load a user's schedule

var express = require('express');
var router = express.Router();
var User = require('../models/user.js');
var Band = require('../models/band.js');
var scheduleList;

// For testing only - Remove this code once we save "savedToSchedule" for a User in the database
// scheduleList = ["3122141864708247082", "5293595573443264360","1976575785152822475","6754240347892465380", "2204820016604094268"]

router.get('/schedule/*', function(req, res){
    try{
        User.find({name: req.params[0]}, {"savedToSchedule":true}).exec(function(err, docs){
            // Uncomment the code below once we have saved shows in the database
            scheduleList = docs[0].savedToSchedule;

            if(err){
                return res.json({errors: "Error connecting to our database"});
            } else{

                Band.fetchShowInfoFromShowIds(scheduleList, function(result){

                    // Sort results by date
                    result.sort(function(a,b){

                        if(a.time=='TBD'){
                            a.time = '00:00'
                        }
                        if(b.time=='TBD'){
                            b.time = '00:00'
                        }
                        return Date.parse(a.date+" 2019 "+a.time)-Date.parse(b.date+" 2019 "+b.time);
                    })
                    console.log(result)
                    res.render('schedule', {shows:Band.parseShowData(result)})
                });
            }
        });
    } catch(e){
        console.log("Error is " + e);
        return res.send({errors: "Schedule doesn't exist"});
    }
});

module.exports = router;