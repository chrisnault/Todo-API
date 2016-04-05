// Adding this to test git branching
var express = require('express');
var bodyParser = require('body-parser');
var _ = require("underscore");
var db = require('./db.js');
var bcrypt = require('bcrypt');
var middleware = require('./middleware.js')(db);
var app = express();
var PORT = process.env.PORT || 3000;
var todoNextId = 1;
var todos = [];

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Todo API Root');
});

// GET /todos?completed=true&q=house
app.get('/todos', middleware.requireAuthentication, function(req, res) {

	var query = req.query;
	var where = {};

	if (query.hasOwnProperty('completed') && query.completed === 'true') {
		where.completed = true;
	} else if (query.hasOwnProperty('completed') && query.completed === 'false') {
		where.completed = false;
	}

	if (query.hasOwnProperty('q') && query.q.length > 0) {
		where.description = {
			$like: '%' + query.q + '%'
		};
	}

	db.todo.findAll({where: where}).then(function (todos) {
		res.json(todos)
	}, function (e) {
		res.status(500).send();
	})

});

// GET /todos/:id
app.get('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	db.todo.findById(todoId).then(function (todo) {
		if (!!todo) {
			res.json(todo.toJSON());
		} else {
			res.status(404).json({
				'error': 'not found'
			});
		}		
	}, function (e) {
		res.status(500).send(e);
	});
});

// POST /todos
app.post('/todos', middleware.requireAuthentication, function(req, res) {


	// use _.pick to select valid fields only
	var body = _.pick(req.body, 'description', 'completed');

	if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
		return res.status(400).send();
	}

	// update description with trimmed value
	body.description = body.description.trim();

 	db.todo.create(body).then(function (todo) {
		//res.json(todo.toJSON());
		req.user.addTodo(todo).then(function () {
			return todo.reload();
		}).then(function (todo) {
			res.json(todo.toJSON());
		});
 	}, function(e) {
 		res.status(400).json(e);
 	});

});


// DELETE /todos/:id
app.delete('/todos/:id', middleware.requireAuthentication, function(req, res) {

	var todoId = parseInt(req.params.id, 10);
	var where = {};
	where.id = todoId;
	where.truncate = false;

	db.todo.destroy({
			where: {
				id: todoId
			}
		}).then( function (rows_deleted) {
			if (rows_deleted === 0) {
				res.status(404).json({
					error: "Todo not found"
				});
			} else {
				res.status(204).send();
			}			
		}, function () {
			res.status(500).send();
		});
});

// PUT /todos/:id
app.put('/todos/:id', middleware.requireAuthentication, function(req, res) {

	var todoId = parseInt(req.params.id, 10);
	var body = _.pick(req.body, 'description', 'completed');
	var attributes = {};

	if (body.hasOwnProperty('completed')) {
		attributes.completed = body.completed;
	} 

	if (body.hasOwnProperty('description')) {
		attributes.description = body.description;
	}

	db.todo.findById(todoId).then(function (todo) {
		if (todo) {
			todo.update(attributes).then(function (todo) {
		res.json(todo.toJSON());
	}, function (e) {
		res.status(400).send(e);
	});
		} else {
			res.status(404).send();
		}
	}, function () {
		res.status(500).send();
	})
});

// GET /todos?completed=true&q=house
app.get('/users', function(req, res) {

	var query = req.query;
	var where = {};

	if (query.hasOwnProperty('q') && query.q.length > 0) {
		where.email = {
			$like: '%' + query.q + '%'
		};
	}

	db.user.findAll({where: where}).then(function (users) {
		res.json(users)
	}, function (e) {
		res.status(500).send();
	})

});

// POST /users
app.post('/users', function(req, res) {

	// use _.pick to select valid fields only
	var body = _.pick(req.body, 'email', 'password');

	if (!_.isString(body.email) || body.password.trim().length === 0) {
		return res.status(400).send();
	}

	// update email with trimmed value
	body.email = body.email.trim();

 	db.user.create(body).then(function (user) {
		res.json(user.toPublicJSON());
 	}, function(e) {
 		res.status(400).json(e);
 	});
});

// PUT /users/:id
app.put('/users/:id', function(req, res) {

	var userId = parseInt(req.params.id, 10);
	var body = _.pick(req.body, 'email', 'password');
	var attributes = {};

	if (body.hasOwnProperty('email')) {
		attributes.email = body.email;
	} 

	if (body.hasOwnProperty('password')) {
		attributes.password = body.password;
	}
	db.user.findById(userId).then(function (user) {
		if (user) {
			user.update(attributes).then(function (user) {
		res.json(user.toJSON());
	}, function (e) {
		res.status(400).send(e);
	});
		} else {
			res.status(404).send();
		}
	}, function () {
		res.status(500).send();
	})
});

// POST /users/login
app.post('/users/login', function (req, res) {
	
	var body = _.pick(req.body, 'email', 'password');
	
	db.user.authenticate(body).then(function (user) {
		var token = user.generateToken('authentication');
		if (token) {
			res.header('Auth', token).status(200).json(user.toPublicJSON());	
		} else {
			res.status(401).send();
		}
	}, function () {
		res.status(401).send();
	});
});

//db.sequelize.sync().then(function () {
db.sequelize.sync({force: true}).then(function () {
	app.listen(PORT, function() {
		console.log('Express listening on port ' + PORT + " ....");
	});
});

