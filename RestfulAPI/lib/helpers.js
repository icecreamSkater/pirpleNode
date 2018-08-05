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

// create a string of random alphanumeric characters of a given length
helpers.createRandomString = function (strLength) {
	strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
	if (!strLength) return false;

	var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
	//Start the final string
	var str = '';
	for(i = 1; i <= strLength; i++) {
		// add a random character to the string
		str += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
	}
	return str;
}

 // Export the module
 module.exports = helpers;