var exec = require('cordova/exec');

function DeviceTypePlugin(){

}

DeviceTypePlugin.prototype.get = function(successCallback, errorCallback){
	exec(successCallback, errorCallback, "DeviceTypePlugin", "", []);
}

module.exports = new DeviceTypePlugin();

