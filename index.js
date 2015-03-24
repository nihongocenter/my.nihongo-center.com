"use strict";

var aero = require("aero");
var passport = require("passport");
var StrategyGoogle = require("passport-google-openidconnect").Strategy;

aero.events.on("initialized", function() {
	passport.use(new StrategyGoogle({
			// Well this shouldn't be on git...but it doesn't really matter.
			clientID: "142269503991-oj65drmhdreneseg4v9j25l4t4lvocrr.apps.googleusercontent.com",
			clientSecret: "QgM9AITTtrTRPA_Wb8MCVZWR",
			callbackURL: "http://localhost:3002/auth/google/callback"
		},
		function(iss, sub, profile, accessToken, refreshToken, done) {
            var user = {
                id: profile.id,
                displayName: profile.displayName
            };
			
            console.log("User logged in: " + user.displayName);
			done(null, user);
		}
	));
    
    // Serializer
    passport.serializeUser(function(user, done) {
        done(null, user);
    });
    
    // Deserializer
    passport.deserializeUser(function(user, done) {
        done(null, user);
    });
    
    aero.app.use(passport.initialize());
    aero.app.use(passport.session());

	// Redirect the user to Google for authentication.  When complete, Google
	// will redirect the user back to the application at
	//     /auth/google/return
	aero.app.get("/auth/google", passport.authenticate("google-openidconnect"));

	// Google will redirect the user to this URL after authentication.  Finish
	// the process by verifying the assertion.  If valid, the user will be
	// logged in.  Otherwise, authentication has failed.
	aero.app.get("/auth/google/callback",
		passport.authenticate("google-openidconnect", {
			failureRedirect: "/login"
		}),
		function(req, res) {
			// Successful authentication, redirect home.
			res.redirect("/");
		}
	);
});

// Start Aero
aero.start();