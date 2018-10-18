/*
	Create and export util functions
 */

/***************************************
	ja_utilities Container
		ja_utilities.removeLeadSlash - return the string with the leading slashes remove, it does not check that it is a string
		ja_utilities.setString - verify input is string of specified length, or non-zero length if no length is specified
		ja_utilities.setNonEmptyArray - verify input an array of specified length, or non-zero length if no length is specified
		ja_utilities.setWholeNumber - verify input is an integer, greater than minimum if specified or less than maximum if speicified
		ja_utilities.arrayContains - verify that an object is within and array, after verifying that it is an array
***************************************/

 // Container for all the utilities
 var ja_utilities = {};

 // return the string with the leading slashes remove, it does not check that it is a string
 ja_utilities.removeLeadSlash = function(stringToTrim) {
 	return stringToTrim.replace(/^\/+|\/+$/g, '');
 }

// verify input is string of specified length, or non-zero length if no length is specified
ja_utilities.setString = function(stringValue, stringLength) {
	if (typeof(stringValue) != 'string' || stringValue.trim().length <= 0) return false;
	if (typeof(stringLength) == 'number' 
		&& stringLength > 0 
		&& stringValue.trim().length != stringLength) return false;
		 
	// return the trimmed value
	return stringValue.trim();
}

// verify input an array of specified length, or non-zero length if no length is specified
ja_utilities.setNonEmptyArray = function(arrayObject, arrayLength) {
	if (!arrayObject || typeof(arrayObject) != 'object' || !(arrayObject instanceof Array) || arrayObject.length <= 0) return false;
	if (arrayLength && typeof(arrayLength) == 'number' 
		&& arrayLength > 0 
		&& arrayObject.length != arrayLength) return false;
		 
	// return the arrayObject
	return arrayObject;
}

// verify input is an integer, greater than minimum if specified or less than maximum if speicified
ja_utilities.setWholeNumber = function(numberObject, min, max) {
	if (!numberObject || typeof(numberObject) != 'number' || !(numberObject % 1 === 0)) return false;
	if (min && typeof(min) == 'number' && numberObject < min) return false;
	if (max && typeof(max) == 'number' && numberObject > max) return false;
		 
	// return the integer
	return numberObject;
}

// verify that an object is within and array, after verifying that it is an array
ja_utilities.arrayContains = function(arrayObject, containedObject) {
	if (!ja_utilities.setNonEmptyArray(arrayObject)) return false;
		 
	// return whether or not value in array
	return arrayObject.indexOf(containedObject) > -1;
}

/***************************************
	Exports
		- ja_utilities
***************************************/
module.exports = ja_utilities;