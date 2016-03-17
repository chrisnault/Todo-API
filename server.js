var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var PORT = process.env.PORT || 3000;
var todoNextId = 1;
var todos = [];

app.use(bodyParser.json());

app.get('/', function (req, res) {
	res.send('Todo API Root');
});

app.get('/todos', function (req, res) {
	res.json(todos);
});

app.get('/todos/:id', function (req, res) {
	var todoId = parseInt(req.params.id, 10);
	console.log("Checking id " + todoId);
	var matchedTodo;
	todos.forEach(function (todo) {
		if (todo.id === todoId) {
			matchedTodo = todo;
		}
	});

	if (matchedTodo) {
		res.json(matchedTodo);
	} else {
		res.status(404).send();		
	}
});

app.post('/todos', function (req, res) {
	try {
		var body = req.body;
		console.log(req.body);
		body.id = todoNextId++;
		todos.push(body);
		res.json(body);
	} catch (e) {
		
		console.log(e.message);
	}
});




app.listen(PORT, function () {
	console.log('Express listening on port ' + PORT + " ....");
})