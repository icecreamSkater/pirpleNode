/*
	Create and export server handler functions
 */
 var videos = require('./videos');
 var _data = require('./data');
 var helpers = require('./helpers');
 var jsutils = require('./utils');
 var config = require('./config');

// Containers for token handler private objects and functions
handlers = {};
handlers._users = {};
handlers._tokens = {};
handlers._common = {};
handlers._checks = {};

// ping handler
handlers.ping = function(data, callback) {
	// Callback a http status code, and a payload object
	callback(200);
};

// hello handler
handlers.hello = function(data, callback) {
	// Callback a http status code, and a payload object
	callback(200, {'Recommended Video' : videos.getVideo()});
};

// users handler
handlers.users = function(data, callback) {
	// acceptable methods
	var acceptableMethods = ['post','get','put','delete']; // CRUD only, no Head or patch
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._users[data.method](data, callback);
	} else {
		callback(405); // method not allowed
	}
};

// token handler
handlers.tokens = function(data, callback) {
	// acceptable methods
	var acceptableMethods = ['post','get','put','delete']; // CRUD only, no Head or patch
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._tokens[data.method](data, callback);
	} else {
		callback(405); // method not allowed
	}
};

// checks handler
handlers.checks = function(data, callback) {
	// acceptable methods
	var acceptableMethods = ['post','get','put','delete']; // CRUD only, no Head or patch
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._checks[data.method](data, callback);
	} else {
		callback(405); // method not allowed
	}
};

// Not found handler
handlers.notFound = function(data, callback) {
	callback(404);
};

// Containers for handler private objects and functions
// users private methods

// Verify that a given token id is currently valid for a given user
handlers._common.verifyToken = function(id, phone, callback) {
	//look up the token
	_data.read('tokens', id, function(err, tokenData){
		if (err || !tokenData || tokenData.phone != phone || tokenData.expires <= Date.now()) {
			callback(false);
			return;
		}
		callback(true);
	});
};

	//Users - post
	// Required data: firstName, lastName, phone, password, tosAgreement
	// No optional data
handlers._users.post = function(data, callback){
	// Check that all required fields are filled out
	var firstName = jsutils.setString(data.payload.firstName, null);
	var lastName = jsutils.setString(data.payload.lastName, null);
	var phone = jsutils.setString(data.payload.phone, 10);
	var password = jsutils.setString(data.payload.password, null);
	var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ?
		true : false;

	// check for required data
	if (!firstName || !lastName || !password || !phone || !tosAgreement) {
		callback(400, {'Error' : 'Missing required fields'});
		return;
	}

	// make sure that the user doesn't already exist based on phone number
	_data.read('users', phone, function(err, data){
		if (!err) {
			// if the user exists callback with error and return
			callback(400, {'Error' : 'A user with that phone number already exists'});
			return;
		}

		// here if user doesn't already exist
		// Hash the password
		var hashedPassword = helpers.hash(password);
		if (!hashedPassword) {
			callback(500, {'Error' : 'Could not hash the user'});
			return;
		}
		//Create the user
		var userObject = {
			'firstName' 	 : firstName,
			'lastName' 		 : lastName,
			'phone' 		 : phone,
			'hashedPassword' : hashedPassword,
			'tosAgreement' 	 : true
		};
		// persist the user to disk -- fake save to database TODO replace with real database support
		_data.create('users', phone, userObject, function(err){
			if (!err) {
				callback(200);
			} else {
				console.log(err);
				callback(500, {'Error' : 'Could not create the new user'});
			}
		});					
	});
};

	//Users - get
	// Required data: phone
	// No optional data
handlers._users.get = function(data, callback){
	// Check that the phone number is valid
	var phone = jsutils.setString(data.queryStringObject.phone, 10);
	if (!phone) {
		callback(400, {'Error' : 'Missing required field'});
		return;
	}
	// Get the token from the headers
	var token = jsutils.setString(data.headers.token, null);

	handlers._common.verifyToken(token, phone, function(tokenIsValid){
		if (!tokenIsValid) {
			callback(403, {'Error' : 'Token authentication failed'});
			return;
		}	
		_data.read('users', phone, function(err, data){
			if (!err && data) {
				// remove the hashed password from the user object before returning it
				delete data.hashedPassword;
				callback(200, data);
			} else {
				callback(404, {'Error' : 'Read error when accessing user'});
			}
		});
	});
};

	//Users - put
	//Required data : phone
	//Optional data (at least one is required) : firstName, lastName, password
