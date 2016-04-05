module.exports = function (db) {
	return {
		requireAuthentication: function (req, res, next) {
			var token = req.get('Auth');
			console.error(token);
			db.user.findByToken(token).then(function (user) {
				req.user = user;
				next();
			}, function () {
				res.status(401).send();
			});

		}

	}
};