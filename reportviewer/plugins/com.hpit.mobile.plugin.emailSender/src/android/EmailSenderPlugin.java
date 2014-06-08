package com.hpit.mobile.login;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.Intent;
import android.util.Log;


/**
 * Send Mail.
 * 
 * @author chun-yang.wang@hp.com
 * 
 */
public class EmailSenderPlugin extends CordovaPlugin {
	private static final String LOG_TAG = "HPMobileLogin." + EmailSenderPlugin.class.getSimpleName();
	private Intent sendIntent;

	@Override
	public boolean execute(String action, JSONArray data, CallbackContext callbackContext) throws JSONException {
		Log.d(LOG_TAG, "action=" + action);

		sendIntent = new Intent(Intent.ACTION_SEND);
		sendIntent.setType("message/rfc822");

		String recipientsString = data.optString(0);
		Log.d(LOG_TAG, "recipients=" + recipientsString);
		if(recipientsString!=null){
			String[] recipients = recipientsString.split(",");
			sendIntent.putExtra(Intent.EXTRA_EMAIL, recipients);
		}

		String subject = data.optString(1);
		sendIntent.putExtra(Intent.EXTRA_SUBJECT, subject);

		String text = data.optString(2);
		sendIntent.putExtra(Intent.EXTRA_TEXT, text);
		cordova.getActivity().startActivity(Intent.createChooser(sendIntent, "Sending Email"));
		return true;
	}
}