handlers._users.put = function(data, callback){

	var phone = jsutils.setString(data.payload.phone, 10);
	var firstName = jsutils.setString(data.payload.firstName, null);
	var lastName = jsutils.setString(data.payload.lastName, null);
	var password = jsutils.setString(data.payload.password, null);

	if ((!firstName && !lastName && !password)  || !phone) {
		callback(400, {'Error' : 'Missing required field or fields to update'});
		return;
	}

	// Get the token from the headers
	var token = jsutils.setString(data.headers.token, null);

	handlers._common.verifyToken(token, phone, function(tokenIsValid){
		if (!tokenIsValid) {
			callback(403, {'Error' : 'Token authentication failed'});
			return;
		}
		_data.read('users', phone, function(err, userData){
			if(err || !userData) {
				callback(400, {'Error' : 'The specified user does not exist'});
				return;
			}

			userData.firstName = firstName ? firstName : userData.firstName;
			userData.lastName = lastName ? lastName : userData.lastName;
			userData.hashedPassword = password ? helpers.hash(password) : userData.hashedPassword;

			//store the new updates
			_data.update('users', phone, userData, function(err){
				if (!err){
					callback(200);
				} else {
					// log the error and pass back internal error (not a request error, 400)
					console.log(err);
					callback(500, {'Error' : 'Could not update user record'});
				}
			});
		});
	});
};

	//Users - delete
	//Required data : phone
handlers._users.delete = function(data, callback){
	// Check that the phone number is valid
	var phone = jsutils.setString(data.queryStringObject.phone, 10);
	if (!phone) {
		callback(400, {'Error' : 'Missing required field'});
		return;
	}
	// Get the token from the headers
	var token = jsutils.setString(data.headers.token, null);

	handlers._common.verifyToken(token, phone, function(tokenIsValid){
		if (!tokenIsValid) {
			callback(403, {'Error' : 'Token authentication failed'});
			return;
		}
		_data.read('users', phone, function(err, data){
			if (err || !data) {
				callback(400, {'Error' : 'could not find the specified user'});
				return;
			}
			_data.delete('users', phone, function(err){
				if (err) {
					callback(500, {'Error' : 'Could not delete the specified user'});
					return;					
				}
				var userChecks = jsutils.setNonEmptyArray(data.checks, null);
				var checksToDelete = userChecks.length;
				if (userChecks && userChecks.length > 0) {
					var numChecksDeleted = 0;
					var deletionErrors = false;
					userChecks.forEach(function(checkId){
						_data.delete('checks', checkId, function(err){
							numChecksDeleted++;
							if (err) {
								deletionErrors = true;
							}
							if (numChecksDeleted == checksToDelete) {
								if (!deletionErrors) {
									callback(200);
								} else {
									callback(500, {'ERROR' : 'Errors deleting Users Checks'});
								}
							}
						});
					});
				}
				callback(200);			
			});
		});
	});
};

	//Tokens - post
	//Required data : phone, password
	// No Optional data
handlers._tokens.post = function(data, callback){
	// Check that all required fields are filled out
	var phone = jsutils.setString(data.payload.phone, 10);
	var password = jsutils.setString(data.payload.password, null);

	// check for required data
	if (!password || !phone) {
		callback(400, {'Error' : 'Missing required fields'});
		return;
	}

	// get the requested User
	_data.read('users', phone, function(err, userData){
		if (err) {
			// if the user is not found then callback
			callback(400, {'Error' : 'Could not find specified User'});
			return;
		}

		// here if user doesn't already exist
		// Hash the password and compare to password in user record
		var hashedPassword = helpers.hash(password);
		if (hashedPassword != userData.hashedPassword) {
			callback(400, {'Error' : 'Password does not match'});
			return;
		}
		//Create the new token for this user with a random name.
		//Set expiration date one hour in the future
		//@TODO make token expiration configurable
		var tokenId = helpers.createRandomString(20);
		var expires = Date.now() + 1000 * 60 * 60;
		var tokenObject = {
			'phone'   : phone,
			'id'      : tokenId,
			'expires' : expires
		};
		// store the token
		_data.create('tokens', tokenId, tokenObject, function(err){
			if (!err) {
				callback(200, tokenObject);
			} else {
				console.log(err);
				callback(500, {'Error' : 'Could not create the new token'});
			}
		});					
	});
};

	//Tokens - get
	//Required data : id
	// No optional data
