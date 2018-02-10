var express = require('express');
var router = express.Router();

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

/* Load itinerary for a specific venue. */
router.use('/', require('./venues'));

/* Spotify login. */
router.use('/', require('./spotify'));

/* Load a user's itinerary. */
router.use('/', require('./userPage'));

/* Toggle's user's itinerary between public and private. */
router.use('/', require('./private'));

router.post('/loader', function (req, res) {
    console.log(req.body.number);
    res.send('Number submitted');
});

module.exports = router;