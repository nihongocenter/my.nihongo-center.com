let dbArray = require('../../modules/db-array')
let fs = require('fs')
let fetch = require('request-promise')

let sendToSlack = function(url, message) {
	if(!app.production)
		return

	let data = {
		text: message
	}

	return fetch({
		method: 'POST',
		uri: url,
		body: data,
		json: true
	})
}

module.exports = {
	// Get
	get: function(request, response) {
		let user = request.user
		let __ = request.__

		let fileTypes = {
			'': __('pleaseChoose'),
			passport: __('passport'),
			passportPhoto: __('passportPhoto'),
			curriculumVitae: __('curriculumVitae'),
			letterOfGuarantee: __('letterOfGuarantee'),
			diploma: __('diploma'),
			pledge: __('pledge'),
			other: __('other')
		}

		// Render the page
		response.render({
			user: user,
			fileTypes: fileTypes
		})
	},

	// Post
	post: function*(request, response) {
		// Delete requests
		if(typeof request.body.func !== 'undefined') {
			this[request.body.func](request, response)
			return
		}

		// File uploads
		let file = request.file

		if(file && request.body.purpose) {
			file.purpose = request.body.purpose
			file.dateTime = new Date()

			request.user.uploads.unshift(file)
			yield db.saveUser(request.user)

			// Slack message
			let user = request.user
			let userLink = `<https://my.nihongo-center.com/student/${user.id}|${user.profile.givenName} ${user.profile.familyName}>`
			let message = `${userLink} uploaded _${file.purpose}_: *${file.originalname}*`

			sendToSlack(
				'https://hooks.slack.com/services/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',
				message
			)
		}

		this.get(request, response)
	},

	// Remove upload
	removeUpload: function(request, response) {
		let removedFile = dbArray.remove(this, request, response, 'uploads')

		fs.unlink(removedFile.path, function() {
			console.log('Deleted uploaded file: ' + removedFile.path)
		})
	}
}
