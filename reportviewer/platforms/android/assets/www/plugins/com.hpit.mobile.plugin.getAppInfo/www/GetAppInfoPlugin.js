cordova.define("com.hpit.mobile.plugin.getAppInfo.GetAppInfoPlugin", function(require, exports, module) {var exec = require('cordova/exec');

function GetAppInfoPlugin(){

}

GetAppInfoPlugin.prototype.get = function(successCallback, errorCallback){
	exec(successCallback, errorCallback, "GetAppInfoPlugin", "get", []);
}

module.exports = new GetAppInfoPlugin();

});
