var exec = require('cordova/exec');

function NonMarketAppInstallConfigPlugin(){

}

NonMarketAppInstallConfigPlugin.prototype.get = function(successCallback, errorCallback){
	exec(successCallback, errorCallback, "NonMarketAppInstallConfigPlugin", "get", []);
}
NonMarketAppInstallConfigPlugin.prototype.set = function(successCallback, errorCallback){
	exec(successCallback, errorCallback, "NonMarketAppInstallConfigPlugin", "set", []);
}
module.exports = new NonMarketAppInstallConfigPlugin();

