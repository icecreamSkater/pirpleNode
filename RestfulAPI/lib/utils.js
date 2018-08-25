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
	if (!arrayObject || typeof(arrayObject) != 'object' || !(arrayObject instanceof Array) || arrayObject.length <= 0) return false;
//console.log('setNonEmpty Array - array is fine');
	if (arrayLength && typeof(arrayLength) == 'number' 
		&& arrayLength > 0 
		&& arrayObject.length != arrayLength) return false;
//console.log('setNonEmpty Array - length is fine');		 
	return arrayObject;
}

ja_utilities.setWholeNumber = function(numberObject, min, max) {
	if (!numberObject || typeof(numberObject) != 'number' || !(numberObject % 1 === 0)) return false;
	if (min && typeof(min) == 'number' && numberObject < min) return false;
	if (max && typeof(max) == 'number' && numberObject > max) return false;
		 
	return numberObject;
}

ja_utilities.arrayContains = function(arrayObject, containedObject) {
//console.log('arrayContains');
	if (!ja_utilities.setNonEmptyArray(arrayObject)) return false;
//console.log('arrayContains - non empty');
//console.log('array:' + arrayObject);
//console.log('array type:' + typeof(arrayObject[0]));
//console.log('contained and type:' + containedObject + ' ' + typeof(containedObject));
//console.log('arrayContains:' + arrayObject.indexOf(containedObject));		 
	// return whether or not value in array
	return arrayObject.indexOf(containedObject) > -1;
}

 // Export the module
module.exports = ja_utilities;