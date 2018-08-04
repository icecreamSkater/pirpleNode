/*
	Create and export server handler functions
 */
 var videos = require('./videos');
 var _data = require('./data');
 var helpers = require('./helpers');

handlers = {}

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

// Not found handler
handlers.notFound = function(data, callback) {
	callback(404);
};

// Containers for handler private objects and functions
handlers._users = {};
	//Users - post
	// Required data: firstName, lastName, phone, password, tosAgreement
	// No optional data
handlers._users.post = function(data, callback){
	// Check that all required fields are filled out
	var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ?
		data.payload.firstName.trim() : false;
	var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ?
		data.payload.lastName.trim() : false;
	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ?
		data.payload.phone.trim() : false;
	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ?
		data.payload.password.trim() : false;
	var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ?
		true : false;

	if (firstName && lastName && password && phone && tosAgreement) {
		// make sure that the user doesn't already exist based on phone number
		_data.read('users', phone, function(err, data){
			if (err) {
				// Hash the password
				var hashedPassword = helpers.hash(password);
				if (hashedPassword) {
					//Create the user
					var userObject = {
						'firstName' : firstName,
	 					'lastName' : lastName,
						'phone' : phone,
						'hashedPassword' : hashedPassword,
						'tosAgreement' : true
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
				} else {
					callback(500, {'Error' : 'Could not hash the user'});
				}

			} else {
				callback(400, {'Error' : 'A user with that phone number already exists'});
			}
		});
	} else {
		callback(400, {'Error' : 'Missing required fields'});
	}
};

	//Users - get
	// Required data: phone
	// No optional data
	// @TODO only let authenticated used access their objects, don't let them access anyone else's
handlers._users.get = function(data, callback){
	// Check that the phone number is valid
	var phone = typeof(data.queryStringObject.phone.trim()) == 'string' && data.queryStringObject.phone.trim().length == 10 ?
		data.queryStringObject.phone.trim() : true;
	if (phone) {
		_data.read('users', phone, function(err, data){
			if (!err && data) {
				// remove the hashed password from the user object before returning it
				delete data.hashedPassword;
				callback(200, data);
			} else {
				callback(404, {'Error' : 'Read error when accessing user'});
			}
		});
	} else {
		callback(400, {'Error' : 'Missing required field'});
	}
};
	//Users - put
	//Required data : phone
	//Optional data (at least one is required) : firstName, lastName, password
	// @TODO only let authenticated used access their objects, don't let them access anyone else's
handlers._users.put = function(data, callback){
	//check for the required field
	var phone = typeof(data.payload.phone.trim()) == 'string' && data.payload.phone.trim().length == 10 ?
		data.payload.phone.trim() : true;

	// check for the optional fields
	var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ?
		data.payload.firstName.trim() : false;
	var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ?
		data.payload.lastName.trim() : false;
	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ?
		data.payload.password.trim() : false;
	if ((firstName || lastName || password)  && phone) {
		_data.read('users', phone, function(err, userData){
			//@TODO replace these blocks with a function call
			if(!err && userData) {
				if(firstName) {
					userData.firstName = firstName;
				} 
				if(firstName) {
					userData.lastName = lastName;
				}
				if(firstName) {
					userData.hasedPassword = helpers.hash(password);
				}
				//store the new updates
				_data.update('users',phone,userData,function(err){
					if (!err){
						callback(200);
					} else {
						// log the error and pass back internal error (not a request error, 400)
						console.log(err);
						callback(500, {'Error' : 'Could not update user record'});
					}
				});
			} else {
				callback(400, {'Error' : 'The specified user does not exist'});
			}
		});
	} else {
		callback(400, {'Error' : 'Missing required field or fields to update'});
	}


};

	//Users - delete
	//Required data : phone
	// @TODO only let authenticated used access their objects, don't let them access anyone else's
	// @TODO Cleanup (delete) and other data files associated with this user
handlers._users.delete = function(data, callback){
	// Check that the phone number is valid
	var phone = typeof(data.queryStringObject.phone.trim()) == 'string' && data.queryStringObject.phone.trim().length == 10 ?
		data.queryStringObject.phone.trim() : true;
	if (phone) {
		_data.read('users', phone, function(err, data){
			if (!err && data) {
				_data.delete('users', phone, function(err){
					if (!err) {
						callback(200);
					} else {
						callback(500, {'Error' : 'Could not delete the specified user'});
					}				
				});
			} else {
				callback(400, {'Error' : 'could not find the specified user'});
			}
		});
	} else {
		callback(400, {'Error' : 'Missing required field'});
	}
};

 // Export the module
module.exports = handlers;