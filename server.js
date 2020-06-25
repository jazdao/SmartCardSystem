const express = require('express');
const mysql = require('mysql');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();


/***** DATABASE *****/
// Create connection
const db = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '', // ENTER PASSWORD HERE
	multipleStatements: true,
	database: 'ilab'
});

// Connect with database
db.connect((err) => {
	if (err) throw err;
	console.log('\nMySQL connected...');
});

// Create database
let create_db = 'CREATE DATABASE IF NOT EXISTS ilab';
db.query(create_db, (err, result) => {
	if (err) throw err;
	// console.log(result);
	console.log('Database created...');
});


/*****  CREATE USER TABLE *****/
let create_users = `CREATE TABLE IF NOT EXISTS users(
		id 				INTEGER 		AUTO_INCREMENT PRIMARY KEY, 
		date_added 		VARCHAR(50),
		bronco_id 		VARCHAR(9) 		NOT NULL UNIQUE KEY, 
		last_name 		VARCHAR(50)		NOT NULL, 
		first_name 		VARCHAR(50) 	NOT NULL, 
		email 			NVARCHAR(255) 	NOT NULL UNIQUE KEY, 
		position 		VARCHAR(20) 	NOT NULL, 
		major 			VARCHAR(30) 	NOT NULL, 
		certifications 	VARCHAR(75)
	)`;

	// user_id INTEGER PRIMARY KEY,
	// count hours: resin printing (undecided)

db.query(create_users, (err, result) => {
	if (err) throw err;
	// console.log(result);
	console.log('User table created...');
});


/***** CREATE EQUIPMENT TABLE *****/
let create_equipment = `CREATE TABLE IF NOT EXISTS equipment(
		id 					INTEGER 		AUTO_INCREMENT PRIMARY KEY, 
		category 			VARCHAR(50), 
		name 				VARCHAR(50) 	NOT NULL, 
		equipment_condition CHAR(20),
		certification_req 	CHAR(4) 		NOT NULL, 
		location 			VARCHAR(30) 	NOT NULL, 
		status 				VARCHAR(15)
	)`;

db.query(create_equipment, (err, result) => {
	if (err) throw err;
	// console.log(result);
	console.log('Equipment table created...');
});


/***** CREATE 3D PRINTING LOG TABLE *****/
let create_log = `CREATE TABLE IF NOT EXISTS printing_log (
		id 				INTEGER 		AUTO_INCREMENT PRIMARY KEY, 
		bronco_id 		VARCHAR(9) 		NOT NULL UNIQUE KEY, 
		last_name		VARCHAR(50)		NOT NULL,
		first_name		VARCHAR(50)		NOT NULL,
		ilab		 	INTEGER,
		io		 		INTEGER,
		ms		 		INTEGER,
		last_used 		INTEGER
	)`;

db.query(create_log, (err, result) => {
	if (err) throw err;
	// console.log(result);
	console.log('Printing Log table created...\n');
});


/***** ADDING USER TO DATABASE *****/
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/submit-user', function(req, res) {
	// console.log(req.body);

	// Format 'Date Added' to XX/XX/XX
	let d = new Date();
	let date;

	if (d.getMonth() < 11) {
		date = '0' + (d.getMonth() + 1);
	}
	else {
		date = d.getMonth() + 1;
	}

	date += '/';
	
	if (d.getDate() < 10) {
		date += '0' + d.getDate();
	}
	else {
		date += d.getDate();
	}

	date += '/';

	let year = d.getFullYear().toString();
	date += year.substring(year.length - 2);
	
	// Set user position
	let position = req.body.position;
	if (req.body.other_text != '') {
		position = req.body.other_text;
	}

	// Set certifications
	let certifications = '';
	if (req.body.certifications != null) {
		for (var i = 0; i < req.body.certifications.length; i++) {
			certifications += req.body.certifications[i] + ' ';
		}
	}

	// Set database row
	let user = {
		date_added: date,
		bronco_id: req.body.bronco_id,
		last_name: req.body.last_name,
		first_name: req.body.first_name,
		email: req.body.email,
		position: position,
		major: req.body.major,
		certifications: certifications
	};

	db.query('INSERT INTO users SET ?', user, function(err, res) {
		if (err) throw err;
		console.log('\nUser successfully added to table!');
		// console.log(res);
	});

	let printing_data = {
		bronco_id: req.body.bronco_id,
		last_name: req.body.last_name,
		first_name: req.body.first_name,
		ilab: 30,
		io: 30,
		ms: 30,
		last_used: null
	};

	db.query(`INSERT INTO printing_log SET ?;`, printing_data, function(err, res) {
		if (err) throw err;
		
		console.log('\nUser successfully added to printing log!')
	});

	// res.send(JSON.stringify(req.body));
	res.redirect('/submit-user');
	res.end();
});


