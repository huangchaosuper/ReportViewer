package com.hpit.mobile.login.dataStorage;
/**
 * Define a simple interface for data storage.
 * 
 * @author chun-yang.wang@hp.com
 *
 */
public interface IDataStorage {
	/**
	 * Persist to data storage
	 * @param key
	 * @param value
	 * @return Returns true if the new values were successfully written to persistent storage.
	 */
	public Boolean put(String key, String value);
	public String get(String key);
	public LoginDataStorageStatus getStatus();
}
