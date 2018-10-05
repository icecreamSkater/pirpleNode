/*
 * Worker-related tasks
 */

 //Dependencies
var fs = require('fs');
var path = require('path');
var url = require('url');
var http = require('http');
var https = require('https');
var _data = require('./data');
var _logs = require('./logs');
var util = require('util');
var debug = util.debuglog('workers');
var helpers = require('./helpers');
var jsutils = require('./utils');

// Instantiate the worker object
var workers = {};

// Gather all checks and send to validator
workers.gatherAllChecks = function() {
	// Get all of the checks
	_data.list('checks', function(err, checks){
		if (err || !checks || checks.length <= 0) {
			// This is background function with no one to
			// callback to.  So log to console
			//@TODO use a more robust error logging on the back end
			debug("Error: Could not find any checks to process");
			return;
		}
		checks.forEach(function(check){
			_data.read('checks', check, function(err, originalCheckData){
				if(err || !originalCheckData) {
					debug("Error: Read error on check:" + check);
					conitnue;
				}
				// Pass the check validator			
				workers.validateCheckData(originalCheckData);				
			});
		});
	});
};

// Check the Check Data
workers.validateCheckData = function(originalCheckData){
	var allowedProtocols = ['https', 'http'];
	var allowedMethods = ['post', 'put', 'get', 'delete'];
	var allowedStates = ['up', 'down'];
	//arrayContains = function(arrayObject, containedObject)

	originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData != null ?
	originalCheckData : {};
	originalCheckData.id = jsutils.setString(originalCheckData.id, 20);
	originalCheckData.userPhone = jsutils.setString(originalCheckData.userPhone, 10);
	originalCheckData.protocol = jsutils.setString(originalCheckData.protocol, null);

	originalCheckData.method = jsutils.setString(originalCheckData.method, null);
	originalCheckData.url = jsutils.setString(originalCheckData.url, null);
	originalCheckData.successCodes = jsutils.setNonEmptyArray(originalCheckData.successCodes, null);
	originalCheckData.timeoutSeconds = jsutils.setWholeNumber(originalCheckData.timeoutSeconds, 0, 6);

	// set the keys that may not be set
	originalCheckData.state = jsutils.setString(originalCheckData.state, null);
	if (!jsutils.arrayContains(allowedStates, originalCheckData.state)) originalCheckData.state = 'down';
	originalCheckData.lastChecked = jsutils.setWholeNumber(originalCheckData.lastChecked, null, null);

	// If all checks pass, pass along the data
	if (!originalCheckData.id
		|| !originalCheckData.userPhone
		|| !originalCheckData.protocol 
		|| !jsutils.arrayContains(allowedProtocols, originalCheckData.protocol) 
		|| !originalCheckData.method 
		|| !jsutils.arrayContains(allowedMethods, originalCheckData.method)
		|| !originalCheckData.url
		|| !originalCheckData.successCodes
		|| !originalCheckData.timeoutSeconds) {
		debug("Error: Check failed validation:" + check);
		return;
	}
	workers.performCheck(originalCheckData);
};

// perform checks, send the check data and pass on to the next step
workers.performCheck = function(originalCheckData) {
	// prepare the inital check outcome
	var checkOutcome = {
		'error'        : false,
		'responseCode' : false
	};
	var outcomeSent = false;

	// Parse the hostname and path from original check data
	var parsedUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url, true);
	var hostName = parsedUrl.hostname;
	var path = parsedUrl.path; // Using path and not "pathname" because we want the query string

	// construct the requst
	var requestDetails = {
		'protocol' : originalCheckData.protocol + ':',
		'hostname' : hostName,
		'method'   : originalCheckData.method.toUpperCase(),
		'path'     : path,
		'timeout'  : originalCheckData.timeoutSeconds * 1000

	};

	// Instantiate the request object
	var _moduleToUse = originalCheckData.protocol == 'http' ? http : https;
	var req = _moduleToUse.request(requestDetails, function(res){
		checkOutcome.responseCode = res.statusCode;
		if (outcomeSent) return;
		workers.processCheckOutcome(originalCheckData, checkOutcome);
		outcomeSent = true;
	});

	// Bind to the error event so it doesn't get thrown and kill the thread
	req.on('error', function(e){
		// update the checkout and pass the data along
		checkOutcome.error = {
			'error' : true,
			'value' : e
		};
		if (outcomeSent) return;
		workers.processCheckOutcome(originalCheckData, checkOutcome);
		outcomeSent = true;
	});

	// Bind to timeout event
	req.on('timeout', function(e){
		// update the checkout and pass the data along
		checkOutcome.error = {
			'error' : true,
			'value' : 'timeout'
		};
		if (outcomeSent) return;
		workers.processCheckOutcome(originalCheckData, checkOutcome);
		outcomeSent = true;
	});

	//End the request -- which is the same as sending it off
	req.end();	
};

