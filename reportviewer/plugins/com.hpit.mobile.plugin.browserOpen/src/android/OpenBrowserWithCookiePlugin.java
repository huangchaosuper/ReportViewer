package com.hpit.mobile.login;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Browser;
import android.util.Log;

public class OpenBrowserWithCookiePlugin extends CordovaPlugin {

    private static final String LOG_TAG = OpenBrowserWithCookiePlugin.class.getSimpleName();
    private static final String ACTION_OPEN = "open";

    @Override
    public boolean execute(String action, JSONArray data, CallbackContext callbackContext) throws JSONException {
        if (OpenBrowserWithCookiePlugin.ACTION_OPEN.equals(action)) {
            String url = data.getString(0);
            String smsession = data.getString(1);
            Log.d(LOG_TAG, "Got data from client, url = " + url + ", smsession = " + smsession);
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            Bundle bundle = new Bundle();
            bundle.putString("SESSIONSM", smsession);
            i.putExtra(Browser.EXTRA_HEADERS, bundle);
            cordova.getActivity().startActivity(i);
            callbackContext.success();
            return true;
        }
        return false;
    }

}
