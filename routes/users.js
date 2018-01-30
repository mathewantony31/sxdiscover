var express = require('express');
var router = express.Router();

// // Database
// var mongo = require('mongodb');
// var mongoose = require('mongoose');
// var uri = 'mongodb://heroku_kcls9k2q:imbdonvrp323sf729s5fknfdb1@ds019058.mlab.com:19058/heroku_kcls9k2q';

// /*
//  * GET bandlist.
//  */
// router.get('/sxbandlist', function(req, res) {

//     var rawspot = req.app.get('spotifylist');

//     unique = rawspot.filter(function(item, pos) {
//     return rawspot.indexOf(item) == pos;
// 	})

// 	// mongoose.connect(uri);
// 	var db = mongoose.createConnection(uri);

// 	db.on('error', console.error.bind(console, 'connection error:'));

// 	db.once('open', function callback() {
// 	    var bandSchema = mongoose.Schema({
// 	        name: String,
// 	        date: String,
// 	        time: String,
// 	        venue: String
// 	    });

// 	    var Band = mongoose.model('bands', bandSchema);

// 	 //    Band.find({}, function (err, docs) {
// 	 //    	res.json(docs);
// 		// });

// 		Band.find({name: { $in: unique}}).exec(function (err, docs){
// 			if(err) throw err;
// 			res.json(docs);
// 		});
// 	});

//     // var collection = db.get('bands');
//     // collection.find({name: { $in: unique}},{name:1},function(e,docs){
//         // res.json(docs);
//     // });
// });

module.exports = router;

