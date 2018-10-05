/*
 Helpers for Server
 */
//Dependencies
var crypto = require('crypto');
var https = require('https');
var querystring = require('querystring');
var config = require('./config');
var jsutils = require('./utils');

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
};

// parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function (str) {
	try {
		var obj = JSON.parse(str);
		return obj;
	} catch(e) {
		return {}; // fallback is return an empty object
	}
};

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
};

// Send and SMS message via Twilio
helpers.sendTwilioSms = function(phone, msg, callback) {
	var maxTwilioMsgLength = 1600;
	//validate the parameters
	var UserPhone = jsutils.setString(phone, 10);
	var UserMsg = jsutils.setString(msg.substring(0,maxTwilioMsgLength), null);
	if (!UserPhone || !UserMsg) {
		callback('Missing either valid phone number or message');
		return;
	}
	// Configure the TWilio request payload
	var payload = {
		'From' : config.twilio.fromPhone,
		'To'   : '+1' + UserPhone,
		'Body' : msg
	};

	// Stringify the payload
	var stringPayload = querystring.stringify(payload);

	//Configure the request details
	var requestDetails = {
		'protocol'       : 'https:',
		'hostname'       : 'api.twilio.com',
		'method'         : 'POST',
		'path'           : '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
		'auth'           : config.twilio.accountSid + ':' + config.twilio.authToken,
		'headers'        : {
			'Content-Type'   : 'application/x-www-form-urlencoded',
			'Content-Length' : Buffer.byteLength(stringPayload)
		}		
	};

	// Instantiate the request object
	var req = https.request(requestDetails, function(res){
		// Grab the status of the sent response
		var status = res.statusCode;
		if (status == 200 || status == 201) {
			callback(false);
		} else {
		    callback('Status code returned was ' + status);
		}
	});

	// Bind to the error event so it doesn't get thrown and kill the thread
	req.on('error', function(e){
		callback(e);
	});

	// Add payload to the request
	req.write(stringPayload);

	//End the request -- which is the same as sending it off
	req.end();
};

 // Export the module
 module.exports = helpers;