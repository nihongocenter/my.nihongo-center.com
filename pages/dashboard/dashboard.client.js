window.sendApplication = function(email, name) {
	var host = "https://my.nihongo-center.com";

	$.post("/_/api/apply", {
		host,
		email,
		name
	}).then(function(response) {
		$.post("/_/", {
			email: email
		}).then(function() {
			location.reload();
		});
	});
};