/***** ADDING EQUIPMENT TO DATABASE *****/
app.post('/submit-equipment', function(req, res) {
	// console.log(req.body);

	let equipment = {
		category: req.body.category,
		name: req.body.name,
		equipment_condition: req.body.condition,
		certification_req: req.body.certification,
		location: req.body.location,
		status: req.body.status,
	};

	db.query('INSERT INTO equipment SET ?', equipment, function(err, res) {
		if (err) throw err;
		
		console.log('\nEquipment successfully added to table!');
		// console.log(res);
	});

	// res.send(JSON.stringify(req.body));
	res.redirect('/submit-equipment');
	res.end();
});


/***** POPULATE USER TABLE *****/
db.query('SELECT * FROM users;', (err, result) => {
	if (err) throw err;

	let users = result;
	const user_data = JSON.stringify({users}, null, 2);

	fs.writeFile('./public/pages/users.json', user_data, err => {
		if (err) return err;
	});
});


/***** POPULATE EQUIPMENT TABLE *****/
db.query('SELECT * FROM equipment;', (err, result) => {
	if (err) throw err;
	
	let equipment = result;
	const equipment_data = JSON.stringify({equipment}, null, 2);
 
	fs.writeFile('./public/pages/equipment.json', equipment_data, err => {
		if (err) return err;
	});
});


/***** POPULATE 3D PRINTING LOG TABLE *****/
db.query('SELECT * FROM printing_log;', (err, result) => {
	if (err) throw err;
	
	let printing_log = result;
	const printing_data = JSON.stringify({printing_log}, null, 2);

	fs.writeFile('./public/pages/printing_log.json', printing_data, err => {
		if (err) return err;
	});
});


/***** EDIT USER *****/
app.post('/edit-user', function(req, res) {
	// console.log(req.body);

	// Set user position
	let position;
	if (req.body.position != 'Student' || req.body.position != 'Faculty') {
		position = req.body.other_text;
	}

	// Set certifications
	let certifications = '';
	if (req.body.certifications != null) {
		for (var i = 0; i < req.body.certifications.length; i++) {
			certifications += req.body.certifications[i] + ' ';
		}
	}

	let user = {
		bronco_id: req.body.bronco_id,
		last_name: req.body.last_name,
		first_name: req.body.first_name,
		email: req.body.email,
		position: position,
		major: req.body.major,
		certifications: certifications
	};

	db.query('UPDATE users SET ? WHERE id = ' + req.body.id + `;`, user, function(err, res) {
		if (err) throw err;
		
		console.log('\nUser successfully updated!');
		// console.log(res);
	});

	// res.send(JSON.stringify(req.body));
	res.redirect('/index.html');
	res.end();
});


