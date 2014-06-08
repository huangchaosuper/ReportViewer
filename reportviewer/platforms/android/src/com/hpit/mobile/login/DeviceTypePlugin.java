package com.hpit.mobile.login;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.res.Configuration;
import android.util.Log;


/**
 * Actual physical size, measured as the screen's diagonal.
 * 
 * @author chun-yang.wang@hp.com
 * 
 */
public class DeviceTypePlugin extends CordovaPlugin {
	private static final String LOG_TAG = "HPMobileLogin." + DeviceTypePlugin.class.getSimpleName();
	private String DEVICE_TYPE_PHONE = "Android_Phone";
	private String DEVICE_TYPE_TABLET = "Android_Tablet";

	@Override
	public boolean execute(String action, JSONArray data, CallbackContext callbackContext) throws JSONException {

	    Configuration config = cordova.getActivity().getResources().getConfiguration();
		int screenLayout = config.screenLayout;
		Log.d(LOG_TAG, "screenLayout=" + screenLayout + ", config="+config.toString());
		
		int size = screenLayout & Configuration.SCREENLAYOUT_SIZE_MASK;
		Log.d(LOG_TAG, "size=" + size);
				
		if (Configuration.SCREENLAYOUT_SIZE_SMALL == size || Configuration.SCREENLAYOUT_SIZE_NORMAL == size
				|| Configuration.SCREENLAYOUT_SIZE_LARGE == size) {
			Log.d(LOG_TAG, "device type is " + DEVICE_TYPE_PHONE);
			callbackContext.success(DEVICE_TYPE_PHONE);
			return true;
		} else {
			Log.d(LOG_TAG, "device type is " + DEVICE_TYPE_TABLET);
			callbackContext.success(DEVICE_TYPE_TABLET);
			return true;
		}
	}
}
