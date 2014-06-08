package com.hpit.mobile.login;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;


import android.content.pm.PackageManager.NameNotFoundException;
import android.util.Log;
/**
 * Plugin to get appId and version number.
 * 
 * @author chun-yang.wang@hp.com/huixin.ma@hp.com
 *
 */
public class GetAppInfoPlugin extends CordovaPlugin {
    private static final String LOG_TAG = "HPMobileLogin." + GetAppInfoPlugin.class.getSimpleName();
    private static final String ACTION_GET = "get";
    private static final String ACTION_DETECT = "appdetect";

    @Override
    public boolean execute(String action, JSONArray data, CallbackContext callbackContext) throws JSONException {
        Log.d(LOG_TAG, "action=" + action);
        
        if (GetAppInfoPlugin.ACTION_GET.equals(action)) {
	        // Get appId
	        String packageName = cordova.getActivity().getPackageName();
	        Log.d(LOG_TAG, "packageName=" + packageName);
	
	        // Get version number
	        String versionName = "";
	       // Get version code
	        int versionCode = -1;
	        try {
	            versionName = cordova.getActivity().getPackageManager().getPackageInfo(packageName, 0).versionName;
	            versionCode = cordova.getActivity().getPackageManager().getPackageInfo(packageName, 0).versionCode;
	        } catch (NameNotFoundException e) {
	            Log.d(LOG_TAG, "Version name is not found.", e);
	        }
	        Log.d(LOG_TAG, "versionName=" + versionName);

	        
	        String otpInstalled = "NO";
	        if(detectAppExist("com.arcot.otp1")){
	        	otpInstalled = "YES";
	        }

	
	        // Build JSON to return to JS calling
	        String appInfo = String.format("{\"appId\": \"%s\", \"versionNumber\": \"%s\",\"versionCode\": \"%s\",\"otpInstalled\": \"%s\"}", packageName, versionName,versionCode,otpInstalled);
	        Log.d(LOG_TAG, "appInfo=" + appInfo);
	        
	        callbackContext.success(appInfo);
	        return true;
        }
        if (GetAppInfoPlugin.ACTION_DETECT.equals(action)) {
        	String targetPackage = data.optString(0);
        	if(detectAppExist(targetPackage)){
        		callbackContext.success("YES");
            	return true;
        	} else {
        		callbackContext.success("NO");
 	            return true;
        	}
        }
        
        callbackContext.error("Unexpected Error!");
		return false;
    }
    
    private Boolean detectAppExist(String appName){
    	Boolean ret = true;
    	try {
    		cordova.getActivity().getPackageManager().getPackageInfo(appName, 0);
    	} catch (NameNotFoundException e) {
    		ret = false;
    	} 
    	return ret;
    }
    
}
