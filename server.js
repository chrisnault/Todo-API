// Adding this to test git branching
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

