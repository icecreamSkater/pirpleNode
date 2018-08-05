/*
	Create and export util functions
 */

 // Container for all the utilities
 var ja_utilities = {};

 ja_utilities.removeLeadSlash = function(stringToTrim) {
 	return stringToTrim.replace(/^\/+|\/+$/g, '');
 }

 ja_utilities.setString = function(stringValue, stringLength) {
	if (typeof(stringValue) != 'string' || stringValue.trim().length == 0) return false;
	if (typeof(stringLength) == 'number' 
		&& stringLength > 0 
		&& stringValue.trim().length != stringLength) return false;
		 
	// return the trimmed value
	return stringValue.trim();
 }

 // Export the module
module.exports = ja_utilities;