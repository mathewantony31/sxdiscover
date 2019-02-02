var express = require('express');
var router = express.Router();
var request = require('request');
var querystring = require('querystring')
var async = require('async');

var redirect_uri;
var username;
var displayName;
var email;
var spotifyBands = [];

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
  // Get access token from Spotify
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

    // POST request to get access token from Spotify
    request.post(authOptions, function(error, response, body){
      if (!error && response.statusCode === 200){
        var accessToken = body.access_token

        // Fetch Spotify profile info which we'll need when pulling all user-created playlists. 
        fetchSpotifyProfileInfo(accessToken).then(function(spotifyProfileInfo){
          username = spotifyProfileInfo.id;
          displayName = spotifyProfileInfo.display_name;
          email = spotifyProfileInfo.email;

          // Now that we've got the Spotify ID, fetch all Spotify artists from the user's top tracks, saved albums, and created playlists.
          fetchSpotifyArtists(spotifyProfileInfo.id, accessToken).then(function(bandList){
            // Now that we've got all Spotiy artists, fetch related artists for each one
            fetchRelatedArtistsFromSpotifyArtists(bandList, accessToken).then(function(result){
              // Now that we've got a full list of artists, create a new User object in the database with this array of bands
              console.log("Redirecting to summary page...");
              saveNewUser(username, displayName, email, req.session.id, spotifyBands, true, function(){
                res.redirect('summary?user='+username);
              })
            }, function(error){
              console.log("Error fetching related artists.")
            })
          }, function(error){
            console.log("Error running then after fetchSpotifyArtists")
          });
        }, function(error){
          res.json(error);
        })
      }
    });
  }
});

// Function that fetches all Spotify bands from top tracks, saved albums, and user-created playlists
async function fetchSpotifyArtists(spotifyId, accessToken){

  await fetchArtistsFromTopTracks(accessToken);
  await fetchArtistsFromSavedAlbums(accessToken);
  await fetchArtistsFromPlaylists(spotifyId, accessToken);

  return spotifyBands
}

function fetchArtistsFromTopTracks(accessToken){

  console.log("Fetching artists from top tracks...")

  // Get request options to get top tracks
  var options = {
    url: 'https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=50',
    headers: { 'Authorization': 'Bearer ' + accessToken },
    json: true
  };

  return new Promise(function(resolve, reject){
    var bandList = []
    request.get(options, function(error, response, body){
      if(error){
        reject(error);
        console.log("Error fetching artists from top tracks. Error is "+error);
      } else {
        for(var i=0; i <body.items.length; i++){
          spotifyBands.push({
            "name":body.items[i].name,
            "id":body.items[i].id,
            "source":"top"
          });
        }
        console.log("Success! Fetched "+body.items.length+" artists from top tracks.")
        resolve(bandList);
      }
    });
  });
}

function fetchArtistsFromSavedAlbums(accessToken){

  console.log("Fetching artists from saved albums...")

  // Get request options for saved albums
  var options = {
    url: 'https://api.spotify.com/v1/me/albums?limit=50',
    headers: { 'Authorization': 'Bearer ' + accessToken },
    json: true
  };

  return new Promise(function(resolve, reject){
    var bandList = []
    request.get(options, function(error, response, body){
      if(error){
        reject(error);
        console.log("Error fetching artists from saved albums. Error is "+error);
      } else {
        for(var i=0; i <body.items.length; i++){
          spotifyBands.push({
            "name":body.items[i].album.artists[0].name,
            "id":body.items[i].album.artists[0].id,
            "source":"album"
          });
        }
        console.log("Success! Fetched "+body.items.length+" artists from saved albums.")
        resolve(bandList);
      }
    });
  });
}

function fetchArtistsFromPlaylists(spotifyId, accessToken){
  console.log("Fetching artists from playlists...")

  var bandList = []
  var promises = []

  return new Promise(function(resolve, reject){
    fetchPlaylistIds(spotifyId, accessToken).then(function(result){
      for(var i=0;i<result.length;i++){
        promises.push(fetchArtistsFromPlaylistId(result[i], accessToken))
      }
      Promise.all(promises).then(function(data){
        for(var i=0;i<data.length;i++){
          for(var j=0;j<data[i].length;j++){
            bandList.push(data[i][j])
          }
        }
        resolve(bandList)
        console.log("Success! Fetched "+bandList.length+" artists from playlists.")
      }, function(error){
        reject(error)
      });
    });
  })
}

