// Required modules
var bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    express = require('express'),
    favicon = require('serve-favicon'),
    hbs = require('hbs'),
    logger = require('morgan'),
    path = require('path'), 
    session = require('express-session'),
    MongoDBStore = require('connect-mongodb-session')(session),
    mongo = require('mongodb'),
    mongoose = require('mongoose');

var isProduction = process.env.NODE_ENV === 'production';

if(!isProduction){
  // Load local environment file
  require('dotenv').load();
}

// Environment variables
var uri = process.env.MONGOLAB_URI;

var router = express.Router();
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('hbs').__express);
app.set('view engine', 'html');

require('datejs');

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

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.use('/', require('./routes/index'));

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