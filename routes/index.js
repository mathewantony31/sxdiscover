var express = require('express');
var router = express.Router();

/* Get home page. */
router.get('/', function(req, res, next) {
  res.render('index.html');
});

/* Get about page. */
router.get('/about', function(req, res, next){
  res.render('about');
});

/* Get personal itinerary page. */
router.get('/my-sx', function(req, res, next){
  res.render('loader');
});

/* Load private user page. */
router.get('/privateUser', function(req, res, next){
  res.render('privateUser');
});

/* Spotify login. */
router.use('/', require('./spotify'));

router.post('/loader', function (req, res) {
    console.log(req.body.number);
    res.send('Number submitted');
});

module.exports = router;