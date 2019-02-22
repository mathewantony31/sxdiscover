var express = require('express');
var router = express.Router();
var Band = require('../models/band.js'); // Get Show info

/* Get home page. */
router.get('/', function(req, res, next) {
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

/* Load page for a specific show ID. */
router.use('/', require('./show'));

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

// Removing /schedule and /updateSchedule route for SXD2019
/* Load a user's schedule. */ 
// router.use('/', require('./schedule'));

/* Updates the shows saved to current user's schedule */
// router.use('/', require('./updateSchedule'))

module.exports = router;