/*
 Helpers for Server
 */
//Dependencies
var crypto = require('crypto');
var config = require('./config');

 // Container for all the helpers
 var helpers = {};

// Create a SHA256 hash
helpers.hash = function(str) {
	// fail if the string is not a string or is empty
	if(typeof(str) != 'string' || str.length <= 0){
		return false;
	}
	var hash = crypto.createHmac('sha256', config.hashingSecret).update	(str).digest('hex');
	return hash;
}

// parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function (str) {
	try {
		var obj = JSON.parse(str);
		return obj;
	} catch(e) {
		return {}; // fallback is return an empty object
	}
}


 // Export the module
 module.exports = helpers;