// Process the check outcome and process the check data as needed, thrigger an alert if needed
// include accomodation for checks never processed before
workers.processCheckOutcome = function(originalCheckData, checkOutcome) {
	// decide current state of the check
	var happiness = !checkOutcome.error;
	var state = !checkOutcome.error && checkOutcome.responseCode 
		&& jsutils.arrayContains(originalCheckData.successCodes, checkOutcome.responseCode) ?
		'up' : 'down';


	// decide whether an alert is warranted
	var alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ?
		true : false;  // @TODO  can we just set the result of the boolean before the ?

	// log the outcome of the check
	var timeOfCheck = Date.now();
	workers.log(originalCheckData,checkOutcome,state,alertWarranted,timeOfCheck);

	// update the check data
	var newCheckData = originalCheckData;
	newCheckData.state = state;
	newCheckData.lastChecked = timeOfCheck;

	_data.update('checks', newCheckData.id, newCheckData, function(err){
		if (err) {
			debug("Error trying to save check " + newCheckData.id);
			return;
		}
		if (!alertWarranted) {
			debug('Check outcome has not changed, no alert needed');
			return;
		}
		workers.alertUserToStatusChange(newCheckData);	
	});
};

// Alert User to change in their check status
workers.alertUserToStatusChange = function(newCheckData){
	var msg = 'Alert:  Your check for ' 
				+ newCheckData.method.toUpperCase() 
				+ ' ' + newCheckData.protocol
				+ '://' + newCheckData.url 
				+ ' is currently ' + newCheckData.state;
	helpers.sendTwilioSms(newCheckData.userPhone, msg, function(err){
		if (!err) {
			debug("Success: User was alerted to a status change in their check " + msg);
		} else {
			debug("Error: Could not send sms to user who had a state change:" + err);			
		}
	});
};

// log to file function
workers.log = function(originalCheckData,checkOutcome,state,alertWarranted,timeOfCheck){
	// form the log data, 
	var logData = {
		'check'   : originalCheckData,
		'outcome' : checkOutcome,
		'state'   : state,
		'alert'   : alertWarranted,
		'time'    : timeOfCheck
	};

	// convert to string
	var logString = JSON.stringify(logData);

	//Determine the name of the log file
	// We will write different logs for different checks, and will later split it up for timestamp
	var logFileName = originalCheckData.id;

	// Append to the log string to the file
	_logs.append(logFileName, logString, function(err){
		if (err){
			debug("Logging to file failed");
			return;
		}
		debug("Logging to file succeeded");
	});
};

// Timer to execute the worker-process once per minute
//@TODO take out the hard coding of the interval
workers.loop = function(){
	setInterval(function(){
		workers.gatherAllChecks();
	}, 1000 * 60);
};

// Timer to execute the log-rotation process once per day
workers.logRotationLoop = function() {
	setInterval(function(){
		workers.rotateLogs();
	}, 1000 * 60 * 60 * 24);	
};

// Rotate (aka compress) the log files
workers.rotateLogs = function() {
	//list all the non compressed log files
	_logs.list(false, function(err, logs){
		if (err || !logs || logs.length <= 0) {
			debug("Error : could not find any logs to rotate");
			return;
		}
		logs.forEach(function(logName){
			// Compress the data to a different file (rotate)
			var logId = logName.replace('.log', '');
			var newFileId = logId + '-' + Date.now();
			_logs.compress(logId, newFileId, function(err){
				if (err) {
					debug("Error compressing one of the log files", err);
					return;
				}
				//Truncate the log
				_logs.truncate(logId, function(err){
					if (err) {
						debug("Error truncating logFile");
					} else {
						debug("Success truncating logFile");
					}
				});
			});
		});
	});
};

// Init script
workers.init = function(){
	//Send to console, in yellow
	//
	console.log('\x1b[33m%s\x1b[0m', 'Background workers are running');

	//Execute all the checks immediately
	workers.gatherAllChecks();

	//Call a loop so that the checks will execute later on
	workers.loop();

	// Compress all the logs immediately
	workers.rotateLogs();

	// Call the compression loop so logs will be compressed later on
	workers.logRotationLoop();
};

// Export the module
module.exports = workers;