cordova.define("com.hpit.mobile.plugin.deviceId.GetDeviceIdPlugin", function(require, exports, module) {var exec = require('cordova/exec');

function GetDeviceIdPlugin(){

}

GetDeviceIdPlugin.prototype.get = function(successCallback, errorCallback){
	exec(successCallback, errorCallback, "GetDeviceIdPlugin", "get", []);
}

module.exports = new GetDeviceIdPlugin();

});
