/*
	Create and export configuration variables
 */

/***************************************
	Environments Container
		environments.staging - creates a SHA256 hash using the hashing secret in the config module
		environments.production - parse a JSON string to an object, fall back to an new empty object on error
			-httpPort
			-httpsPort
			-hashingSecret
			-twilio container
			-mailGun container
			-stripe container
***************************************/
// Container for all the environments
var environments = {};

 // Staging (default) environment
 environments.staging = {
 	'httpPort'       : '3000',
 	'httpsPort'      : '3001',
 	'envName'        : 'staging',
 	'hashingSecret'  : 'thisIsASecret',
 	'maxChecks'      : 5,
 	'twilio'         : {
 		'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
 		'authToken'  : '9455e3eb3109edc12e3d8c92768f7a67',
 		'fromPhone'  : '+15005550006'
 	},
 	'mailGun'		 : {
 		'url'		 : 'https://api.mailgun.net/v3/sandbox4ac609fe63994eedb1201f58bfd81bc2.mailgun.org/messages',
 		'apiKey'	 : '45b6174f710b7aeba2eb75ba107c2be8-0e6e8cad-8aaa1147',
 		'from'		 : 'Mailgun Sandbox <postmaster@sandbox4ac609fe63994eedb1201f58bfd81bc2.mailgun.org>'
 	},
 	'stripe'		 : {
 		'secret'	 : 'sk_test_MOtua5hei9jXQObGt2s2E8Pi',
 		'pKey'	     : 'pk_test_tnXFoHL97nslK2dLkaCPe8IB',
 		'currency'   : 'usd',
 		'description': 'Pizza Payment'
 	}
 };

 // Production environment
 environments.production = {
	'httpPort'       : '5000',
	'httpsPort'      : '5001',
 	'envName'        : 'production',
 	'hashingSecret'  : 'thisIsASecret',
 	'maxChecks'      : 5,
 	'twilio'         : {
 		'accountSid' : '',
 		'authToken'  : '',
 		'fromPhone'  : ''
 	},
 	'mailGun'		 : {
 		'url'		 : 'https://api.mailgun.net/v3/sandbox4ac609fe63994eedb1201f58bfd81bc2.mailgun.org/messages',
 		'apiKey'	 : '45b6174f710b7aeba2eb75ba107c2be8-0e6e8cad-8aaa1147',
 		'from'		 : 'Mailgun Sandbox <postmaster@sandbox4ac609fe63994eedb1201f58bfd81bc2.mailgun.org>'
 	},
 	'stripe'		 : {
 		'secret'	 : 'sk_test_MOtua5hei9jXQObGt2s2E8Pi',
 		'pKey'	     : 'pk_test_tnXFoHL97nslK2dLkaCPe8IB',
 		'currency'   : 'usd',
 		'description': 'Pizza Payment'
 	}
 };

 // Determine the environment as a command-line argument
 var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ?
 	process.env.NODE_ENV.toLowerCase() : '';

 // select our defined environments or set a staging as default
 var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ?
 	environments[currentEnvironment] : environments['staging'];

/***************************************
	Exports
		- environmentToExport
***************************************/
module.exports = environmentToExport;