handlers._tokens.get = function(data, callback){
	// Check that the id is valid
	var id = jsutils.setString(data.queryStringObject.id, 20);
	if (!id) {
		callback(400, {'Error' : 'Missing required field'});
		return;
	}
	_data.read('tokens', id, function(err, tokenData){
		if (!err && tokenData) {
			callback(200, tokenData);
		} else {
			callback(404, {'Error' : 'Read error when accessing token'});
		}
	});
};

	//Tokens - put
	//Required data : id, extend
	// @TODO make extension time configurable
handlers._tokens.put = function(data, callback){
	// Check that the id is valid
	var tokenId = jsutils.setString(data.payload.id, 20);
	var extend = typeof(data.payload.extend) == 'boolean' ? data.payload.extend : false;
	if (!tokenId) {
		callback(400, {'Error' : 'Id is not valid'});
		return;
	}
	if (!extend) {
		callback(400, {'Error' : 'Extend not true'});
		return;
	}
	_data.read('tokens', tokenId, function(err, tokenData){
		if (err || !tokenData) {
			callback(404, {'Error' : 'Read error when accessing token'});
			return;
		}
		// check that token isn't already expired
		if (tokenData.expires <= Date.now()) {
			callback(404, {'Error' : 'Token is expired and cannot be extended'});
			return;
		}
		tokenData.expires = Date.now() + 1000 * 60 * 60;
		// update the token
		_data.update('tokens', tokenId, tokenData, function(err){
			if (!err) {
				callback(200, tokenData);
			} else {
				console.log(err);
				callback(500, {'Error' : 'Could not update token expiration'});
			}
		});	
	});
};

	//Tokens - delete (deleting a token is the same as logging out)
	//Required data : phone
handlers._tokens.delete = function(data, callback){
	// Check that the token Id is valid
	var tokenId = jsutils.setString(data.queryStringObject.id, 20);
	if (!tokenId) {
		callback(400, {'Error' : 'Invalid Token Id'});
		return;
	}
	_data.read('tokens', tokenId, function(err, data){
		if (err || !data) {
			callback(400, {'Error' : 'could not find the specified token'});
			return;
		}
		_data.delete('tokens', tokenId, function(err){
			if (!err) {
				callback(200);
			} else {
				callback(500, {'Error' : 'Could not delete the specified token'});
			}				
		});
	});
};

	//Checks - get
	//Required data : id
	// No optional data
handlers._checks.get = function(data, callback){
	// Check that the id is valid
	var id = jsutils.setString(data.queryStringObject.id, 20);
	if (!id) {
		callback(400, {'Error' : 'Missing required field'});
		return;
	}
	// Lookup the check
	_data.read('checks', id, function(err, checkData){
		if (err || !checkData) {
			callback(404);
			return;
		}
		// Get the token from the headers
		var tokenId = jsutils.setString(data.headers.token, null);
		handlers._common.verifyToken(tokenId, checkData.userPhone, function(tokenIsValid){
			if (!tokenIsValid) {
				callback(403);
				return;
			}
			callback(200, checkData);
		});
	});



};

	// Checks - post
	// Required data : protocol, url, method, successCodes, timeoutSeconds
	// No optional data
handlers._checks.post = function(data, callback){
	var protocol = jsutils.setString(data.payload.protocol, null);
	var url = jsutils.setString(data.payload.url, null);
	var method = jsutils.setString(data.payload.method, null);
	var successCodes = jsutils.setNonEmptyArray(data.payload.successCodes);
	var timeoutSeconds = jsutils.setWholeNumber(data.payload.timeoutSeconds, 0, 6);
	var allowedProtocols = ['https', 'http'];
	var allowedMethods = ['post', 'get', 'put', 'delete'];
	if (!url  
		|| !protocol || !jsutils.arrayContains(allowedProtocols, protocol) 
		|| !method || !jsutils.arrayContains(allowedMethods, method)
		|| !successCodes
		|| !timeoutSeconds) {
		callback(400, {'ERROR' : 'Invalid or missing inputs'});
		return;
	}

	// Disallow anonymous users
	var token = jsutils.setString(data.headers.token, null);
	_data.read('tokens', token, function(err, tokenData){
		if (err || !tokenData) {
			callback(403);
			return;
		}
		var userPhone = tokenData.phone;

		// Lookup the user
		_data.read('users', userPhone, function(err, userData){
			if (err || !userData) {
				callback(403);
				return;
			}
			var userChecks = jsutils.setNonEmptyArray(userData.checks, null);
			// if there are no user checks initialize with empty array
			userChecks = !userChecks ? [] : userChecks;
			if (userChecks.length >= config.maxChecks) {
				callback(400, {'Error' : 'User already has ' + config.maxChecks + ' checks'});
				return;
			}
			// create a random id for the check
			var checkId = helpers.createRandomString(20);
			var checkObject = {
				'id'             : checkId,
				'userPhone'      : userPhone,
				'protocol'       : protocol,
				'url'            : url,
				'method'         : method,
				'successCodes'   : successCodes,
				'timeoutSeconds' : timeoutSeconds
			};
			_data.create('checks', checkId, checkObject, function(err){
				if (err) {
					callback(500, {'Error' : 'Could not create the new check'});
				}
				userData.checks = userChecks;
				userData.checks.push(checkId);
				_data.update('users', userPhone, userData, function(err){
					if (err) {
						callback(500, {'Error' : 'Could not update user with new check'});
						return;
					}
					callback(200, checkObject);
				});
			});		
		});
	});
};

	//Checks - put
	//Required data : id
	// Optional data : protocol, url, method, successCodes, timeoutSeconds (need at least one)
