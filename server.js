var express = require('express');
var bodyParser = require('body-parser');
var _ = require("underscore");
var db = require('./db.js');
var app = express();
var PORT = process.env.PORT || 3000;
var todoNextId = 1;
var todos = [];

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Todo API Root');
});

// GET /todos?completed=true&q=house
app.get('/todos', function(req, res) {

	var queryParams = req.query;
	var filteredTodos = [];
 	// db.todo.create(body).then(function (todo) {
		// res.json(todo.toJSON());
 	// }, function(e) {
 	// 	res.status(400).json(e);
 	// })
	db.todo.findAll({
		attributes: ['description', 'completed']
	}).then(function (todo) {
		filteredTodos = todo.toJSON();
	}, function (e) {
		res.status(400).json(e);
	})

	if (queryParams.hasOwnProperty('completed') && queryParams.completed.length > 0) {

		if (queryParams.completed === 'true') {
			queryParams.completed = true;
		} else {
			queryParams.completed = false;
		}

		filteredTodos = _.where(filteredTodos, {
			completed: queryParams.completed
		});
	}

	if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
		filteredTodos = _.filter(filteredTodos, function(todo) {
			return todo.description.toLowerCase().indexOf(queryParams.q.toLowerCase()) > -1;
			// if (todo.description.indexOf(queryParams.q) > 0) {
			// 	return todo;
			// }
		});
	}

	res.json(filteredTodos);
});

// GET /todos/:id
app.get('/todos/:id', function(req, res) {
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
app.post('/todos', function(req, res) {


	// use _.pick to select valid fields only
	var body = _.pick(req.body, 'description', 'completed');

	if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
		return res.status(400).send();
	}

	// update description with trimmed value
	body.description = body.description.trim();

 	db.todo.create(body).then(function (todo) {
		res.json(todo.toJSON());
 	}, function(e) {
 		res.status(400).json(e);
 	});

});


// DELETE /todos/:id
app.delete('/todos/:id', function(req, res) {

	var todoId = parseInt(req.params.id, 10);
	var matchedTodo = _.findWhere(todos, {
		id: todoId
	});

	if (!matchedTodo) {
		res.status(404).json({
			"error": "Todo not found with that id"
		});
	}
	todos = _.without(todos, matchedTodo);
	res.json(matchedTodo);

});

// PUT /todos/:id
app.put('/todos/:id', function(req, res) {

	var todoId = parseInt(req.params.id, 10);
	var body = _.pick(req.body, 'description', 'completed');
	var validAttributes = {};

	if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
		validAttributes.completed = body.completed;
	} else if (body.hasOwnProperty('completed')) {
		return res.status(400).json({
			"error": "Invalid value"
		});
	} else {
		// never provided attribute no problem
	}

	if (body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0) {
		validAttributes.description = body.description;
	} else if (body.hasOwnProperty('description')) {
		return res.status(400).json({
			"error": "Invalid value"
		});
	}

	var matchedTodo = _.findWhere(todos, {
		id: todoId
	});

	if (!matchedTodo) {
		res.status(404).json({
			"error": "Todo not found with that id"
		});
	}

	//todos = _.without(todos, matchedTodo);
	// matchedTodo was passed by ref so no need to update todos
	matchedTodo = _.extend(matchedTodo, validAttributes);
	//todos.push(matchedTodo);

	res.json(matchedTodo);

});

db.sequelize.sync().then(function () {
	app.listen(PORT, function() {
		console.log('Express listening on port ' + PORT + " ....");
	});
});

