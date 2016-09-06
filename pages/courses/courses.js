exports.get = function*(request, response) {
	let user = request.user

	let students = yield db.filter('Users', user => user.accessLevel === 'student')
	let courses = {}

	students.forEach(student => {
		if(!student.application || student.stage === 'apply')
			return

		let startYear = parseInt(student.profile.startYear)
		let startMonth = parseInt(student.profile.startMonth)

		if(!courses[startYear]) {
			courses[startYear] = {
				[startMonth]: [student]
			}
		} else {
			if(courses[startYear][startMonth])
				courses[startYear][startMonth].push(student)
			else
				courses[startYear][startMonth] = [student]
		}
	})

	response.render({
		user,
		courses
	})
}