/***** EDIT EQUIPMENT *****/
app.post('/edit-equipment', function(req, res) {
	let equipment = {
		category: req.body.category,
		name: req.body.name,
		equipment_condition: req.body.condition,
		certification_req: req.body.certification,
		location: req.body.location,
		status: req.body.status,
	};

	db.query('UPDATE equipment SET ? WHERE id = ' + req.body.id + `;`, equipment, function(err, res) {
		if (err) throw err;
		
		console.log('\nEquipment successfully updated!');
		// console.log(res);
	});

	// res.send(JSON.stringify(req.body));
	res.redirect('/index.html');
	res.end();
});


/***** EDIT 3D PRINTING HOURS *****/
app.post('/edit-hours', function(req, res) {
	let user = {
		ilab: req.body.ilab,
		io: req.body.io,
		ms: req.body.ms,
	};

	db.query('UPDATE printing_log SET ? WHERE id = ' + req.body.id + `;`, user, function(err, res) {
		if (err) throw err;
		console.log('\n3D printing hours successfully updated!');
		// console.log(res);
	});

	// res.send(JSON.stringify(req.body));
	res.redirect('/index.html');
	res.end();
});


/***** DELETE ENTRY *****/
app.post('/delete', function(req, res) {
	if (req.body.table == 'users') {
		db.query(`DELETE FROM printing_log WHERE id = ` + req.body.id, function(err, result) {
			if (err) throw err;
		});
	};

	db.query(`DELETE FROM ` + req.body.table + ` WHERE id = ` + req.body.id, function(err, result) {
		if (err) throw err;
		console.log('\nEntry successfully deleted!');
	})
	res.end();
});


/***** SEARCH OVERVIEW *****/
app.post('/search-overview', function(req, res) {
	console.log(req.body);

	let sql = `SELECT * FROM equipment`;
	let where = ` WHERE `;
	let and = ` AND `;
	let end = `;`;
	let location = `location='` + req.body.location + `'`;
	let category = `category='` + req.body.category + `'`;
	let name = `LOWER(name='` + req.body.name.toLowerCase() + `')`;

	// category, location, and name left blank
	if (req.body.location === undefined && req.body.category === undefined && req.body.name === undefined) 
		sql += end;
	// category, location, and name filled
	if (req.body.location !== undefined && req.body.category !== undefined && req.body.name !== undefined)
		sql += where + location + and + category + and + name + end;
	// category filled, location and name left blank
	if (req.body.category !== undefined && req.body.location === undefined && req.body.name === undefined)
		sql += where + category + end;
	// location filled, category and name left blank
	if (req.body.location !== undefined && req.body.category === undefined && req.body.name === undefined)
		sql += where + location + end;
	// name filled, category and location left blank
	if (req.body.name !== undefined && req.body.category === undefined && req.body.location === undefined)
		sql += where + name + end;
	// category and location filled, name left blank
	if (req.body.category !== undefined && req.body.location !== undefined && req.body.name === undefined)
		sql += where + category + and + location + end;
	// location and name filled, category left blank
	if (req.body.location !== undefined && req.body.name !== undefined && req.body.category === undefined)
		sql += where + location + and + name + end;
	// category and name filled, location left blank
	if (req.body.category !== undefined && req.body.name !== undefined && req.body.location === undefined)
		sql += where + category + and + name + end;


	db.query(sql, function(err, res) {
		if (err) throw err;
		
		console.log(`\nSearch query successful. Returned ` + res.length + ` result(s).`);
		console.log(res);
	});

	// res.send(JSON.stringify(req.body));
	res.redirect('/index.html#overview');
	res.end();
});


/***** SEARCH USER *****/
app.post('/search-user', function(req, res) {
	console.log(req.body);

	let query = req.body.query;

	let sql = `SELECT * FROM users;`;

	if (req.body.query !== "")
		sql = `SELECT * FROM users WHERE LOWER(email='` + query + `') OR LOWER(bronco_id='` + query + `') OR LOWER(last_name='` + query + `') OR LOWER(first_name='` + query + `');`

	db.query(sql, function(err, res) {
		if (err) throw err;
		let users = res;
		
		console.log(`\nSearch query successful. Returned ` + res.length + ` result(s).`);
		const user_data = JSON.stringify({users}, null, 2);

		fs.writeFile('./public/pages/users.json', user_data, err => {
			if (err) return err;
		});

		// console.log(res);
	});

	// res.send(JSON.stringify(req.body));
	res.redirect('/index.html#users');
	res.end();
});


