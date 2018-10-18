/*
 * Library for storing and rotating logs
 */

/***************************************
	Dependencies
***************************************/
//modules within node
var fs   = require('fs');
var path = require('path');
var zlib = require('zlib');  // file compression

// container for the logging library
var loglib = {};
/***************************************
	Servers Container
		loglib.baseDir - Base directory of the log folder
		loglib.append - Append a string to a file.  Create the file if it does not exist
		loglib.list - list all logs and optionally include compressed logs
		loglib.compress - compress the contents of one .log file into a .gz.b64 file within the same directory
		loglib.decompress - decompress the contents of a .g.b64 file into a string variable
		loglib.truncate - truncate a log file
***************************************/

// Base directory of the log folder
loglib.baseDir = path.join(__dirname, '/../.logs');

// Append a string to a file.  Create the file if it does not exist.
loglib.append = function(file, str, callback) {
	// open the file for appending
	fs.open(loglib.baseDir + '/' + file + '.log', 'a', function(err, fileDescriptor){
		if (err || !fileDescriptor) {
			callback('Could not open log file for appending');
			return;
		}
		fs.appendFile(fileDescriptor, str + '\n', function(err){
			if (err) {
				callback('Error appending to log file');
				return;
			}
			fs.close(fileDescriptor, function(err){
				if (err) {
					callback('Error closing log file that was being appended');
					return;
				}
				callback(false);
			});
		});
	});
};

// list all logs and optionally include compressed logs
loglib.list = function(includeCompressedLogs, callback) {//(false, function(err, logs){
	fs.readdir(loglib.baseDir, function(err, data){
		if (err || !data || data.length <= 0) {
			callback(err, data);
			return;
		}
		var trimmedFileNames = [];
		data.forEach(function(fileName){
			// Add the .log files
			if (fileName.indexOf('.log') > -1){
				trimmedFileNames.push(fileName.replace('.log', ''));
			}

			// Add on the .gz files
			if (fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
				trimmedFileNames.push(fileName.replace('gz.b64'), '');
			}
		});
		callback(false, trimmedFileNames);
	});
};

// compress the contents of one .log file into a .gz.b64 file within the same directory
loglib.compress = function(logId, newFileId, callback){
	var sourceFile = logId + '.log';
	var destFile = newFileId + '.gz.b64';

	//Read the source file
	fs.readFile(loglib.baseDir + '/' + sourceFile, 'utf8', function(err, inputString){
		if (err || !inputString){
			callback(err);
			return;
		}
		zlib.gzip(inputString, function(err, buffer){
			if(err || !buffer) {
				callback(err);
				return;
			}
			// Send the new compressed data to the destination file
			fs.open(loglib.baseDir + '/' + destFile, 'wx', function(err, fileDescriptor){
				if (err || !fileDescriptor) {
					callback(err);
					return;
				}
				// Write destination file
				fs.writeFile(fileDescriptor, buffer.toString('base64'), function(err){
					if (err){
						callback(err);
						return;
					}
					// close the file
					fs.close(fileDescriptor, function(err){
						if (err) {
							callback(err);
							return;
						}
						callback(false);
					});
				});
			});
		});
	});
};

// decompress the contents of a .g.b64 file into a string variable
loglib.decompress = function(fileId, callback){
	var fileName = fileId + '.gz.b64';
	fs.readFile(loglib.baseDir + '/' + fileName, 'utf8', function(err, str){
		if (err || !str) {
			callback(err);
			return;

		}
		//Decompress the data
		var inputBuffer = Buffer.from(str, 'base64');
		zlip.unzip(inputBuffer, function(err, outputBuffer){
			if (err || !outputBuffer) {
				callback(err);
				return;

			}
			var str = outputBuffer.toString();
			callback(false, str);			
		});
	});
};


//truncate a log file
loglib.truncate = function(logId, callback){//(logId, function(err)
	fs.truncate(loglib.baseDir + '/' + logId  + '.log', 0, function(err){
		if (err) {
			callback(err);
			return;
		}
		callback(false);
	});
};

/***************************************
	Exports
		- loglib
***************************************/
module.exports = loglib;