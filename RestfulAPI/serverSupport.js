/*
	Create and export server support functions
 */
 var videos = require('./videos');

 // Container for all the utilities
 var ja_svrSupport = {};

 ja_svrSupport.handlers = {}

// ping handler
ja_svrSupport.handlers.ping = function(data, callback) {
	// Callback a http status code, and a payload object
	callback(200);
};

// hello handler
ja_svrSupport.handlers.hello = function(data, callback) {
	// Callback a http status code, and a payload object
	callback(200, {'Recommended Video' : videos});
};

// Not found handler
ja_svrSupport.handlers.notFound = function(data, callback) {
	callback(404);
};

 // Export the module
module.exports = ja_svrSupport;