cordova.define("com.hpit.mobile.plugin.deviceType.DeviceTypePlugin", function(require, exports, module) {var exec = require('cordova/exec');

function DeviceTypePlugin(){

}

DeviceTypePlugin.prototype.get = function(successCallback, errorCallback){
	exec(successCallback, errorCallback, "DeviceTypePlugin", "", []);
}

module.exports = new DeviceTypePlugin();

});
