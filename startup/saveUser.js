app.db.saveUser = user => app.db.set('Users', user.email, user)