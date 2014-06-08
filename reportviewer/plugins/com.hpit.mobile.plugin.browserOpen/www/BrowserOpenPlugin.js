var exec = require('cordova/exec');

function BrowserOpenPlugin(){

}

BrowserOpenPlugin.prototype.open = function(url, smsession, successCallback, failureCallback){	
    exec(successCallback, failureCallback, "OpenBrowserWithCookiePlugin", "open", [url,smsession]);
}

module.exports = new BrowserOpenPlugin();

