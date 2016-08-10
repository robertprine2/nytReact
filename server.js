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
var db = mongojs(/*process.env.MONGODB_URI, */"nytreact", ['articles']);

// lets us know if there is an error with the database if it doesn't turn on
db.on('error', function(err) {
	console.log('Database Error: ', err);
});

//allows html to access assets folder
app.use(express.static(process.cwd() + '/assets'));

// BodyParser interprets data sent to the server
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.text());
app.use(bodyParser.json({type: 'application/vnd.api+json'}));

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
		var link = $(this).attr('href');
		// creats a variable to store the content that is concatinated in the for each below
		var content = "";

		// scrapes and concatinates content p tags from each article adding a space inbetween p tags within an article
		$('div.entry').find('p').each(function(j, element) {
			content += (" " + $(this).text());
			
		}); // end of content scrape

		// pushes title url and content into the result array
		result.push({
			title: title,
			url: link, 
			content: content
		}); // end of push		
			


		// db.articles.find({},function (err, posts) {
		// 	// console.log(posts);
		// 	posts.forEach(function(doc, index, array) {
				
		// 		if(err) throw err;

		// 		// if the article title is already in the collection don't insert it
		// 		result.forEach(function(scrappedResult){
		// 			if (doc.title == scrappedResult.title) {
		// 				console.log("This article is already in the database.")
		// 			} // end if
		// 			// else insert the article into the collection
		// 			else {
		// 				db.articles.insert(scrappedResult);
		// 				console.log(scrappedResult);
		// 			} // end else
		// 		});
		// 	}); // end forEach

			

		// }); // end of articles.find title: thisTitle

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

					db.articles.insert(doc);
				} // end else
				
			}); // end of find titles	
		})(result[i]);

	} // end of for loop
		
		// for (var k = 1; k < result.length; k++) {

		// thisTitle = result[k].title;
		// console.log(thisTitle);
		// db.articles.find({title: thisTitle}, function (err, docs) {
			
		// 	// if there is no article with thisTitle insert the article into the collection
		// 	if (err || !docs) db.articles.insert(result[k]);
			
		// 	// else the article title is already in the collection don't insert it
		// 	else console.log("This article is already in the database.");			

		// }); // end of articles.find title: thisTitle

}); // end of request samdavidson.net

//routes
app.get('/', function(req, res) {

	db.articles.find({}, function(err, posts) {

		res.render('home', {
			layout: 'main', 
			result: posts
		}); //end of res.render

	}); // end of db.articles.find
}); // end of app.get

app.post('/comments', function(req, res) {

	var comment = req.body;
	console.log(comment);



	// update the database with the new comment
	db.articles.update({"title": comment.dataTitle}, {$addToSet: {comments: {comment: comment.comment, title: comment.dataTitle}}}, function(err, docs) {
		if (err) console.log(err);
		console.log(docs);

		

	}); // end db.articles.update()

}); // end of app.post comment

app.post('/delete', function(req, res) {
	
	// set the comment to delete details in a variable
	var deleteComment = req.body;
	console.log(deleteComment);

	// delete the comment form the database
	db.articles.update({"title": deleteComment.dataTitle}, {$pull: {comments: {comment: deleteComment.comment}}}, function(err, docs) {

		console.log(docs);

	}); // end db.articles.update()

}); // end app.post('/delete')

// port for local server to use
var PORT = process.env.PORT || 3000;

// starts the server and lets us know if it is running
app.listen(PORT, function() {
	console.log('App running on port 3000!');
});