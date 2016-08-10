$(document).ready(function(){
	
	$(function() {
    	$("form").submit(function() { return false; });
	});

	var app = {
		dataTitle: "",
		comment: ""
	} // end of app object

	var deleteComment = {
		dataTitle: "",
		comment: ""
	}

	$('.commentSubmit').on('click',function(){
			
		app.dataTitle = ($(this).data("title"));
		console.log(app.dataTitle);
		app.comment = ($('.comment[data-title="' + app.dataTitle + '"]').val().trim());
		
		console.log(app.comment);

		// $('.comment[data-title="' + app.dataTitle + '"]').val("");

		// $('.comments[data-title="' + app.dataTitle + '"]').append(app.comment);
		//post comment
		$.ajax({
			type:'POST',
			url: "/comments",
			data: app
		}).done(function(data) {

			// console.log(data);
			
		
		}); // end of ajax post

		window.location.reload();

		return false;
	
	}); // end of commentSubmit button

	$('.delete').on('click', function() {

		deleteComment.comment = ($(this).data("comment"));
		deleteComment.dataTitle = ($(this).data("title"));
		console.log(deleteComment.comment);

		$.ajax({
			type: 'POST',
			url: "/delete",
			data: deleteComment
		}).done(function(data) {

			console.log(data);

		}); // end of ajax delete post

		window.location.reload();

	}); // end of delete click

}); // end of document.ready function

