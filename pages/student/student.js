"use strict";

let fs = require("fs");
let S = require("string");
let age = require("../../modules/age");
let riak = require("nodiak").getClient();
let mimeTypes = require("mime-types");
let saveUserInDB = require("../../modules/save-user");
let sumOfValues = require("../../modules/sumOfValues");

// Country data
let countryData = require("country-data");
let lookup = countryData.lookup;
let currencies = countryData.currencies;
let languages = countryData.languages;

// Load file as array
let loadFileAsArray = function(filePath) {
	return fs.readFileSync(filePath, "utf8").toString().split("\n");
};

let visaEasy = loadFileAsArray("data/visa-easy-countries.txt").reduce(function(dict, value) {
	dict[value] = null;
	return dict;
}, {});

module.exports = {
	get: function(request, response) {
		let email = request.params[0];
		let __ = request.__;

		riak.bucket("Accounts").objects.get(email, function(err, obj) {
			if(err) {
				response.render();
				return;
			}

			let student = obj.data;
			student.age = age.of(student);
			student.displayName = student.givenName + " " + student.familyName;
			student.heShe = student.gender === "male" ? "He" : "She";
			student.hisHer = student.gender === "male" ? "his" : "her";
			student.heSheJp = student.gender === "male" ? "彼" : "彼女";
			student.startMonthName = __("monthNames." + parseInt(student.startMonth));

			// Create an inverted dictionary based on fileTypes
			let humanized = Object.keys(student).reduce(function(dict, key) {
				if(key)
					dict[key] = S(key).humanize().s;

				return dict;
			}, {});

			let description = "";

			if(student.age && student.maritalStatus)
				description += `${student.displayName} is ${student.age} years old and ${student.maritalStatus}. `;
			else if(student.age)
				description += `${student.displayName} is ${student.age} years old. `;
			else if(student.maritalStatus)
				description += `${student.displayName} is ${student.maritalStatus}. `;

			description += `${student.heShe} is from ${student.country} and wants to start a ${student.course} course in ${student.startMonthName} ${student.startYear}. `;

			if(student.familyMembers.length === 0)
				description += `${student.heShe} has no family members.`;
			else if(student.familyMembers.length === 1)
				description += `${S(student.hisHer).capitalize().s} only family member is ${student.familyMembers[0].name}.`;
			else
				description += `There are ${student.familyMembers.length} people in ${student.hisHer} family.`;

			student.financialSupportPerMonth.total = sumOfValues(student.financialSupportPerMonth);
			description += ` ${student.heShe} will bring ${student.financialSupportPerMonth.total} Yen per month.`;

			//let japaneseDescription = `${student.givenName}は${student.age}歳です. `;
			//japaneseDescription += `${student.heSheJp}は${student.country}住んでいて、${student.startYear}年${student.startMonth}月の${student.course}コースに入りたいです。`;

			for(let key of ["heShe", "heSheJp", "hisHer", "startMonthName"]) {
				delete student[key];
			}

			let country = null;

			if(student.country) {
				country = lookup.countries({name: student.country})[0];

				if(country) {
					country.currencies = country.currencies.map(function(currencyCode) {
						let currency = currencies[currencyCode];

						if(currency)
							return `${currency.name} (${currencyCode})`;

						return currencyCode;
					});

					country.languages = country.languages.map(function(languageCode) {
						let language = languages[languageCode];

						if(language)
							return language.name;

						return languageCode;
					});

					country.visaEasy = visaEasy[country.name] !== undefined;
				}
			}

			if(student.uploads.length > 0) {
				for(let i = 0; i < student.uploads.length; i++) {
					student.uploads[i].purposeHumanized = S(student.uploads[i].purpose).humanize().s;
				};
			}

			response.render({
				user: request.user,
				country,
				student,
				humanized,
				description,
				mimeTypes,
				translateOptions: {
					"gender": true,
					"maritalStatus": true,
					"occupationType": true,
					"education": true,
					"planAfterGraduation": true,
					"paymentMethod": true,
					"jlptLevel": true,
					"portOfEntry": true
					/*"uploads": student.uploads.map(function(upload) {
						return "<div>" + JSON.stringify(upload, null, "<br>") + "</div>";
					}),
					// TODO: Improve
					"familyMembers": student.familyMembers.map(function(member) {
						return "<div>" + JSON.stringify(member, null, "<br>") + "</div>";
					}),
					"financialSupporters": student.financialSupporters.map(function(supporter) {
						return "<div>" + JSON.stringify(supporter, null, "<br>") + "</div>";
					}),
					"japaneseEducation": student.japaneseEducation.map(function(education) {
						return "<div>" + JSON.stringify(education, null, "<br>") + "</div>";
					}),
					"financialSupportPerMonth": JSON.stringify(student.financialSupportPerMonth, null, "<br>"),
					"stage": student.stage*/
				},
				keysNotRendered: {
					"uploads": true,
					"familyMembers": true,
					"financialSupporters": true,
					"japaneseEducation": true,
					"financialSupportPerMonth": true,
					"stage": true,
					"reasonForStudying": true,
					"accessLevel": true,
					"displayName": true
				}
			});
		});
	},

	// Post: Save
	post: function(request, response) {
		if(!request.body.function) {
			response.writeHead(400)
			response.end();
			return
		}

		this[request.body.function](request, response);
	},

	// Save stage
	saveStage: function(request, response) {
		let email = request.body.email;
		let stageName = request.body.stageName;

		riak.bucket("Accounts").objects.get(email, function(err, obj) {
			if(err) {
				response.render();
				return;
			}

			let student = obj.data;
			student.stage = stageName;

			// Save in DB
			saveUserInDB(student);

			response.end()
		});
	}
};
