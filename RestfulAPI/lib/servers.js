/*
 Servers
 */
//Dependencies
var jsutils = require('./utils');
var helpers = require('./helpers');
var url = require('url');
var handlers = require('./handlers');
var StringDecoder = require('string_decoder').StringDecoder;

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
	'users' : handlers.users,
	'tokens' : handlers.tokens
};

 // Export the module
 module.exports = servers;