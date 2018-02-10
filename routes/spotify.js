var express = require('express');
var router = express.Router();
var querystring = require('querystring'),
    request = require('request');


var redirect_uri;

var User = require('../models/user.js');

var isProduction = process.env.NODE_ENV === 'production';

if(!isProduction){
  redirect_uri = 'http://localhost:5000/callback';
  // Load local environment file
  require('dotenv').load();
} else {
  redirect_uri = 'http://sxdiscover.co/callback';
}

var client_id = process.env.CLIENT_ID,
    client_secret = process.env.CLIENT_SECRET;

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

  var scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative user-top-read user-library-read';

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
          userName = body.id;
          email = body.email;
          displayName = body.display_name;
        });

      // Get user's top tracks
        var options = {
          url: 'https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=50',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

      request.get(options, function(error, response, body) {
        for(var i=0; i <body.items.length; i++){
          spotifyBands.push(body.items[i].name);
          console.log(body.items.length);
          console.log(userName);
        }});

      // Get user's saved albums
      options = {
          url: 'https://api.spotify.com/v1/me/albums?offset=0&limit=50',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

      request.get(options, function(error, response, body) {
      for(var i=0; i <body.items.length; i++){
        spotifyBands.push(body.items[i].album.artists[0].name);
        console.log(body.items[i].album.artists[0].name);
      }

        if (spotifyBands.length > 0){

          for(j=0;j<spotifyBands.length;j++){
            spotifyBands[j] = spotifyBands[j].toLowerCase();
            console.log(spotifyBands[j]);
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

        res.render('placeholder', {name:userName});

        });
      }
    });
  }
});

router.get('/refresh_token', function(req, res, next) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

module.exports = router;