// Required modules
var bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    dateFunctions = require('./functions/date-functions.js'),
    express = require('express'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),


if(!isProduction){
  redirect_uri = 'http://localhost:5000/callback';
  // Load local environment file
  require('dotenv').load();
} else {
  redirect_uri = 'http://sxdiscover.co/callback';
}

// Environment variables
var uri = process.env.MONGOLAB_URI;

var router = express.Router();

// Import band and user schema
var Band = require('./models/band.js'),
    User = require('./models/user.js');

var app = express();

// Set up mongodb
mongoose.connect(uri, function (error) {
    if (error){
      console.error(error);
    }
    else{
      console.log('mongo connected');
    }
});

// Set up session store
var store = new MongoDBStore({
        uri: process.env.MONGOLAB_URI,
        collection: 'mySessions'
});

// Catch errors
store.on('error', function(error) {
  assert.ifError(error);
  assert.ok(false);
});

app.use(require('express-session')({
  secret: 'SXSpotify',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  },
  store: store,
  resave: true,
  saveUninitialized: true
}));

app.set('port', (process.env.PORT || 5000));

// Route that's called when a user connects their Spotify to SXD
app.get('/bands', function(req, res) {

  try{
    // Find user in Users database

    User.find({uid: req.session.id}).exec(function(err, docs){

      // console.log("Searching Users for user. Found the following "+docs);
      if(err){
          return res.send({errors: "Error fetching bands"});
          } else{
            try{

              // Save bands to variable
              var spotify = docs[0].rawBands;

              // Remove duplicates
              unique = spotify.filter(function(item, pos) {
              return spotify.indexOf(item) == pos;
              });

              // Search for Spotify bands in our SX Database
              Band.find({name: { $in: unique}}).exec(function (err2, docs2){

                if(err2){
                return res.send({errors: "Error fetching bands"});
                } else {

                  var sxBands = [];

                  for (var i=0; i<docs2.length; i++){
                    // console.log(docs2[i].name);
                    sxBands.push(docs2[i].name);
                  }

                  console.log(sxBands);

                   User.update({ "uid" : req.session.id }, {$set: {"sxswBands" : sxBands}}, function(err){
                      if(err){
                        console.log("Error: Failed to save SX bands to database");
                      }
                    });
                   console.log("SXSW Bands updated!");

                  res.send(docs2);
                  }
              });
            } catch (e){
              console.log("Hit this error.");
              return res.send({errors: "Error fetching bands"});
            }
          }
    });
  } catch (e){
    return res.send({errors: "Error fetching bands"});
  }
});

// Route that's called to access any public itinerary
app.get('/pages/*', function(req, res) {

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

                var results = fetchBandInfo(docs[0].rawBands, function(result){

                  var r = JSON.stringify(result);
                  console.log("JSON result is");
                  console.log(r);

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

// Route that's called to access all bands playing a particular venue
app.get('/venues/*', function(req, res) {

    try{
      Band.find({venue: { $in: req.params[0]}}).exec(function (err, docs){
        if(err){ return "Error fetching bands";
        } else {
          var displayMessage = "Bands playing at "+req.params[0];
          var fbShareMessage = "Viewing " +req.params[0]+ "'s SXSW itinerary";
          var r = JSON.stringify(docs);
          res.render('userPage', {displayMessage:displayMessage, bands:r, canDelete:'n', public:'y', status:"public", link:"", fbShareMessage:fbShareMessage});
      }
    });

  } catch (e){
    res.send(404);
  }
});

app.get('/private', function(req, res){

  // By default, set public to true
  var status = true
  var statusStr = "public";

  // Check to see user's public status
  User.find({"uid": req.session.id}).exec(function(err, docs){
    if(err){
      return res.send({errors:"Error finding profile. If issue persists, please message us on Facebook."})
    }

    status = docs[0].public;

    // Toggle status
    if (status == true){
      status = false;
      statusStr = "private"
    } else {
      status = true;
      statusStr = "public"
    }

    console.log(req.session.id);

    // Update status
    User.update({ "uid" : req.session.id }, {$set: {"public" : status}}, function(err){
    if(err){
      console.log("Error: Failed to make user private");
      return res.send({errors: "Failed to make itinerary private. If issue persists, please message us on Facebook."});
    }
      return res.send("Page is now "+statusStr+".");
    });
  });
});

function fetchBandInfo(bandList, callback){
    Band.find({name: { $in: bandList}}).exec(function (err, docs){
    if(err){
    return "Error fetching bands";
    } else {
      console.log(docs);
      callback(docs);
    }
  });
}

app.get('/refresh_token', function(req, res) {

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

// view engine setup
app.set('views', path.join(__dirname, 'views'));

// Trying handlebars
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);


// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.use('/', routes);

app.get('*', function(req, res){
  res.render('404')
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;
