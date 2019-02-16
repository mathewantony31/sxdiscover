var express = require('express');
var router = express.Router();
var Band = require('../models/band.js'); // Get Show info

/* Get comingSoon page. */
router.get('/', function(req, res, next) {
  res.render('comingSoon');
  console.log("Getting comingsoon. Current memory usage is "+(Math.round(process.memoryUsage().heapUsed/1048576))+" MB.")
});

/* Get home page. */
router.get('/x', function(req, res, next) {
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
  console.log("Fetching privacy page. Current memory usage is "+(Math.round(process.memoryUsage().heapUsed/1048576))+" MB.")
});

/* Load page for a specific show ID. */
router.use('/', require('./show'));

/* Load itinerary for a specific venue. */
router.use('/', require('./venues'));

/* Spotify login and API calls. */
router.use('/', require('./spotify'));

/* Load a user's itinerary. */
router.use('/', require('./userPage'));

/* Load test sandbox for schedule. */
router.use('/', require('./schedule-sandbox'));

/* Load a user's schedule. */
router.use('/', require('./schedule'));

/* Testing Google calendar integration. */
router.use('/', require('./calendar'));

/* Toggle's user's itinerary between public and private. */
router.use('/', require('./private'));

module.exports = router;