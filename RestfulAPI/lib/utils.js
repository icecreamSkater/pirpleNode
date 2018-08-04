/*
	Create and export util functions
 */

 // Container for all the utilities
 var ja_utilities = {};

 ja_utilities.removeLeadSlash = function(stringToTrim) {
 	return stringToTrim.replace(/^\/+|\/+$/g, '');
 }

 // Export the module
module.exports = ja_utilities;