/***** SEARCH EQUIPMENT *****/
app.post('/search-equipment', function(req, res) {
	console.log(req.body);

	let sql = `SELECT * FROM equipment`;
	let where = ` WHERE `;
	let and = ` AND `;
	let end = `;`;
	let location = `location='` + req.body.location + `'`;
	let category = `category='` + req.body.category + `'`;
	let name = `LOWER(name='` + req.body.name + `')`;

	// category, location, and name left blank
	if (req.body.location === undefined && req.body.category === undefined && req.body.name === undefined) 
		sql += end;
	// category, location, and name filled
	if (req.body.location !== undefined && req.body.category !== undefined && req.body.name !== undefined)
		sql += where + location + and + category + and + name + end;
	// category filled, location and name left blank
	if (req.body.category !== undefined && req.body.location === undefined && req.body.name === undefined)
		sql += where + category + end;
	// location filled, category and name left blank
	if (req.body.location !== undefined && req.body.category === undefined && req.body.name === undefined)
		sql += where + location + end;
	// name filled, category and location left blank
	if (req.body.name !== undefined && req.body.category === undefined && req.body.location === undefined)
		sql += where + name + end;
	// category and location filled, name left blank
	if (req.body.category !== undefined && req.body.location !== undefined && req.body.name === undefined)
		sql += where + category + and + location + end;
	// location and name filled, category left blank
	if (req.body.location !== undefined && req.body.name !== undefined && req.body.category === undefined)
		sql += where + location + and + name + end;
	// category and name filled, location left blank
	if (req.body.category !== undefined && req.body.name !== undefined && req.body.location === undefined)
		sql += where + category + and + name + end;

	console.log(sql);

	db.query(sql, function(err, res) {
		if (err) throw err;
		let equipment = res;
		
		console.log(`\nSearch query successful. Returned ` + res.length + ` result(s).`);
		const equipment_data = JSON.stringify({equipment}, null, 2);

		fs.writeFile('./public/pages/equipment.json', equipment_data, err => {
			if (err) return err;
		});

		// console.log(res);
	});

	// res.send(JSON.stringify(req.body));
	res.redirect('/index.html#equipment');
	res.end();
});


/***** SERVE FILES *****/
// Serve static files at Port 3000
const port = 3000;

app.use('/', express.static('public'));
app.use('/', express.static('public/pages'));
app.use('/', express.static('public/css'));
app.use('/', express.static('public/images'));

app.get('/add-user', (req, res) => {
	res.sendFile(path.resolve(__dirname, 'pages/add-user.html'));
});

app.get('/add-equipment', (req, res) => {
	res.sendFile(path.resolve(__dirname, 'pages/add-equipment.html'));
});

app.get('/submit-user', (req, res) => {
	res.sendFile(path.resolve(__dirname, 'public/pages/submit-user.html'));
});

app.get('/submit-equipment', (req, res) => {
	res.sendFile(path.resolve(__dirname, 'public/pages/submit-equipment.html'));
});

app.get('/edit-user', (req, res) => {
	res.sendFile(path.resolve(__dirname, 'public/pages/edit-user.html'));
});

app.get('/edit-equipment', (req, res) => {
	res.sendFile(path.resolve(__dirname, 'public/pages/edit-equipment.html'));
});

app.get('/edit-hours', (req, res) => {
	res.sendFile(path.resolve(__dirname, 'public/pages/edit-hours.html'));
});


app.listen(port, () => console.log(`Listening on port ${port}.`));