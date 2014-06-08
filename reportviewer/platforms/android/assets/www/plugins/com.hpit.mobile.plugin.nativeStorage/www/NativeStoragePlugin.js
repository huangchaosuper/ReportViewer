cordova.define("com.hpit.mobile.plugin.nativeStorage.NativeStoragePlugin", function(require, exports, module) {var exec = require('cordova/exec');

function NativeStoragePlugin(){

}

NativeStoragePlugin.prototype.get = function(key, successCallback, failureCallback){
	exec(successCallback, failureCallback, "SharedPreferencesDataStoragePlugin", "get", [key]);
}

NativeStoragePlugin.prototype.put = function(key, value, successCallback, failureCallback){
	exec(successCallback, failureCallback, "SharedPreferencesDataStoragePlugin", "put", [key, value]);
}

module.exports = new NativeStoragePlugin();

});
