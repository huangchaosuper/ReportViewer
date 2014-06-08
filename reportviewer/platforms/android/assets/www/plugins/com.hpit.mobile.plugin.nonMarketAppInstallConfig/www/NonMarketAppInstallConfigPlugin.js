cordova.define("com.hpit.mobile.plugin.nonMarketAppInstallConfig.NonMarketAppInstallConfigPlugin", function(require, exports, module) {var exec = require('cordova/exec');

function NonMarketAppInstallConfigPlugin(){

}

NonMarketAppInstallConfigPlugin.prototype.get = function(successCallback, errorCallback){
	exec(successCallback, errorCallback, "NonMarketAppInstallConfigPlugin", "get", []);
}
NonMarketAppInstallConfigPlugin.prototype.set = function(successCallback, errorCallback){
	exec(successCallback, errorCallback, "NonMarketAppInstallConfigPlugin", "set", []);
}
module.exports = new NonMarketAppInstallConfigPlugin();

});
