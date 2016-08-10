//requiring needed packages for website
var cheerio = require('cheerio');
var request = require('request');
var bodyParser = require('body-parser');
var express = require('express');
var app = express();
var logger = require('morgan');


//requiring and setting up mongo database/collections
var mongojs = require('mongojs');
var databaseUrl = "nytreact";
var collections = ["articles"];

//MONGODB_URI: mongodb://heroku_6c11zjj8:9gl21imkkrpqsefq9ctd01n60s@ds139645.mlab.com:39645/heroku_6c11zjj8
// 'scrape', ['articles', 'comments'] (other info for non heroku use)

// creates a databse in mongo called scrape with two collections: articles and comments
var db = mongojs(/*process.env.MONGODB_URI, */databaseUrl, collections);

// lets us know if there is an error with the database if it doesn't turn on
db.on('error', function(err) {
	console.log('Database Error: ', err);
});

//allows html to access assets folder
app.use(express.static(process.cwd() + '/assets'));

// BodyParser interprets data sent to the server
app.use(logger('dv'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.text());
app.use(bodyParser.json({type: 'application/vnd.api+json'}));




//*************



// requesting the html of samdavidson.net/blog
request("http://www.nytimes.com/", function (error, response, html) {
	// stop working if there is an error
	if (error) throw error;

	// load the html to cheerio
	var $ = cheerio.load(html);
	
	// array where information will be placed
	var result = [];

	// scrapes h1 a tags for titles and urls of articles
	$('h2').find('a').each(function(i, element) {
		
		// grabs the text in the a tag within the h2 tag (title)
		var title = $(this).text();
		// grabs the href attribute of the a tag within the h2 tag (url)
		var date = Date.now();
		// creats a variable to store the content that is concatinated in the for each below
		var content = "";

		// scrapes and concatinates content p tags from each article adding a space inbetween p tags within an article
		$('p.summary').each(function(j, element) {
			content += (" " + $(this).text());
			
		}); // end of content scrape

		// pushes title url and content into the result array
		result.push({
			title: title,
			date: date, 
			content: content
		}); // end of push		

	}); // end of title and url scrape

	for (var i = 0; i < result.length; i++) {

		(function(doc) {
			db.articles.find({title: doc.title}, function(err, posts) {
								
				console.log(err)
				if (posts.length > 0) {
					console.log("This article is already in the database.")
				} // end if
				// else insert the article into the collection
				else {
					console.log(doc);
					db.articles.insert(doc);
				} // end else
				
			}); // end of find titles	
		})(result[i]);

	} // end of for loop

}); // end of request samdavidson.net


//****************************



//routes

// main route to react webpage
app.get('/', function(req, res) {

	res.sendFile('./assets/index.html');

}); // end of app.get /

// incoming data from database

app.get('/api/', function(req, res) {

}); // end of api get request

// post new data to database
app.post('/api/', function(req, res) {

	var article = req.body;

	console.log(article);

	db.articles.insert(article, function(err) {
		if (err) throw err;

	}); // end of insert article

}); // end of app.post api

// delete article from database

app.delete('/api/', function(req, res) {

	var article = req.body;

	db.articles.update({$pull: {"title": article.title}}, function(err, docs) {

		console.log(docs);

	}); // end db.articles.update()

}); // end of app.delete /api/

// port for local server to use
var PORT = process.env.PORT || 3000;

// starts the server and lets us know if it is running
app.listen(PORT, function() {
	console.log('App running on port 3000!');
});