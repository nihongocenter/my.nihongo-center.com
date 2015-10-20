"use strict";

let saveUserInDB = require("../../modules/save-user");
let dbArray = require("../../modules/db-array");
let fs = require("fs");

module.exports = {
	// Get
	get: function(request, render) {
		let user = request.user;
		let __ = request.__;
		
		let fileTypes = {
			"": __("pleaseChoose"),
			passport: __("passport"),
			passportPhoto: __("passportPhoto"),
			curriculumVitae: __("curriculumVitae"),
			letterOfGuarantee: __("letterOfGuarantee"),
			diploma: __("diploma"),
			pledge: __("pledge"),
			other: __("other")
		};
		
		// Render the page
		render({
			user: user,
			fileTypes: fileTypes
		});
	},
	
	// Post
	post: function(request, render) {
		// Delete requests
		if(typeof request.body.function !== "undefined") {
			render(this[request.body.function](request, render));
			return;
		}
		
		// File uploads
		let file = request.file;
		
		if(file && request.body.purpose) {
			file.purpose = request.body.purpose;
			file.dateTime = new Date();
			
			request.user.uploads.unshift(file);
			saveUserInDB(request.user);
		}
		
		this.get(request, render);
	},
	
	// Remove upload
	removeUpload: function(request, render) {
		var removedFile = dbArray.remove(this, request, render, "uploads");
		fs.unlink(removedFile.path, function() {
			console.log("Deleted uploaded file: " + removedFile.path);
		});
	}
};