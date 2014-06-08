var exec = require('cordova/exec');

function EmailSenderPlugin(){

}

EmailSenderPlugin.prototype.send = function(recipients, subject, text, successCallback, failureCallback){	
	exec(successCallback, failureCallback, "EmailSenderPlugin", "send", [recipients, subject, text]);
}

module.exports = new EmailSenderPlugin();

