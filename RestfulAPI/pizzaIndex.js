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


var servers = require('./lib/servers');
var workers = require('./lib/workers');
//temporarily
var helpers = require('./lib/helpers');
var testdata = require('./.data/testdata');

//Declare the app
var app = {};

//Application init function
app.init = function(){
	// start the servers
	servers.init();

//	helpers.sendMailgunEmail('janeen@janglya.com', 'receipt, but this message will be ignored', function(err){
//		if (!err) {
//			console.log("Success: !!!!");
//		} else {
//			console.log("Error: Could not send email:" + err);			
//		}
//	});

	helpers.sendStripePayment('tok_visa', 45.37, 'janeen@janglya.com', 'Large Cheese', function(err){
		if (!err) {
			console.log("Success: !!!!");
		} else {
			console.log("Error: Could process payment:" + err);			
		}
	});
};

// Execute
app.init();

//Export the app
module.exports = app;
