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
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./lib/config');
var jsutils = require('./lib/utils');
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers');
var fs = require('fs');

// Instantiating the http server
// The server should respond to all requests with a string
var httpServer = http.createServer(function(req, res){
	unifiedServer(req, res);
});

// Instantiating the https server
// The server should respond to all requests with a string
var httpsServerOptions = {
	'key' : fs.readFileSync('../https/key.pem'),
	'cert' : fs.readFileSync('../https/cert.pem')
};

var httpsServer = https.createServer(httpsServerOptions, function(req, res){
	unifiedServer(req, res);
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

// All the server logic for both http and https
var unifiedServer = function(req, res) {
	// Get the URL and parse it with parseQueryString set to true
	var parsedUrl = url.parse(req.url, true);

	// Get the path
	var path = parsedUrl.pathname;
	var trimmedPath = jsutils.removeLeadSlash(path);

	// Get the query string as an object
	var queryStringObject = parsedUrl.query;

	// Get the http method
	var method = req.method.toLowerCase();

	// Get the headers as an object
	var headers = req.headers;

	// Get the payload, handle 'data' and 'end' events
	var decoder = new StringDecoder('utf-8');
	var buffer = ''; // create an empty buffer
	req.on('data', function(data){
		buffer += decoder.write(data);
	});
	req.on('end', function(){
		buffer += decoder.end();

		// Choose the handler this request should go to
		// first check that the path is a key in the router and choose and handler
		// then construct the data object to send to the handler
		// and route the request
		var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ?
			router[trimmedPath]
			: handlers.notFound;

		var data = {
			'trimmedPath' : trimmedPath,
			'queryStringObject' : queryStringObject,
			'method' : method,
			'headers' : headers,
			'payload' : helpers.parseJsonToObject(buffer)
		};

		chosenHandler(data, function(statusCode, payload){
			// use the status code called back by the handler or use 200 as default
			// use the payload called back by the handler or use empty object as default
			statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
			payload = typeof(payload) == 'object' ? payload : {};

			// convert the callback payload to a string because we can't send the object back
			var payloadString = JSON.stringify(payload);

			// Return the response
			// tell the recipient is it json
			// set the status code
			// add the payload to the body
			res.setHeader('Content-Type', 'application/json');
			res.writeHead(statusCode)
			res.end(payloadString); // Send the response

			// Log the response
			var responseString = 'Returning this response: ';
			console.log(responseString, statusCode, payloadString);
		});
	});	
}

// Define a request router ( an object) that routes requests based on the path
//    for instance:  /users will go to the users handler
//    unknown requests should go to the default handler
var router = {
	'ping'  : handlers.ping,
	'hello' : handlers.hello,
	'users' : handlers.users
};