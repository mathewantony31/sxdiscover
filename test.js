app.get('/bands', function(req, res) {

	try{
		// Find user in CustomBands database
		CustomBand.find({uid: req.session.id}).exec(function(err, docs){
			if(err){
		        res.render('404');
      		} else{
      			try{
      			  // Save bands to variable
		          var spotify = docs[0].bands;

		          // Remove duplicates
		          unique = spotify.filter(function(item, pos) {
		          return spotify.indexOf(item) == pos;
		          });

		          // Search for Spotify bands in our SX Database
		          Band.find({name: { $in: unique}}).exec(function (err2, docs2){
			          if(err2){
			          res.render('404');
			          } else {
			          res.send(docs2);
			          	}
		          });      				
      			} catch (e){
      				res.render('404');
      			}
      		}
		});
	} catch (e){
		res.render('404');
	}
};