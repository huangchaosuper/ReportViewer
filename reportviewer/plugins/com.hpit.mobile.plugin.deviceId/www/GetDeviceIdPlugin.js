var exec = require('cordova/exec');

function GetDeviceIdPlugin(){

}

GetDeviceIdPlugin.prototype.get = function(successCallback, errorCallback){
	exec(successCallback, errorCallback, "GetDeviceIdPlugin", "get", []);
}

module.exports = new GetDeviceIdPlugin();

