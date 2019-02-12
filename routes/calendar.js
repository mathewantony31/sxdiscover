// Route that's called to save a show to a user's calendar

var express = require('express');
var Band = require('../models/band.js');
const fs = require('fs');

var router = express.Router();

const isProduction = process.env.NODE_ENV === 'production';

// Variables needed to set up Google Auth
const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/calendar','https://www.googleapis.com/auth/calendar.events'];
const client_secret = process.env.GCAL_CLIENT_SECRET,
client_id = process.env.GCAL_CLIENT_ID;

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

var redirect_uri;
var event;

if(!isProduction){
  redirect_uri = 'http://localhost:5000/calendar-callback';
  // Load local environment file
  require('dotenv').load();
} else {
  redirect_uri = 'http://sxdiscover.co/calendar-callback';
}

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

router.post('/calendar', function(req, res) {

  // Ideally, we wouldn't need to recreate the event dictionary, but, for some reason, the start and end key/value pairs are not getting passed into the request body if they're in a dictionary. Hacky workaround for now is to change the value of start and end to be a string when making the POST request. I'm recreating the event dictionary with the correct formatting before making the API call.
  event = {
    'summary': req.body.summary,
    'location': req.body.location,
    'description': req.body.description,
    'start': {'dateTime':req.body.start, 'timeZone':'America/Chicago'},
    'end': {'dateTime':req.body.end, 'timeZone':'America/Chicago'}
  }

  // Check if we previously stored a token
  fs.readFile(TOKEN_PATH, (err, token) => {
    if(err){
      // No previous token. Redirect to authURL to get code
      res.send({"error" : "Not authenticated to Google", "status" : 403, "redirectURI":authUrl});
    } else {
      // Token exists. Set credentials so we can make API calls.
      oAuth2Client.setCredentials(JSON.parse(token));
      Band.saveToGoogleCalendar(oAuth2Client, event, function(status){
        console.log("Status IS "+status)
        if(status==false){
          res.send({"error" : "Calendar event not added", "status" : 500});
        } else {
          res.send({"success" : "Calendar event added successfully", "status" : 200});
        }
      })
    }
  })
});

// After successfully signing in to Google, you're redirected back to this route.
router.get('/calendar-callback', function(req, res, next) {

  // Google Auth adds the code as a URL parameter, e.g. "/calendar-callback?code={authorizationCode}". We can access URL parameters by using the built-in req.query 
  var code = req.query.code

  // Send code to get access token
  oAuth2Client.getToken(code, (err, token) => {

    if(err){
      console.error('Error retrieving access token', err);
    } else {
      oAuth2Client.setCredentials(token);

  // Store the token to disk for later program executions
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) console.error(err);
    console.log('Token stored to', TOKEN_PATH);
  });

  // Save event to calendar
  Band.saveToGoogleCalendar(oAuth2Client, event)
}
});
});

module.exports = router;