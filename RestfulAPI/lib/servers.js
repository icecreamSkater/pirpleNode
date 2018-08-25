/*
 Servers
 */
//Dependencies
var jsutils = require('./utils');
var helpers = require('./helpers');
var url = require('url');
var handlers = require('./handlers');
var StringDecoder = require('string_decoder').StringDecoder;
var http = require('http');
var https = require('https');
var config = require('./config');
var fs = require('fs');
var path = require('path');

 // Container for all the helpers
var servers = {};

// All the server logic for both http and https
servers.unifiedServer = function(req, res) {
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
		var chosenHandler = typeof(servers.router[trimmedPath]) !== 'undefined' ?
			servers.router[trimmedPath]
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
};

// Instantiating the http server
// The server should respond to all requests with a string
servers.httpServer = http.createServer(function(req, res){
	servers.unifiedServer(req, res);
});

// Instantiating the https server
// The server should respond to all requests with a string
servers.httpsServerOptions = {
	'key' : fs.readFileSync(path.join(__dirname, '/../../https/key.pem')),
	'cert' : fs.readFileSync(path.join(__dirname, '/../../https/cert.pem'))
};

servers.httpsServer = https.createServer(servers.httpsServerOptions, function(req, res){
	servers.unifiedServer(req, res);
});

servers.init = function(){

	// Call the server function defined above on port found in our config file
	servers.httpServer.listen(config.httpPort, function(){
		var consoleString = "The server is listening on port " + 
				config.httpPort + 
				" in " + config.envName + " mode";
		console.log(consoleString);
	});

	// Call the server function defined above on port found in our config file
	servers.httpsServer.listen(config.httpsPort, function(){
		var consoleString = "The server is listening on port " + 
				config.httpsPort + 
				" in " + config.envName + " mode";
		console.log(consoleString);
	});

};

// Define a request router ( an object) that routes requests based on the path
//    for instance:  /users will go to the users handler
//    unknown requests should go to the default handler
servers.router = {
	'ping'   : handlers.ping,
	'hello'  : handlers.hello,
	'users'  : handlers.users,
	'tokens' : handlers.tokens,
	'checks' : handlers.checks
};

 // Export the module
 module.exports = servers;