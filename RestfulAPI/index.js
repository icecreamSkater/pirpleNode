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

var http = require('http');
var https = require('https');
var config = require('./lib/config');
var servers = require('./lib/servers');
var fs = require('fs');

// Instantiating the http server
// The server should respond to all requests with a string
var httpServer = http.createServer(function(req, res){
	servers.unifiedServer(req, res);
});

// Instantiating the https server
// The server should respond to all requests with a string
var httpsServerOptions = {
	'key' : fs.readFileSync('../https/key.pem'),
	'cert' : fs.readFileSync('../https/cert.pem')
};

var httpsServer = https.createServer(httpsServerOptions, function(req, res){
	servers.unifiedServer(req, res);
});

// Call the server function defined above on port found in our config file
httpServer.listen(config.httpPort, function(){
	var consoleString = "The server is listening on port " + 
			config.httpPort + 
			" in " + config.envName + " mode";
	console.log(consoleString);
});

// Call the server function defined above on port found in our config file
httpsServer.listen(config.httpsPort, function(){
	var consoleString = "The server is listening on port " + 
			config.httpsPort + 
			" in " + config.envName + " mode";
	console.log(consoleString);
});
