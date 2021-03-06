let fs = require('fs')
let getStudentProgress = require('../../modules/get-student-progress')
let getStatistics = require('../../modules/get-statistics')

exports.get = function*(request, response) {
	let user = request.user
	let __ = request.__

	if(!user) {
		response.render()
		return
	}

	let missingFields = []
	let progress = getStudentProgress(user, missingFields)

	// Uploads
	let uploads = {}
	user.uploads.forEach(function(upload) {
		uploads[upload.purpose] = true
	})

	let requiredUploads = [
		'passport',
		'passportPhoto',
		'curriculumVitae',
		'pledge',
		'diploma',
		'letterOfGuarantee'
	]

	let studentVisaRequired = (user.profile.course && user.profile.course !== '10 weeks')

	if(!studentVisaRequired)
		requiredUploads.splice(requiredUploads.indexOf('pledge'), 3)

	if(user.accessLevel === 'admin' || user.accessLevel === 'staff') {
		let students = yield db.filter('Users', user => user.accessLevel === 'student')
		let statistics = getStatistics(students)

		let pieChartData =  Object.keys(statistics.countries).map(function(country) {
			return '[\'' + country + '\', ' + statistics.countries[country] + ']'
		}).join(', ')

		let genderData = Object.keys(statistics.gender).map(function(gender) {
			return '[\'' + gender + '\', ' + statistics.gender[gender] + ']'
		}).join(', ')

		let ageData = Object.keys(statistics.ageGroups).map(function(age) {
			return '[\'' + age + '\', ' + statistics.ageGroups[age] + ']'
		}).join(', ')

		let buildDataArray = function(letName, keyName, valueName, dataString) {
			if(!dataString)
				return `var ${letName} = [['${keyName}', '${valueName}']];`

			return `var ${letName} = [['${keyName}', '${valueName}'], ` + dataString + '];'
		}

		let countryToStudents = buildDataArray('countryToStudents', __('country'), __('students'), pieChartData)
		let genderToStudents = buildDataArray('genderToStudents', __('gender'), __('students'), genderData)
		let ageToStudents = buildDataArray('ageToStudents', __('age'), __('students'), ageData)

		statistics.script = countryToStudents + genderToStudents + ageToStudents

		response.render({
			user,
			statistics,
			displayName: user.profile.givenName
		})
	} else {
		let allUploadsAvailable = requiredUploads.map(function(purpose) {
			return uploads[purpose] === true
		}).reduce(function(a, b) {
			return a && b
		})

		response.render({
			user,
			displayName: user.profile.givenName, //+ ' ' + user.familyName,
			profileCompleted: progress,
			uploads,
			requiredUploads,
			missingFields,
			studentVisaRequired: studentVisaRequired,
			readyToApply: (progress >= 100) && allUploadsAvailable
		})
	}
},

// Save application date
exports.post = function*(request, response) {
	if(!request.user) {
		response.writeHead(400)
		response.end()
		return
	}

	request.user.application = (new Date()).toISOString()
	yield db.saveUser(request.user)

	response.end()
}
