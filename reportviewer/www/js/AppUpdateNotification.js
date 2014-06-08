/**
 * HP IT Mobility Framework 8.0
 * Copyright 2013 (c) HP
 *
 * Check if the new app version is found in our enterprise app store.
 */
var AppUpdateNotification={
    appId:"",
    appVersionNumber:"",
    osType:"",
    callbacks:"",
    env:"PRO",//DEV, ITG, PRO
    statusEnum: {APP_UPDATE_FOUND: "APP_UPDATE_FOUND", APP_UPDATE_NOT_FOUND: "APP_UPDATE_NOT_FOUND"},
    osTypeEnum: {IOS: "iOS", ANDROID: "Android"},
    
    // Test HP Cloud account (username = mobilitybackend-dev-team@hp.com)
    hpCloudBaseURL_DEV:"https://region-a.geo-1.objects.hpcloudsvc.com/v1.0/25268642422485/${OSTYPE}_Enterprise_DEV",
    hpCloudBaseURL_ITG:"https://region-a.geo-1.objects.hpcloudsvc.com/v1.0/25268642422485/${OSTYPE}_Enterprise_ITG",    
    // PROD HP Cloud account (username = TEAM_MOBILITYAPPS_L4Support@groups.hp.com)
    hpCloudBaseURL_PRO:"https://region-a.geo-1.objects.hpcloudsvc.com/v1.0/10204248866104/${OSTYPE}_Enterprise",
       
    hpCloudBaseURL:"https://region-a.geo-1.objects.hpcloudsvc.com/v1.0/10204248866104/${OSTYPE}_Enterprise",
    /**
     * This is the public method for getting app id and version by PhoneGap plugin.
     */
    getAppIdAndVersion: function(inCallbacks){
        var TAG = "getAppIdAndVersion - ";
        
        GetAppInfoPlugin.get(
            function(r){
                console.log(TAG + "PhoneGap Plugin GetAppInfoPlugin success: "+r);
                var appInfo = JSON.parse(r);
                var appId = appInfo.appId || "";
                var appVersionNumber = appInfo.versionNumber || "";
                console.log(TAG + "appId="+appId+", appVersionNumber="+appVersionNumber);
                if (inCallbacks && inCallbacks.done && AppUpdateNotification._isFunction(inCallbacks.done)) {
                    console.log(TAG+"done --> call back: "+inCallbacks.done);
                    inCallbacks.done("OK", appId, appVersionNumber);
                }
            },
            function(e){
                console.log(TAG + "PhoneGap Plugin GetAppInfoPlugin failure: "+e);
                if (inCallbacks && inCallbacks.done && AppUpdateNotification._isFunction(inCallbacks.done)) {
                    inCallbacks.done("FAILURE");
                }
            }
        );
    },
    
    /**
     * This is the public method for checking app update.
     */
    checkUpdate: function(inOSType, inAppId, inAppCurrentVersionNumber, inCallbacks){
        this.appId = inAppId || "";
        this.appVersionNumber = inAppCurrentVersionNumber || "";
        this.osType = this.osTypeEnum[(inOSType || "").toUpperCase()];
        this.callbacks = inCallbacks;
        if(this.appId && this.osType) {         
            this._getVersionList();
        } else {
            if (this.callbacks && this.callbacks.done && this._isFunction(this.callbacks.done)) {
                this.callbacks.done(this.statusEnum.APP_UPDATE_NOT_FOUND);
            }
        }
    },
    
    
    // Access hpcloud to get the version list of app
    _getVersionList: function(){
        var hpCloudBaseURLs = {"DEV":this.hpCloudBaseURL_DEV, "ITG":this.hpCloudBaseURL_ITG, "PRO":this.hpCloudBaseURL_PRO};
        this.hpCloudBaseURL = hpCloudBaseURLs[this.env] || this.hpCloudBaseURL;
        this.hpCloudBaseURL = this.hpCloudBaseURL.replace("${OSTYPE}", encodeURIComponent(this.osType)); 
        var hpCloudAppURL = this.hpCloudBaseURL + "_"+encodeURIComponent(this.appId)+"?path&format=json";
        hpLogin.logd("hpCloudAppURL="+hpCloudAppURL);
        this._ajax.request({
            url: hpCloudAppURL,
            method: "GET",
            callback: {success: this._getVersionListSuccess, failure: this._getVersionListFailure}
        });

    },
    _getVersionListFailure: function(inXhr, inResponseText){
        var TAG = "AppUpdateNotification._getVersionListFailure - ";
        console.log(TAG + "inXhr.status=" + inXhr.status+", inXhr="+ JSON.stringify(inXhr));
        if (AppUpdateNotification.callbacks && AppUpdateNotification.callbacks.done && AppUpdateNotification._isFunction(AppUpdateNotification.callbacks.done)) {
            console.log(TAG+"done --> call back: "+AppUpdateNotification.callbacks.done);
            console.log(TAG+AppUpdateNotification.statusEnum.APP_UPDATE_NOT_FOUND);
            AppUpdateNotification.callbacks.done(AppUpdateNotification.statusEnum.APP_UPDATE_NOT_FOUND);
        }
    },
    _getVersionListSuccess: function(inXhr, inResponseText){
        var TAG = "AppUpdateNotification._getVersionListSuccess - ";
        console.log(TAG + "inXhr.status=" + inXhr.status+", inXhr="+ JSON.stringify(inXhr));
        
        var maxVersionNumber = AppUpdateNotification._extractMaxVersionNumber(inResponseText);
        
        
        if (AppUpdateNotification.callbacks && AppUpdateNotification.callbacks.done && AppUpdateNotification._isFunction(AppUpdateNotification.callbacks.done)) {
            console.log(TAG+"done --> call back: "+AppUpdateNotification.callbacks.done);
            
            if (maxVersionNumber =="NOT_FOUND") { //No valid version is found in hpcloud
                console.log(TAG+"No valid version is found in hpcloud. "+AppUpdateNotification.statusEnum.APP_UPDATE_NOT_FOUND);
                AppUpdateNotification.callbacks.done(AppUpdateNotification.statusEnum.APP_UPDATE_NOT_FOUND);
                return;
            }
            var result = AppUpdateNotification._compareVersionNumbers(maxVersionNumber, AppUpdateNotification.appVersionNumber);
            if(!AppUpdateNotification._isValidVersionNumber(AppUpdateNotification.appVersionNumber) || (!isNaN(result) && result>0)) {
                console.log(TAG+"APP_UPDATE_FOUND --> The latest version is " + maxVersionNumber);
                
                var installURL = "";
                if(AppUpdateNotification.osType === AppUpdateNotification.osTypeEnum.IOS) {
                    installURL = "itms-services://?action=download-manifest&amp;url="+ AppUpdateNotification.hpCloudBaseURL + "_" + encodeURIComponent(AppUpdateNotification.appId) +
                        "/" + maxVersionNumber + "%2F" + encodeURIComponent(AppUpdateNotification.appId) + ".plist";                    
                } else if (AppUpdateNotification.osType === AppUpdateNotification.osTypeEnum.ANDROID) {
                    installURL = AppUpdateNotification.hpCloudBaseURL + "_" + encodeURIComponent(AppUpdateNotification.appId) + 
                        "/" + maxVersionNumber + "/" + encodeURIComponent(AppUpdateNotification.appId) + ".apk";
                }
                console.log(TAG+AppUpdateNotification.statusEnum.APP_UPDATE_FOUND+" --> The installation URL is " + installURL);
                AppUpdateNotification.callbacks.done(AppUpdateNotification.statusEnum.APP_UPDATE_FOUND, maxVersionNumber, installURL);
            } else {
                console.log(TAG+AppUpdateNotification.statusEnum.APP_UPDATE_NOT_FOUND);
                AppUpdateNotification.callbacks.done(AppUpdateNotification.statusEnum.APP_UPDATE_NOT_FOUND);
            }
        }
    },
    _extractMaxVersionNumber: function(inResponseText){
        var TAG = "AppUpdateNotification._extractMaxVersionNumber() - ";
        // The format of directory is "version/", such as "5.0.0/"
        var directories = [];
        try {
            directories = JSON.parse(inResponseText);
        } catch (e) {
            console.log(TAG + "Response text is NOT valid JSON string.");
        }
        
        // Extract the max version number from directories which are created in hpcloud.
        var maxVersionNumber="0";
        for (var i=0, len = directories.length; i<len;i++) {
            var directory = directories[i].name; // -->"5.0.0/"
            var versionNumber = directory;
            if(directory.indexOf("/") > 0) {
                versionNumber = directory.substring(0, directory.length-1);
            }
            console.log(TAG + "version number = " + versionNumber);
            
            if(AppUpdateNotification._isValidVersionNumber(versionNumber)
               && AppUpdateNotification._compareVersionNumbers(maxVersionNumber, versionNumber) < 0){
                maxVersionNumber = versionNumber;
            }
            
        }
        console.log(TAG + "maxVersionNumber=" + maxVersionNumber);
        if(maxVersionNumber == "0")
            return "NOT_FOUND";
        return maxVersionNumber;
        
    },
    /**
     * Compare two software version numbers (e.g. 1.7.1)
     * Returns:
     *
     *  0 if they're identical
     *  negative if v1 < v2
     *  positive if v1 > v2
     *  Nan if they in the wrong format
     *
     *  E.g.:
     *
     *  assert(_compareVersionNumbers("1.7.1", "1.6.10") > 0);
     *  assert(_compareVersionNumbers("1.7.1", "1.7.10") < 0);
     *
     *  "Unit tests": http://jsfiddle.net/ripper234/Xv9WL/28/
     *
     *  Taken from http://stackoverflow.com/a/6832721/11236
     */
    _compareVersionNumbers: function(v1, v2){
        var v1parts=v1.split(".");
        var v2parts=v2.split(".");
        // First, validate both numbers are true version numbers
        
        if (!AppUpdateNotification._isValidVersionNumber(v1) || !AppUpdateNotification._isValidVersionNumber(v2)) {
            return NaN;
        }
        for (var i = 0; i < v1parts.length; ++i) {
            if (v2parts.length === i) {
                return 1;
            }
            
            if (v1parts[i] === v2parts[i]) {
                continue;
            }
            if (v1parts[i] > v2parts[i]) {
                return 1;
            }
            return -1;
        }
        if (v1parts.length != v2parts.length) {
            return -1;
        }
        return 0;
    },

    _isValidVersionNumber: function(v) {
        var parts = v.split(".");
        for (var i=0; i < parts.length; ++i) {
            if(!AppUpdateNotification._isPositiveInteger(parts[i])) {
                return false;
            }
        }
        return true;
    },
    _isPositiveInteger:function(x) {
        // http://stackoverflow.com/a/1019526/11236
        return /^\d+$/.test(x);
    },
    
    _isFunction: function(inObj){
        var getType = {};
        return inObj && getType.toString.call(inObj) == '[object Function]';
    },
    _isString: function(inObj){
        var getType = {};
        return inObj && getType.toString.call(inObj) == '[object String]';
    },
    _isArray: function(inObj){
        var getType = {};
        return inObj && getType.toString.call(inObj) == '[object Array]';
    },
    _ajax:{
            /**
             * ------------------------------------------------------------------------------
             * This is the public method for ajax calls.
             * <code>inParams</code> is an Object that may contain these properties:
             *      url: The URL to request (required).
             *      method: The HTTP method to use for the request. Defaults to GET.
             *      callback: Called when request is completed.
             *      body: Specific contents for the request body for POST method.
             *      headers: Request headers.
             * ------------------------------------------------------------------------------
             */
        request: function(inParams){
            var xhr = this._getXMLHttpRequest();
            
            var method=inParams.method || "GET";
            xhr.open(method, inParams.url, true);
            this._makeReadyStateHandler(xhr, inParams.callback);
            
            //set headers
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            if (inParams.headers) {
                for (var key in inParams.headers) {
                    xhr.setRequestHeader(key, inParams.headers[key]);
                }
            }
            xhr.send(AppUpdateNotification._isString(inParams.body)?inParams.body:this._objectToQuery(inParams.body) || null);
            return xhr;
        },
    
        /**
         * ---------------------------------------
         * These are private methods
         * ---------------------------------------
         */
        _getXMLHttpRequest: function(){
            try {
                return new XMLHttpRequest();
            } catch (e) {}
            try {
                return new ActiveXObject('Msxml2.XMLHTTP');
            } catch (e) {}
            try {
                return new ActiveXObject('Microsoft.XMLHTTP');
            } catch (e) {}
            return null;
        },
        _makeReadyStateHandler: function(inXhr, inCallback){
            inXhr.onreadystatechange = function() {
                if (inXhr.readyState == 4) {
                    var success = inCallback.success;
                    var failure = inCallback.failure;
                    
                    if(AppUpdateNotification._ajax._isFailure(inXhr)){
                        console.log("_makeReadyStateHandler=> Failure");
                        failure && AppUpdateNotification._isFunction(failure) && failure(inXhr, inXhr.responseText);
                    } else {
                        console.log("_makeReadyStateHandler=> Success");
                        success && AppUpdateNotification._isFunction(success) && success(inXhr, inXhr.responseText);
                    }
                }
            };
        },
        _objectToQuery: function(/*Object*/ map) {
            var enc = encodeURIComponent;
            var pairs = [];
            var backstop = {};
            for (var name in map){
                var value = map[name];
                if (value != backstop[name]) {
                    var assign = enc(name) + "=";
                    if (AppUpdateNotification._isArray(value)) {
                        for (var i=0; i < value.length; i++) {
                            pairs.push(assign + enc(value[i]));
                        }
                    } else {
                        pairs.push(assign + enc(value));
                    }
                }
            }
            return pairs.join("&");
        },
        _isFailure: function(inXhr) {
            return (inXhr.status !== 0) && (inXhr.status < 200 || inXhr.status >= 300);
        }
    }
};
/**================================================================================
 * iOS PhoneGap pluign definition - GetAppInfoPlugin: get app id and version number
 */

var GetAppInfoPlugin = {
    get: function(successCallback, failureCallback) {
        return cordova.exec(successCallback, failureCallback, "GetAppInfoPlugin", "get", []);
    }
};
