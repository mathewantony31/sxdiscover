// Route that's called to load a user's schedule

var express = require('express');
var router = express.Router();
var User = require('../models/user.js');
var Band = require('../models/band.js');

router.get('/schedule/*', function(req, res){
    try{
        User.find({name: req.params[0]}, {"savedToSchedule":true,"uid":true,"displayName":true}).exec(function(err, docs){
            var scheduleList=docs[0].savedToSchedule;
            var currentSessionId = req.session.id;
            var savedSessionId = docs[0].uid;
            var isOwner=false;
            var firstName=docs[0].displayName.split(" ",1)[0]

            if(currentSessionId==savedSessionId){
                isOwner = true;
            }

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
                    res.render('schedule', {shows:Band.parseShowData(result), owner:isOwner, ownerName:firstName})
                });
            }
        });
    } catch(e){
        console.log("Error is " + e);
        return res.send({errors: "Schedule doesn't exist"});
    }
});

module.exports = router;