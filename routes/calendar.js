// Route that's called to save a show to a user's calendar

var express = require('express');
var Band = require('../models/band.js');
const fs = require('fs');
const Cryptr = require('cryptr'); // To encrypt the access token
const cryptr = new Cryptr('myTotalySecretKey');

var router = express.Router();

const isProduction = process.env.NODE_ENV === 'production';

// Variables needed to set up Google Auth
const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/calendar','https://www.googleapis.com/auth/calendar.events'];
const client_secret = process.env.GCAL_CLIENT_SECRET,
client_id = process.env.GCAL_CLIENT_ID;

var redirect_uri;
var event;
var sourceURL;

if(!isProduction){
  redirect_uri = 'http://localhost:5000/calendar-callback';
  // Load local environment file
  require('dotenv').load();
} else {
  redirect_uri = 'https://www.sxdiscover.com/calendar-callback';
}

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

router.post('/calendar', function(req, res) {

  // Ideally, we wouldn't need to recreate the event dictionary, but, for some reason, the start and end key/value pairs are not getting passed into the request body if they're in a dictionary. Hacky workaround for now is to change the value of start and end to be a string when making the POST request. I'm recreating the event dictionary with the correct formatting before making the API call.
  event = {
    'summary': decodeText(req.body.summary),
    'location': decodeText(req.body.location),
    'description': decodeText(req.body.description),
    'start': {'dateTime':req.body.start, 'timeZone':'America/Chicago'},
    'end': {'dateTime':req.body.end, 'timeZone':'America/Chicago'}
  }

  sourceURL = req.body.currentURL;

  // Check if we have a saved token
  if(req.session.access_token){
    // Token exists. Decrypt token.

    var token = req.session.access_token

    // Set credentials so we can make API calls with decrypted token.
    try{
      oAuth2Client.setCredentials(token);
    } catch(e){
      console.log("Error setting credentials: "+e)
      return res.send({"error" : "Not authenticated to Google", "status" : 403, "redirectURI":authUrl});
    }

    Band.saveToGoogleCalendar(oAuth2Client, event, function(status){
      console.log("Status IS "+status)
      if(status==false){
        console.log("Calendar event not added")
        res.send({"error" : "Calendar event not added", "status" : 500});
      } else {
        res.send({"success" : "Calendar event added successfully", "status" : 200});
        console.log("Calendar event added")
      }
    })
  } else {
    // Token variable is empty. Redirect to authenticate
    res.send({"error" : "Not authenticated to Google", "status" : 403, "redirectURI":authUrl});
  }
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
      console.log("Access token from Google is:")
      console.log(token)
      // Encrypt Google access token and save it to session in the backend. This is stored in the mySessions-2019 database in Mongo
      req.session.access_token = token

  // Save event to calendar
  Band.saveToGoogleCalendar(oAuth2Client, event)
  res.redirect(sourceURL+'?auth=true')
}
});
});

function decodeText(string){
  var decodedString = string.replace(/&amp;/g, '&');
  decodedString.replace(/&#x27;/g, '\'');
  return decodedString
}

// TODO: Encrypt access token before saving to session object
// Function that takes an access token object from Google an encrypts it so that we can save the object with the session in MongoDB. An example of an access token object looks like:
// { access_token: 'ACCESS_TOKEN',
//  scope:
//  'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
//  token_type: 'Bearer',
//  expiry_date: EXPIRY_DATE }
// function encryptGoogleAccessToken(accessToken, expiryDate){
//   return {
//     access_token: cryptr.encrypt(accessToken),
//     scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
//     token_type: 'Bearer',
//     expiry_date: expiryDate
//   }
// }

// // TODO: If the decrypt fails, force user to reauth
// function decryptGoogleAccessToken(accessTokenObject){
//   var encryptedAccessToken = accessTokenObject.access_token
//   accessTokenObject.access_token = cryptr.decrypt(encryptedAccessToken)
//   return accessTokenObject
// }

module.exports = router;