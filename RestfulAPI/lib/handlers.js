/*
	Create and export server handler functions
 */
 var videos = require('./videos');
 var _data = require('./data');
 var helpers = require('./helpers');
 var jsutils = require('./utils');

// Containers for token handler private objects and functions
handlers = {};
handlers._users = {};
handlers._tokens = {};
handlers._common = {};

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
	// @TODO Cleanup (delete) and other data files associated with this user
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
				if (!err) {
					callback(200);
				} else {
					callback(500, {'Error' : 'Could not delete the specified user'});
				}				
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
}

	//Tokens - get
	//Required data : id
	// No optional data
handlers._tokens.get = function(data, callback){
	// Check that the id is valid
	var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ?
		data.queryStringObject.id.trim() : false;
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
}

	//Tokens - put
	//Required data : id, extend
	// @TODO only let authenticated used access their objects, don't let them access anyone else's
	// @TODO make extension time configurable
handlers._tokens.put = function(data, callback){
	// Check that the id is valid
	var tokenId = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ?
		data.payload.id.trim() : false;
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
}

	//Tokens - delete (deleting a token is the same as logging out)
	//Required data : phone
	// @TODO only let authenticated used access their objects, don't let them access anyone else's
	// @TODO Cleanup (delete) and other data files associated with this user
handlers._tokens.delete = function(data, callback){
	// Check that the token Id is valid
	var tokenId = typeof(data.queryStringObject.id.trim()) == 'string' && data.queryStringObject.id.trim().length == 20 ?
		data.queryStringObject.id.trim() : false;
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
}

 // Export the module
module.exports = handlers;