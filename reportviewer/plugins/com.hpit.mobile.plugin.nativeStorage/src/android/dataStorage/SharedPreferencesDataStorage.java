package com.hpit.mobile.login.dataStorage;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.content.pm.PackageManager.NameNotFoundException;
import android.util.Log;

/**
 * Data Storage Implementation with Shared Preferences.
 * 
 * @author chun-yang.wang@hp.com
 * 
 */
public class SharedPreferencesDataStorage implements IDataStorage {
	private static final String LOG_TAG = "HPMobileLogin." + SharedPreferencesDataStorage.class.getSimpleName();
	private static final String PACKAGE_NAME = "com.hpit.mobile.appcatalog";
	private static final String HP_LOGIN_PREFS_FILE = "HPLoginPrefsFile";

	private SharedPreferences preferences;
	private LoginDataStorageStatus status;

	public SharedPreferencesDataStorage(Context context) {
		init(context);

	}

	private void init(Context context) {
		Context appCatalogContext = null;
		try {
			// If app-catalog app is not installed, NameNotFoundException will be thrown when
			// calling context.createPackageContex() to create app-catalog context.
			appCatalogContext = context.createPackageContext(PACKAGE_NAME, Context.MODE_PRIVATE);
		} catch (NameNotFoundException e) {
			status = LoginDataStorageStatus.APP_CATALOG_NOT_INSTALLED;
			Log.w(LOG_TAG, "AppCatalog (" + PACKAGE_NAME + ") is not installed. " + e.getMessage(), e);
			return;
		}

		int appCatalogUID = appCatalogContext.getApplicationInfo().uid;
		int myUID = context.getApplicationInfo().uid;
		Log.d(LOG_TAG, "appCatalogUID=" + appCatalogUID + ", myUID=" + myUID);
		if (appCatalogUID == myUID) {
			status = LoginDataStorageStatus.OK;
			preferences = appCatalogContext.getSharedPreferences(HP_LOGIN_PREFS_FILE, Context.MODE_PRIVATE);
		} else {
			Log.w(LOG_TAG, "Your application is not using shared user id with AppCatalog");
			status = LoginDataStorageStatus.NOT_SIGNED_BY_HPIT;
		}
	}

	public Boolean put(String key, String value) {
		Editor editor = preferences.edit();
		editor.putString(key, value);
		return editor.commit();
	}

	public String get(String key) {
		return preferences.getString(key, "");
	}

	public LoginDataStorageStatus getStatus() {
		return this.status;
	}
}
