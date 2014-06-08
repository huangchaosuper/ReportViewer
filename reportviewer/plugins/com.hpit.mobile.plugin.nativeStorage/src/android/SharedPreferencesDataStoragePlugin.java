package com.hpit.mobile.login;

import static com.hpit.mobile.login.dataStorage.LoginDataStorageStatus.APP_CATALOG_NOT_INSTALLED;
import static com.hpit.mobile.login.dataStorage.LoginDataStorageStatus.NOT_SIGNED_BY_HPIT;
import static com.hpit.mobile.login.dataStorage.LoginDataStorageStatus.OK;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import android.util.Log;

import com.hpit.mobile.login.dataStorage.IDataStorage;
import com.hpit.mobile.login.dataStorage.LoginDataStorageStatus;
import com.hpit.mobile.login.dataStorage.SharedPreferencesDataStorage;

/**
 * Shared Preferences PhoneGap Plugin
 * 
 * @author chun-yang.wang@hp.com
 * 
 */
public class SharedPreferencesDataStoragePlugin extends CordovaPlugin {
    private static final String LOG_TAG = "HPMobileLogin." + SharedPreferencesDataStoragePlugin.class.getSimpleName();
    private static final String PUT = "put";
    private static final String GET = "get";
    private IDataStorage dataStorage;

    @Override
    public boolean execute(String action, JSONArray data, CallbackContext callbackContext) throws JSONException {

        if (dataStorage == null) {
            dataStorage = new SharedPreferencesDataStorage(cordova.getActivity());
        }

        LoginDataStorageStatus status = dataStorage.getStatus();
        Log.i(LOG_TAG, "status=" + status);

        if (APP_CATALOG_NOT_INSTALLED == status) {
            Log.w(LOG_TAG, "AppCatalog is not installed.");
            callbackContext.error(APP_CATALOG_NOT_INSTALLED.name());
            return true;
        } else if (NOT_SIGNED_BY_HPIT == status) {
            Log.w(LOG_TAG, "Current app has no permission to access shared prefernece of AppCatalog.");
            callbackContext.error(NOT_SIGNED_BY_HPIT.name());
            return true;
        } else if (OK == status) {
            doExecute(action, data, callbackContext);
            return true;
        } else {
            callbackContext.error("UNKNOWN_ERROR");
            return true;
        }

    }

    private void doExecute(String action, JSONArray data, CallbackContext callbackContext) throws JSONException {
        Log.d(LOG_TAG, "action=" + action);
        if (GET.equals(action)) {
            String key = data.getString(0);
            String value = dataStorage.get(key);
            callbackContext.success(value);
        } else if (PUT.equals(action)) {
                String key = data.getString(0);
                String value = data.getString(1);
                dataStorage.put(key, value);
                callbackContext.success();
        }
    }
}
