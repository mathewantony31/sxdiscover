var express = require('express');
var router = express.Router();

/* Get comingSoon page. */
router.get('/', function(req, res, next) {
  res.render('comingSoon');
});

/* Get home page. */
router.get('/secretentrypoint', function(req, res, next) {
  res.render('index');
});

/* Get about page. */
router.get('/about', function(req, res, next){
  res.render('about');
});

/* Load private user page. */
router.get('/privateUser', function(req, res, next){
  res.render('privateUser');
});

/* Load privacy policy page. */
router.get('/privacy-policy', function(req, res, next){
  res.render('privacy-policy');
});

/* Load itinerary for a specific venue. */
router.use('/', require('./venues'));

/* Spotify login and API calls. */
router.use('/', require('./spotify'));

/* Load a user's itinerary. */
router.use('/', require('./userPage'));

/* Testing Google calendar integration. */
router.use('/', require('./calendar'));

/* Toggle's user's itinerary between public and private. */
router.use('/', require('./private'));

module.exports = router;