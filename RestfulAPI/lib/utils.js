/*
	Create and export util functions
 */

 // Container for all the utilities
 var ja_utilities = {};

 ja_utilities.removeLeadSlash = function(stringToTrim) {
 	return stringToTrim.replace(/^\/+|\/+$/g, '');
 }

ja_utilities.setString = function(stringValue, stringLength) {
	if (typeof(stringValue) != 'string' || stringValue.trim().length <= 0) return false;
	if (typeof(stringLength) == 'number' 
		&& stringLength > 0 
		&& stringValue.trim().length != stringLength) return false;
		 
	// return the trimmed value
	return stringValue.trim();
}

ja_utilities.setNonEmptyArray = function(arrayObject, arrayLength) {
	if (typeof(arrayObject) != 'object' || !(arrayObject instanceof Array) || arrayObject.length <= 0) return false;
	if (typeof(arrayLength) == 'number' 
		&& arrayLength > 0 
		&& arrayObject.length != arrayLength) return false;
		 
	return arrayObject;
}

ja_utilities.setWholeNumber = function(numberObject, min, max) {
	if (typeof(numberObject) != 'number' || !(numberObject % 1 === 0)) return false;
	if (typeof(min) == 'number' && numberObject < min) return false;
	if (typeof(max) == 'number' && numberObject > max) return false;
		 
	return numberObject;
}

ja_utilities.arrayContains = function(arrayObject, containedObject) {
	if (!ja_utilities.setNonEmptyArray(arrayObject)) return false;
		 
	// return the trimmed value
	return arrayObject.indexOf(containedObject) > -1;
}

 // Export the module
module.exports = ja_utilities;