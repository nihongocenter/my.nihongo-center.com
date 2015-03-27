"use strict";

module.exports = {
	get: function(request) {
		var user = request.user;
		
		if(typeof user === "undefined")
			return undefined;
		
		return {
			user: user,
			displayName: user.givenName + " " + user.familyName,
			age: this.getAgeByBirthday(user.birthday)
		};
	},
	
	getAgeByBirthday: function(birthday) {
		return this.getAge(new Date(birthday));
	},
	
	getAge: function(d1, d2) {
		d2 = d2 || new Date();
		var diff = d2.getTime() - d1.getTime();
		return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
	},
	
	// Post: Save to database
	post: function(request) {
		var user = request.user;
		user[request.body.key] = request.body.value;
		
		// Render
		var response = this.get(request);
		
		// Connect
		var riak = require("nodiak").getClient();
		var userBucket = riak.bucket("Accounts");
		var userObject = userBucket.objects.new(user.email, user);
		
		// Save account in database
		userObject.save(function(err, obj) {
			if(err) {
				console.error(err);
				return;
			}
			
			console.log("Saved " + obj.data.email + " to database");
		});
		
		return response;
	}
};