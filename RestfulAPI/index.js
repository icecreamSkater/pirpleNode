/*
    Primay File for the Restful API which is the first of 3 projects
    for the Node.js Master class offered through pirple
 */

//Dependencies
// Built in http library
// Built in https library
// Built in url library
// Built in filesystem library
// built in string decoder library
// config.js file, hard codes that file is in same directory


var servers = require('./lib/servers');
var workers = require('./lib/workers');

//Declare the app
var app = {};

//Application init function
app.init = function(){
	// start the servers
	servers.init();

	//start the workers
	workers.init();
};

// Execute
app.init();

//Export the app
module.exports = app;