function fetchPlaylistIds(spotifyId, accessToken){

  // Get request options for created playlists
  var options = {
    url: 'https://api.spotify.com/v1/me/playlists?limit=50',
    headers: { 'Authorization': 'Bearer ' + accessToken },
    json: true
  };

  return new Promise(function(resolve, reject){
    request.get(options, function(error, response, body){
      if(error){
        reject(error);
        console.log("Error fetching playlist IDs. Error is "+error);
      } else {
        var listOfPlaylistIds = []
        for(var i=0; i <body.items.length; i++){
          var playlistOwner = body.items[i].owner.id;
          if(playlistOwner == spotifyId){
            listOfPlaylistIds.push(body.items[i].id);
          }
        }
        resolve(listOfPlaylistIds);
      }
    });
  });
}

function fetchArtistsFromPlaylistId(playlistId, accessToken){
  // Get request options for tracks from playlists
  var options = {
    url: 'https://api.spotify.com/v1/playlists/' + playlistId + '/tracks',
    headers: { 'Authorization': 'Bearer ' + accessToken },
    json: true
  };

  return new Promise(function(resolve, reject){
    request.get(options, function(error, response, body){
      if(error){
        reject(error);
        console.log("Error fetching artists from playlist. Error is "+error);
      } else {
        var bandList = []
        for(var i=0; i <body.items.length; i++){
          spotifyBands.push({
            "name":body.items[i].track.artists[0].name,
            "id":body.items[i].track.artists[0].id,
            "source":"playlist"
          })
        }
        resolve(bandList);
      }
    });
  });
}

function fetchSpotifyProfileInfo(accessToken){

  // Get request options for saved albums
  var options = {
    url: 'https://api.spotify.com/v1/me',
    headers: { 'Authorization': 'Bearer ' + accessToken },
    json: true
  };

  return new Promise(function(resolve, reject){
    request.get(options, function(error, response, body){
      if(error){
        reject(error);
        console.log("Error fetching Spotify ID. Error is "+error);
      } else {
        resolve(body);
      }
    });
  });
}

function fetchRelatedArtistsFromSpotifyArtists(spotifyBands, accessToken){
  console.log("Fetching related artists for "+spotifyBands.length+" bands...")
  var promises =[]
  var list = []

  // For now, just pulling related from top artists
  for(var i=0;i<spotifyBands.length;i++){
    // Get request options for related artists
    var options = {
      url: 'https://api.spotify.com/v1/artists/'+spotifyBands[i].id+'/related-artists',
      headers: { 'Authorization': 'Bearer ' + accessToken },
      json: true
    };

    var bandName = spotifyBands[i].name;

    // Add all promises to the promises array
    promises.push(new Promise(function(resolve, reject){

      // Get request to get related artist for specific artist
      request.get(options, function(error, response, body){
        var bandList = [];
        if(error){
          resolve(error);
          console.log("Error making get request to fetch related artist. Error is "+error);
        } else if(body.hasOwnProperty('error')){
          // Resolving so that Promise.all will resolve
          resolve(body.error)
          console.log("Error making get request to fetch related artist. Error is "+body.error);
        } else {
          for(var j=0; j<body.artists.length; j++){
            try{
              bandList.push({
                "name": body.artists[j].name,
                "id": body.artists[j].id,
                "source":"related",
                "relatedTo":bandName
              });
            } catch(e){
              resolve(e);
              console.log("Error! "+e)
            }
          }
          resolve(bandList);
        }
      });
    }));
  }

  return new Promise(function(resolve, reject){
    var itemsAdded = 0
    Promise.all(promises).then(function(result){
      for(var i=0;i<result.length;i++){
        for(var j=0; j<result[i].length;j++){
          spotifyBands.push(result[i][j]);
          itemsAdded += 1
        }
      }
      resolve(list);
      console.log("Success! Fetched "+itemsAdded+" related artists.")
    }, function(error){
      reject(error);
      console.log("Error fetching related artists.");
    })
  })
}

function saveNewUser(username, displayName, email, sessionId, spotifyBands, public, callback){
  // create new User object w/ band info and push to database
  var userData = {
    name:username,
    displayName:displayName,
    email: email,
    uid: sessionId,
    rawBandsFromSpotify: spotifyBands,
    public: true
  };

  var newUser = new User(userData);

  var upsertData = newUser.toObject();
  delete upsertData._id;

  User.update({ "name" : username }, upsertData, { upsert: true }, function(err, count, status){
    if(err){
      console.log("Error: Failed to save user to database");
    }
    callback();
  });
}

module.exports = router;