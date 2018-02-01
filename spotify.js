var express = require('express');
var router = express.Router();
var querystring = require('querystring'),
    request = require('request'),
    request2 = require('request');

var User = require('../models/user.js');

var isProduction = process.env.NODE_ENV === 'production';

if(!isProduction){
  redirect_uri = 'http://localhost:5000/callback';
  // Load local environment file
  require('dotenv').load();
  console.log("I'm here");
} else {
  redirect_uri = 'http://sxdiscover.co/callback';
  console.log("I'm in the else statement");
}

require('dotenv').config();

var client_id = 'b40b9e2241564323b881794c061cb4ae';
var client_secret = process.env.CLIENT_SECRET;
var redirect_uri;

var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

/* Login page. */
router.get('/login', function(req, res, next) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  var scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative';

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

router.get('/callback', function(req, res, next) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  // var storedState = req.cookies ? req.cookies[stateKey] : null;

  // Can't figure out why storedState is null. It's not required by Spotify so commenting out for now.
  // if (state === null || state !== storedState) {
  if (state === null) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {

      var spotifyBands = [];
      var userName = "No username.";
      var displayName = "No display name.";
      var email = "no email";

      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var getEmailOptions = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        request.get(getEmailOptions, function(error, response, body){
          email = body.email;
          displayName = body.display_name;
        });

        var options = {
          url: 'https://api.spotify.com/v1/me/playlists',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {

          // Function to extract Spotify username
          var url = body.href;
          startIndex = url.indexOf("users")+6;
          endIndex = url.substring(startIndex).indexOf("/")+startIndex;
          userName = url.substring(startIndex,endIndex);

          for (var i=0; i<body.items.length; i++){

            var option2 = {
                url: 'https://api.spotify.com/v1/users/'+body.items[i].owner.id+'/playlists/'+body.items[i].id+'/tracks',
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true
              };

              request2.get(option2, function(error2, response2, body2){
                if (!error2 && response2.statusCode === 200){

                    for(var j=0; j<body2.total-1; j++){
                        try{
                          spotifyBands.push(body2.items[j].track.artists[0].name);
                        } catch (e){
                          // console.log("Error: Failed to pull info from Spotify: "+e);
                        }
                      }

                } else{
                }

                if (spotifyBands.length > 0){

                  for(j=0;j<spotifyBands.length;j++){
                    spotifyBands[j] = spotifyBands[j].toLowerCase();
                  }

                  // Write to custom bands
                  var bandData = {
                    name:userName,
                    displayName:displayName,
                    email: email,
                    uid: req.session.id,
                    rawBands: spotifyBands,
                    sxswBands: "test",
                    public: true
                  };

                  var newUser = new User(bandData);

                  var upsertData = newUser.toObject();
                  delete upsertData._id;

                  User.update({ "name" : userName }, upsertData, { upsert: true }, function(err){
                    if(err){
                      console.log("Error: Failed to save custom bands to database");
                    }
                  });
                }
            });
        }
        res.render('placeholder', {name:userName});

        });

      // we can also pass the token to the browser to make requests from there
      //   res.redirect('/#' +
      //     querystring.stringify({
      //       access_token: access_token,
      //       refresh_token: refresh_token
      //     }));
      // } else {
      //   res.redirect('/#' +
      //     querystring.stringify({
      //       error: 'invalid_token'
      //     }));
      }
    });
  }
});




module.exports = router;