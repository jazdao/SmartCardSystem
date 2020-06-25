var mysql = require('mysql');
var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var con = mysql.createConnection({
	host: "localhost",
	user: "ilab",
	password: "iLab2015.",
	database: "ilab"
});

app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname + '../add-user.html'));
});

app.post('/submit_user', function(req, res) {
	var bronco_id = req.body.bronco_id;
	var last_name = req.body.last_name;
	var first_name = req.body.first_name;
	var email = req.body.email;
	var position = req.body.position;

	res.write('You sent the Bronco ID "' + req.body.bronco_id'".\n');
	res.write('You sent the last name "' + req.body.last_name'".\n');
	res.write('You sent the first name "' + req.body.first_name'".\n');
	res.write('You sent the e-mail "' + req.body.email'".\n');
	res.write('You sent the position "' + req.body.position'".\n');

	con.connect(function(err) {
		if (err) throw err;
		console.log("Connected!");

		// Add a user to table 'user'
		var sql = "INSERT INTO users (bronco_id, last_name, first_name, email, position) VALUES ();";

		con.query(sql, function(err, result) {
			if (err) throw err;
			console.log("1 record inserted, ID: " + result.insertId);
			res.end();
		});
	});
});

