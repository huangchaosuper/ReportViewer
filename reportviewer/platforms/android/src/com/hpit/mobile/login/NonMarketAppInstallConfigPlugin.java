package com.hpit.mobile.login;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.Intent;
import android.provider.Settings;
import android.provider.Settings.SettingNotFoundException;
import android.util.Log;

/**
 * get the config information about install non market apps
 * 
 * @author huixin.ma@hp.com
 * 
 */
public class NonMarketAppInstallConfigPlugin extends CordovaPlugin {
	private static final String LOG_TAG = "HPMobileLogin." + NonMarketAppInstallConfigPlugin.class.getSimpleName();
	private static final String ACTION_GET = "get";
	private static final String ACTION_SET = "set";

	@Override
	public boolean execute(String action, JSONArray data, CallbackContext callbackContext) throws JSONException {
		Log.d(LOG_TAG, "action=" + action);
		if (NonMarketAppInstallConfigPlugin.ACTION_GET.equals(action)) {
			String a = Settings.Secure.INSTALL_NON_MARKET_APPS;
			try {
				int i = Settings.Secure.getInt(cordova.getActivity().getContentResolver(), a);
				if(i>0){
					Log.d(LOG_TAG, "allowed.");
					callbackContext.success("allowed.");
					return true;					
				} else {
					Log.d(LOG_TAG, "not allowed");
					callbackContext.error("it's not allowed.");
					return true;					
				}
			} catch (SettingNotFoundException e) {
				Log.d(LOG_TAG, "got error. ", e);
				callbackContext.error("got an error!");
				return true;				
			}
		}
		if (NonMarketAppInstallConfigPlugin.ACTION_SET.equals(action)) {
			Log.d(LOG_TAG, "set non market app item.");
			char mainOSVersion = android.os.Build.VERSION.RELEASE.charAt(0);
			Log.d(LOG_TAG, "firstChar = "+ mainOSVersion);
			if(mainOSVersion < '4'){
			    cordova.getActivity().startActivity(new Intent(Settings.ACTION_APPLICATION_SETTINGS));
			} else {
				cordova.getActivity().startActivity(new Intent(Settings.ACTION_SECURITY_SETTINGS));
			}
			callbackContext.success();
			return true;
		}
		
		callbackContext.error("Unexpected Error!");
		return false;
	}

}
