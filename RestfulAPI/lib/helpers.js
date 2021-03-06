/*
 Helpers for Server
 */
/***************************************
	Dependencies
***************************************/
//modules within node
var crypto      = require('crypto');
var https       = require('https');
var querystring = require('querystring');

//modules written for this project
var config  = require('./config');
var jsutils = require('./utils');

//modules from third parties
var stripe  = require('stripe')(config.stripe.secret);

/***************************************
	Helpers Container
		helpers.hash - creates a SHA256 hash using the hashing secret in the config module
		helpers.parseJsonToObject - parse a JSON string to an object, fall back to an new empty object on error
		helpers.createRandomString - create a random string of specified length, from lower case letters and numerals
		helpers.sendTwilioSms - send a specified message to a specified phone number using Twilio
		helpers.sendMailgunEmail - send a specified message to a specified email address using mailgun
		helpers.sendStripePayment - make a specified charge to a tokenized card using Stripe, if successful send specified email
***************************************/
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

// Send an mail message via mailGun
helpers.sendMailgunEmail = function(emailAddr, emailMsg, callback) {

	//validate the parameters
	var UserEmailAddr = jsutils.setString(emailAddr, null);
	var UserEmailMsg = jsutils.setString(emailMsg, null);
	if (!UserEmailAddr || !UserEmailMsg) {
		callback('Missing either valid email address or receipt');
		return;
	}

		// Configure the mailGun request payload
	var payload = {
		'from'   : config.mailGun.from,
		'to'   : UserEmailAddr,
		'subject'   : 'Test',
		'text' : UserEmailMsg
	};

	// Stringify the payload
	var stringPayload = querystring.stringify(payload);

	//Configure the request details
	var requestDetails = {
		'protocol'       : 'https:',
		'hostname'       : 'api.mailgun.net',
		'method'         : 'POST',
		'path'           : '/v3/' + config.mailGun.url,
		'auth'           : 'api:' + config.mailGun.apiKey,
		'headers'        : {
			'Content-Type'   : 'application/x-www-form-urlencoded'
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
}

// Send a payment via stripe
helpers.sendStripePayment = function(chrgToken, chrgAmount, emailAddr, orderString, callback) {
	//validate the parameters
	var token = jsutils.setString(chrgToken, null);
	var orderAmt = (!chrgAmount || typeof(chrgAmount) != 'number') ? false : chrgAmount;
	var orderEmail = jsutils.setString(emailAddr, null);
	var order = jsutils.setString(orderString, null);

	if (!token || !orderAmt  || !orderEmail) {
		callback('Missing email Address or Order Amount or Charge Token');
		return;
	}
	orderAmt = (orderAmt * 100).toFixed(0);

	const charge = stripe.charges.create({
	  'amount'        : orderAmt,
	  'currency'      : config.stripe.currency,
	  'source'        : token,
	  'receipt_email' : 'jenny.rosen@example.com',
	});

	charge.then(
		function(chargeResult){
			// TODO send the receipt email
			var receipt = 'Thank you for your order, it is on its way!\n' + order + '\n$' + chrgAmount;
			helpers.sendMailgunEmail(orderEmail, receipt, function(err){
				if (err) {
					callback('Mailgun failed to send receipt');
				}
			});
			callback(false);
		}
		,function(err){
			callback('Stripe charge failed');
		}
	);	
}

/***************************************
	Exports
		- helpers
***************************************/
 module.exports = helpers;