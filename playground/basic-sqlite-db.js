var Sequelize = require('sequelize');
var sequelize = new Sequelize(undefined, undefined, undefined,{
	'dialect': 'sqlite',
	'storage': __dirname + '/basic-sqlite-db.sqlite'
});

var Todo = sequelize.define('todo', {
	description: {
		type: Sequelize.STRING,
		allowNull: false,
		validate: {
			len: [1, 250]
		}
	},
	completed: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false
	}
});

var User = sequelize.define('user', {
	email: Sequelize.STRING
});

// creates all kinds of sequelize magic!!
// allows user.getTodos() *adds get to uppercase Modelname of child table
Todo.belongsTo(User);
User.hasMany(Todo);

var where = {};
where.completed = false;

sequelize.sync(
//	{force: true}
).then(function () {
	console.log('Synced ...');

	// User.create({
	// 	email: 'chris@gmail.com'
	// }).then(function () {
	// 	return Todo.create({
	// 		description: "Cleand the yard"
	// 	});
	// }).then(function (todo) {
	// 	return User.findById(1).then(function (user) {
	// 		user.addTodo(todo);
	// 	});
	// });

	User.findById(1).then(function (user) {
		user.getTodos({where: where}).then(function (todos) {
			todos.forEach(function (todo) {
				console.log(todo.toJSON());
			})
		})
	})

});



