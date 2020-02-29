var express = require('express');
var router = express.Router();
var querystring = require('querystring'),
request = require('request');
var async = require('async');


var redirect_uri;

var User = require('../models/user.js');

var isProduction = process.env.NODE_ENV === 'production';

if(!isProduction){
  redirect_uri = 'http://localhost:5000/callback';
  // Load local environment file
  require('dotenv').load();
} else {
  console.log("Redirect URI is "+redirect_uri)
  redirect_uri = 'https://www.sxdiscover.com/callback';
}

var client_id = process.env.CLIENT_ID,
client_secret = process.env.CLIENT_SECRET;

var generateRandomString = function(length){
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

/* Login page. */
router.get('/login', function(req, res, next){
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

/***********
  Spotify hits the /callback endpoint once a user has successfully authorized.
  The req includes a code that we include in a POST request to get an
  access token so we can make our API calls.
  The purpose of this route is to fetch all Spotify bands for a user
  (based on their top tracks, saved albums, and related artists)
  and push a new User object to the database including that info.
  ***********/
  router.get('/callback', function(req, res, next){

    var code = req.query.code || null;
    var state = req.query.state || null;

    if (state === null){
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

      // start collecting user data from Spotify
      // store in array spotifyBands
      request.post(authOptions, function(error, response, body){

        var spotifyBands = [];
        var userName = "No username.";
        var displayName = "No display name.";
        var email = "no email";
        var bandName = "";

        if (!error && response.statusCode === 200){

          var access_token = body.access_token,
          refresh_token = body.refresh_token;

          var getEmailOptions = {
            url: 'https://api.spotify.com/v1/me',
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true
          };

          request.get(getEmailOptions, function(error, response, body){
            try{
              userName = body.id;
              email = body.email;
              displayName = body.display_name;
            } catch(e){
              return res.send({"error":"Error fetching data from Spotify. If this persists, please email us at sxdiscovermusic@gmail.com"})
            }

          // Info required to get user's top tracks
          var topTracksOptions = {
            url: 'https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=50',
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true
          };

          // Call to get top tracks
          request.get(topTracksOptions, function(topError, topResponse, topBody){
            for(var i=0; i <topBody.items.length; i++){
              try{
                bandName = topBody.items[i].name;
                bandId = topBody.items[i].id;
                spotifyBands.push({
                  "name": bandName,
                  "source":"top",
                  "id":bandId});
                console.log("Bandname: " + bandName + " - source: top");
              } catch(e){
                console.log("Error fetching top artists from Spotify")
              }
            }

            // Info required to get user's saved albums
            var savedAlbumOptions = {
              url: 'https://api.spotify.com/v1/me/albums?limit=50',
              headers: { 'Authorization': 'Bearer ' + access_token },
              json: true
            };   

            // Call to get saved albums
            request.get(savedAlbumOptions, function(savedError, savedResponse, savedBody){
              for(var i=0; i <savedBody.items.length; i++){

                try{
                  // we're assuming that all albums have only 1 artist which is def not true
                  bandName = savedBody.items[i].album.artists[0].name;
                  bandId = savedBody.items[i].album.artists[0].id;
                  spotifyBands.push({
                    "name": bandName,
                    "source":"saved",
                    "id":bandId});
                  console.log("Bandname: " + bandName + " - source: saved");
                } catch(e){
                  console.log("Error fetching saved artists from Spotify")
                }
              }

              var bandsForAsyncLoop = spotifyBands

            // Get related artists: https://api.spotify.com/v1/artists/{id}/related-artists
            async.each(bandsForAsyncLoop, function(band, callback){
              var options = {
                url: 'https://api.spotify.com/v1/artists/'+band.id+'/related-artists',
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true};

                request.get(options, function(error, response, body){

                  try{
                    for(var j=0; j<body.artists.length; j++){
                      var bandName = body.artists[j].name;
                      spotifyBands.push({
                        "name": bandName,
                        "source":"related",
                        "relatedTo":band.name});
                    }
                    console.log("Bandname: " + bandName + " - source: related (" + band.name + ")");
                    callback();
                  }
                  catch(e){
                    console.log("Error is "+e+". Band is "+band.name);
                    callback();
                  }
                })
              }, function(err){
                if(err){
                  console.log("Error with fetching related artist")
                  throw err;
                }
                console.log("Related artists pulled for all bands.")

                // create new User object w/ band info and push to database
                var userData = {
                  name:userName,
                  displayName:displayName,
                  email: email,
                  uid: req.session.id,
                  rawBandsFromSpotify: spotifyBands,
                  public: true
                };

                var newUser = new User(userData);

                var upsertData = newUser.toObject();
                delete upsertData._id;

                User.update({ "name" : userName }, upsertData, { upsert: true }, function(err, count, status){
                  console.log("Status of write operation was: "+status)
                  if(err){
                    console.log("Error: Failed to save custom bands to database");
                  }
                });

                res.redirect('summary?user='+userName);
              })
          }); // Saved album. Closing line 148.
          }); // Top artists. Closing line 125.
        }); // Email options. Closing line 108.
      // Closing if statement in line 97.
      } else{
       // Status isn't 200 and error exists
       return res.send({"error":"Error fetching data from Spotify. Please try again and if this persists, please email us at sxdiscovermusic@gmail.com"})
      }
});
}
});

module.exports = router;