handlers._checks.put = function(data, callback){
	// Check that the id is valid
	var checkId = jsutils.setString(data.payload.id, 20);
	var tokenId = jsutils.setString(data.headers.token, null);
	if (!checkId) {
		callback(400, {'Error' : 'Missing or invalid Id'});
		return;
	}
	var allowedProtocols = ['https', 'http'];
	var allowedMethods = ['post', 'get', 'put', 'delete'];

	var protocol = jsutils.arrayContains(allowedProtocols, protocol) ? 
		jsutils.setString(data.payload.protocol, null) : null;
	var method = jsutils.arrayContains(allowedMethods, method) ?
		jsutils.setString(data.payload.method, null) : null;
	var url = jsutils.setString(data.payload.url, null);	
	var successCodes = jsutils.setNonEmptyArray(data.payload.successCodes);
	var timeoutSeconds = jsutils.setWholeNumber(data.payload.timeoutSeconds, 0, 6);

	if (!url && !protocol &&  !method && !successCodes && !timeoutSeconds) {
		callback(400, {'ERROR' : 'Invalid or missing inputs'});
		return;
	}
	_data.read('checks', checkId, function(err, checkData){
		if (err || !checkData) {
			callback(400, {'Error' : 'Check Id did not exist'});
			return;
		}
		
		handlers._common.verifyToken(tokenId, checkData.userPhone, function(tokenIsValid){
			if (!tokenIsValid) {
				callback(403);
				return;
			}
			// update with the optional data that was sent
			checkData.protocol = protocol ? protocol : checkData.protocol;
			checkData.method = method ? method : checkData.method;
			checkData.url = url ? url : checkData.url;
			checkData.successCodes = successCodes ? successCodes : checkData.successCodes;
			checkData.timeoutSeconds = timeoutSeconds ? timeoutSeconds : checkData.timeoutSeconds;
			_data.update('checks', checkId, checkData, function(err){
				if (err) {
					callback(500, {'Error' : 'Could not update check'});
					return;
				}
				callback(200);				
			});
		});
	});	
};

	//Checks - delete
	//Required data : id
	//No Optional data
handlers._checks.delete = function(data, callback){
		// Check that the token Id is valid
	var checkId = jsutils.setString(data.queryStringObject.id, 20);
	var tokenId = jsutils.setString(data.headers.token, null);
	if (!checkId || !tokenId) {
		callback(400, {'ERROR' : 'Invalid Check Id or Invalid Token'});
		return;
	}
	_data.read('checks', checkId, function(err, checkData){
		if (err || !checkData) {
			callback(400, {'ERROR' : 'Could not read check ' + err + checkData});
			return;
		}
		handlers._common.verifyToken(tokenId, checkData.userPhone, function(tokenIsValid){
			if (!tokenIsValid) {
				callback(400, {'ERROR' : 'Token is not valid'});
				return;
			}
			_data.delete('checks', checkId, function(err){
				if (err) {
					callback(500, {'Error' : 'Could not delete the check'});
					return;
				}
				_data.read('users', checkData.userPhone, function(err, userData){
					if (err || !userData) {
						callback(500, {'Error' : 'Could not find User'});
						return;
					}				
					var userChecks = jsutils.setNonEmptyArray(userData.checks, null);
					var checkPosition = userChecks.indexOf(checkId);
					if (checkPosition < 0) {
						callback(500, {'ERROR' : 'Check is not stored on User'});
						return;
					}
					userChecks.splice(checkPosition, 1);
					_data.update('users', checkData.userPhone, userData, function(err){
						if (err) {
							callback(500, {'Error' : 'Could not update user'});
							return;
						}
						callback(200);
					});				
				});				
			});
		});
	});
};

 // Export the module
module.exports = handlers;