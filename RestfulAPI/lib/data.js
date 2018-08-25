/* 
Library for storing and editing data
*/

//Dependencies

var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

// Container for this module
// the .data directory is like a poor man's database
// subdirectories serve the purpose of database tables (users, tokens)
var lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data');

// Write data to a file
lib.create = function(dir, file, data, callback){
	// Open the file for writing, exclude existing files
	fs.open(lib.baseDir + '/' + dir + '/' + file + '.json', 'wx', function(err, fileDescriptor){
		if (!err && fileDescriptor) {
			// Convert data to string
			var stringData = JSON.stringify(data);

			// Write to file and close it
			fs.writeFile(fileDescriptor, stringData, function(err){
				if (!err) {
					fs.close(fileDescriptor, function(err){
						if (!err) {
							callback(false);
						} else {
							callback('Error closing new file ' + err);
						}
					});
				} else {
					callback('Error writing to new file ' + err);
				}
			});
		} else {
			callback('Could not create new file, it may already exist ' + err);
		}
	});
};

lib.read = function(dir, file, callback) {
	fs.readFile(lib.baseDir + '/' + dir + '/' + file + '.json', 'utf8', function(err, data){
		if (err || !data) {
			callback(err, data);
		} else {
			var parsedData = helpers.parseJsonToObject(data);
			callback(false, parsedData);			
		}
			
	});
};

lib.update = function(dir, file, data, callback) {
	// open existing file for writing
	fs.open(lib.baseDir + '/' + dir + '/' + file + '.json', 'r+', function(err, fileDescriptor){
		if (!err && fileDescriptor) {
			// Convert the data to string
			var stringData = JSON.stringify(data);

			// Truncate the file
			fs.truncate(fileDescriptor, function(err){
				if (!err) {
					// write to the file and close it
					fs.writeFile(fileDescriptor,stringData,function(err){
						if(!err) {
							fs.close(fileDescriptor, function(err) {
								if (!err) {
									callback(false);
								} else {
									callback('Error closing the file');
								}
							});
						} else {
							callback('Error writing to existing file');
						}
					});
				} else {
					callback('Error truncating the file');
				}
			});
		} else {
			callback('Could not open the file for updating, it may not exist yet');
		}
	});

};

lib.delete = function(dir, file, callback) {
	// unlink the file
	fs.unlink(lib.baseDir + '/' + dir + '/' + file + '.json', function(err){
		if (!err){
			callback(false);
		} else {
			callback('Error deleting file');
		}
	});
};

//List all the items in a directory
lib.list = function(dir, callback){
	fs.readdir(lib.baseDir + '/' + dir + '/', function(err, data){
		if (err || !data || data.length <= 0) {
			callback(err, data);
			return;
		}
		var trimmedFileNames = [];
		data.forEach(function(fileName){
			trimmedFileNames.push(fileName.replace('.json',''));
		});
		callback(false, trimmedFileNames);
	});
};

// Export the module
module.exports = lib;
