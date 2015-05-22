"use strict";

module.exports = {
	get: function(request, render) {
		let user = request.user;
		let pageToGlyphIcon = {
			"dashboard": "dashboard",
			"profile": "user",
			"uploads": "upload",
			"stages": "list",
			"login": "home",
			"students": "book"
		};
		
		render({
			user: user,
			pageToGlyphIcon: pageToGlyphIcon
		});
	}
};