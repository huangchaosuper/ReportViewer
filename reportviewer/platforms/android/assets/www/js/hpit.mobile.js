/**
 * HP IT Mobility Framework v8.2.0
 * Copyright 2013 (c) HP
 *
 *      Author:
 *           Ma, Hui-Xin (HPIT-DS-CDC) <huixin.ma@hp.com>
 *           Wang, Chun-Yang  (HPIT-DS-CDC) <chun-yang.wang@hp.com>
 *
 *      Reviewers:
 *           Claude, Villermain <claude.villermain@hp.com>
 *           Francois, Connetable <francois.connetable@hp.com>
 *           Vincent, Rabiller <vincent.rabiller@hp.com>
 *           Vincent, Planat <vincent.planat@hp.com>
 */

/**================================================================================
 * HP Login
 */
var hpLogin = (function () {
    /*----------------------------------------
     * Private Variables
     */
    var loginSystem = "SM"; // default
    var env = "ITG"; // default
    var ssoEnabled = true; // default

    var env2UrlMap = "";    // Will be setup in __setupEnv()

    var isAppWebBased = false;
    var isCordovaAvailable = !(typeof cordova === "undefined");
	var isDeviceAvailable = !(typeof device === "undefined");
	var isPluginAvailable = !(typeof DeviceTypePlugin === "undefined");
    var isNativeFeaturesIgnored = false;

    var loginURL = "";
    var logoutURL = "";
	var baseURL = "";
    var loginSysBaseURL = "";
	var targetURL="";

    var loggedUser = "";


    var loginWithCredentialsCallbacks = ""; //holder for "args" passed to loginWithCredentials method.
    var loginAction = ""; //call login.pl with "action=logon" or "action=logononly", login.pl wouldn't call DeclareDevice.
    var logoutCallback = ""; //holder for "args" passed to logout method.

	var _checkLoginSystem = function(inLoginSystem,inCallback){
	    var TAG = "hpLogin._checkLoginSystem() - ";
	    if(!inLoginSystem || inLoginSystem == "OTP"){
		    inLoginSystem = "OTP";
			if(typeof GetAppInfoPlugin !== "undefined"){
			    GetAppInfoPlugin.get(
					function (r) {
						hpLogin.logi(TAG + "PhoneGap Plugin GetAppInfoPlugin success: " + r);
						var resultJson = hpLogin.parseJSON(r);
						if(resultJson.otpInstalled && resultJson.otpInstalled != "YES"){
							inLoginSystem = "SG";
			                _setupForEnv();
							_fireStatusCallback(inCallback,hpLogin.getInitStatusEnum().OTP_ARCOTID_NOT_AVAILABLE);
						} else {
						    _fireStatusCallback(inCallback,hpLogin.getInitStatusEnum().OTP_ARCOTID_AVAILABLE);
						}
					},
					function (e) {
						hpLogin.loge(TAG + "PhoneGap Plugin GetAppInfoPlugin failure: " + e);
						_fireStatusCallback(inCallback,hpLogin.getInitStatusEnum().OTP_ARCOTID_NO_IDEA);
						
					}
				);
			} else {
			    hpLogin.loge(TAG + "PhoneGap Plugin GetAppInfoPlugin failure: undefined");
				_detectDeviceInfo();
			    _setupForEnv();
				_fireStatusCallback(inCallback,hpLogin.getInitStatusEnum().OTP_ARCOTID_NO_IDEA);
			}
		} else {
		    _fireStatusCallback(inCallback,hpLogin.getInitStatusEnum().LOGIN_SESSION_NOT_FOUND);
		}
		loginSystem = hpLogin.assertContains(inLoginSystem, hpLogin.config.loginSystemList);
	};
	
    var _setupForEnv = function () {
        var TAG = "hpLogin._setupForEnv() - ";
        // Setup system
        if (isAppWebBased) {
            var hostname = window.location.hostname;
            var myEnvName = hostnameToEnvName[hostname] || env || "";
			myEnvName = hpLogin.assertContains(myEnvName, hpLogin.config.envList);
            if(myEnvName){
                env = myEnvName;
            }
        } else {
            //read env from local storage
            var storedEnvName = window.localStorage["hpLoginEnvName"] || env || "";			
            hpLogin.logi(TAG + 'storedEnvName=' + storedEnvName);
			storedEnvName = hpLogin.assertContains(storedEnvName, hpLogin.config.envList);
            if (storedEnvName) {
                hpLogin.logd(TAG + 'Found stored env ' + storedEnvName);
                env = storedEnvName;
            } 
        }
		
		if(!env){
		    env = "PROD";
		}
		
        if (loginSystem === "SM") {
            env2UrlMap = hpLogin.config.smEnv2UrlMap;
            logoutURL = hpLogin.config.smLogoutURL;
            baseURL = env2UrlMap[env].baseURL;
            loginURL = baseURL + "/auth/login.pl";
            loginSysBaseURL = baseURL + "/mobility";
			targetURL = loginSysBaseURL + "/headers.pl";

        } else if (loginSystem === "SG" || loginSystem === "SG_SM") {
            env2UrlMap = hpLogin.config.sgEnv2UrlMap;
            logoutURL = hpLogin.config.sgLogoutURL;
            baseURL = env2UrlMap[env].baseURL;
            loginURL = baseURL + "/sec-gw/login";
            loginSysBaseURL = baseURL + "/gw";
			targetURL = baseURL + "/sec-gw/sts/decodesessiontk";
        } else if (loginSystem === "OTP") {
            env2UrlMap = hpLogin.config.sgEnv2UrlMap;
            logoutURL = hpLogin.config.sgLogoutURL;
            baseURL = env2UrlMap[env].baseURL;
            loginURL = baseURL + "/sec-gw/sts/getreservationtk";
            loginSysBaseURL = baseURL + "/gw";
			targetURL = baseURL + "/sec-gw/sts/getreservationtk";
        }

        hpLogin.logi(TAG + "loginSystem=" + loginSystem + ", loginURL=" + loginURL + ", loginSysBaseURL=" + loginSysBaseURL);

    };

    var _detectDeviceInfo = function () {
        var TAG = "hpLogin._detectDeviceInfo() - ";
        hpLogin.logd(TAG + "check current application is running from browser (web-based) or native (hybrid).");
        isAppWebBased = (0 === window.location.protocol.indexOf("http"));

        hpLogin.logi(TAG + "isAppWebBased=" + isAppWebBased + ", isCordovaAvailable=" + isCordovaAvailable + ", isPluginAvailable=" +isPluginAvailable
            + ", isNativeFeaturesIgnored=" + isNativeFeaturesIgnored + ", ssoEnabled=" + ssoEnabled + ", isDeviceAvailable="+isDeviceAvailable);

        //device info
        var checkByUserAgent = !ssoEnabled || isAppWebBased || !isCordovaAvailable || isNativeFeaturesIgnored || isDeviceAvailable || isPluginAvailable;
        hpLogin.device.detectDeviceInfo(checkByUserAgent);
    };

    // ------------ Login ------------
    var _doLogin = function (userId, password) {
        var TAG = "hpLogin.login: _doLogin() - ";
        hpLogin.logd(TAG + "ENTRY");
        hpLogin.logd(TAG + "deviceType=" + hpLogin.device.getDeviceType() + ", osVersion=" + hpLogin.device.getOsVersion()
            + ", deviceId=" + hpLogin.device.getDeviceId() + ", osType=" + hpLogin.device.getOsType());
		

        var myBody = _createLoginBody(userId, password);
		
		if(loginSystem === "OTP"){
		    if(!password || password == true){
				loginURL = baseURL + '/sec-gw/sts/getreservationtk';
				//loginURL = baseURL + '/sec-gw/sts/getreservationtk?user=' + userId + '&nousesm=1&interactive=0&customscheme='+hpLogin.config.cusUrlScheme;
			} else {
			    loginURL = baseURL + "/sec-gw/login";
			}
		}
		hpLogin.logd(TAG + "loginURL=" + loginURL+", method=POST,body=" + myBody);

        hpLogin.ajax.request({
            url: loginURL,
            method: "POST",
            body: myBody,
            callback: {success: _doLoginCallSuccess, failure: _doLoginCallFailure}
        });
    };
	

    var _createLoginBody = function (userId, password) {
	    hpLogin.logd("_createLoginBody, loginSystem=" + loginSystem);
        var myPostBody = "";
        if (loginSystem === "SM") {
            myPostBody = hpLogin.config.smLoginPostBody
                .replace("__USERID__", encodeURIComponent(userId))
                .replace("__PASSWORD__", encodeURIComponent(password))
                .replace("__DEVICEOS__", encodeURIComponent(hpLogin.getOsVersion()))
                .replace("__DEVICETYPE__", encodeURIComponent(hpLogin.getDeviceType()))
                .replace("__DEVICENDUID__", encodeURIComponent(hpLogin.getDeviceId()))
                .replace("__OSTYPE__", encodeURIComponent(hpLogin.getOsType()))
                .replace("__LOGINACTION__", encodeURIComponent(loginAction));
        } else if (loginSystem === "SG") {
            myPostBody = {};
            myPostBody.user = userId;
            myPostBody.password = password;
            myPostBody.idpid = "at_hp";
            myPostBody.interactive = "0";
        } else if (loginSystem === "SG_SM") {
            myPostBody = {};
            myPostBody.user = userId;
            myPostBody.password = password;
            myPostBody.idpid = "sm.at_hp";
            myPostBody.interactive = "0";
        } else if (loginSystem === "OTP") {
		    if(!password || password == true){
			    //myPostBody = null;
				 myPostBody = {};
			     myPostBody.user = userId;
			     myPostBody.interactive = "0";
				 //myPostBody.nousesm = "1";
				 myPostBody.customscheme = hpLogin.config.cusUrlScheme;
			} else {
		        myPostBody = {};
			    myPostBody.user = userId;
			    myPostBody.password = password;
			    myPostBody.idpid = "sotp.at_hp";
			    myPostBody.interactive = "0";
				
			}
			
            
        }

        return myPostBody;
    };
    var _doLoginCallSuccess = function (inXhr, inResponseText) {
        var TAG = "hpLogin._doLoginCallSuccess - ";
        hpLogin.logi(TAG + "inXhr.status=" + inXhr.status + ", inXhr=" + hpLogin.stringifyJSON(inXhr));
        hpLogin.logd(TAG + "inResponseText=" + inResponseText);

        var myLoggedUser = "";
        var smsession = "";
        var sessiontk = "";
		var reservationtk = "";
		var otpTarget = "";

        if (loginSystem === "SM") {
            myLoggedUser = hpLogin.Utils.substringBetween(inResponseText, "<TD>HTTP_SM_UNIVERSALID</TD><TD>", "</TD></TR>");
            smsession = hpLogin.Utils.substringBetween(inXhr.getResponseHeader("Set-Cookie"), "SMSESSION=", ";") || hpLogin.Utils.substringBetween(inResponseText, "SMSESSION</TD><TD>", "</TD>");
        } else if (loginSystem === "SG") {
            /*
             {
             "status":"authenticated",
             "sessiontk":"YlhMVy9IYjVWZmR6TEVYeFZMR0hIUTg5U3Q0QmhtRSt2aUVjZ1E5cStxNTNkU0xxdWhTdHQ4emRia1pzLy95SC8xSlArSVQrMDQzUA0KZVRhWTJCL3RTUT09",
             "target":"/sec-gw/login?idpid=at_hp&interactive=0&user=chun-yang.wang@hp.com"
             }
             */
            var myResponse = hpLogin.parseJSON(inResponseText);
            myLoggedUser = hpLogin.Utils.substringAfter(myResponse.target, "user=");
            sessiontk = myResponse.sessiontk;
        } else if (loginSystem === "SG_SM") {
            /*
             {
             "status": "authenticated",
             "sessiontk": "UTR5MzE3VTlzbWY2dXU2eDVsYzVudWZXT0RrTVdWdzFPSDFmbjVheExJZXNLT1NIenZpUEJGdkZBNVlkMlVsV3o5cVRtTW4xeXpRSQ0KbEFsbTJHOE83Zz09",
             "target": "/sec-gw/login?idpid=sm.at_hp&interactive=0&user=chun-yang.wang@hp.com",
             "smsession": "JU4GIs5gHirWl1aJUE6p/eI5BmuvPZYeexuB0zFJG4Yn/2wMolR6GKHSPx4fDJyxn5I2c8EpFOHBaX6lFwXH+ghOaQkDCSxA5BfMpWt7fs+e5aGN9BpY7tWDjOQ1ttm6FL2ciqKX9i7jRlKV06MlOQ4sBYp7LScPAvo04sWFqwirgCqUFZwdtFnh/Ud8x2Mzu+i9nr+VGIk7yjGWsbzCAvTuLV+Ku/FJw6Z1YfIhhSuhjVJgMSoMmEziRXZMezaUbQwf3PPNmF3NCUSH2NR3qDJZ3pgEQ8SSJFHXd8W0XZudUwr6/pLaWVlVTiw5lEbq2F3T9Jn6+vz4QN94hTvJGgEq0ekymtMKJ8APBa+LshTYgBYF3Jig268JDFNDnE3QjIp6a1ZFx6lsTJAAFxapZEzvgXs5UXanJQJGUmHG8QaPjYLJtczYg/hDVgzRO5VV2XdAtN17/Qw/ScKJV2OCjuphLM+eP1xn6jSfKNydJFJaWWrzDOV197Jq2A6ii/vuLsOSbEUoXl975f1da0Zz1PmYKfhpysmQqMDHIaWSQqCBut2uozPe80vfFzQN0ts4yLlW9EhwgC0tA0Q2KEhBlHdj6jpfashYmJnIEtoj8fBANHb/CEw42GhZ0ookYC5QegSvjtOEdThNtZn5rACNV7pQmyNCvF+7E26zWVJL+b4j67Jk+129w95kNWqr8Brj5KunjGChbnxQVnHopgHMf55uBJ8l9yLHeWpiBkFdlYXAY+j7wfcIZZDhRQdR3ip+6GPtVBcWoJcfiRdm1jJGQ5YxaOWA97Yt8qckPhxN8ZfsGsw/eudGowwgqbGJZueRRmwNfw5/3eid5lm8x+YB19yZzR1NwPYmTUWqwLsRyt/FEo3JAEz5ccW4jMTF73Zz3JlUBg5UTyWt7SK8H5FWvChivBWrk4RaTpyH+FkLcl+FElQ1BCZWbQohLVAqOHHogYBOj8ciAp93XE0WErDSYQDOJOzPEYqqfek7zWxWazPNbdo4a5ZDQzqMNjsebIpnYvlMdnVwE1xcykrowMeCEZHIGwzaNJ6nU1iIpEx31ykLxO8hnamrFusIZuiCNUxGC2SMVH9IKTsAE4guytc62MAn7bSCajCnP4fW3D2h5Im15SXGdkXoap0t/aMkqdl4"
             }
             */
            var myResponse = hpLogin.parseJSON(inResponseText);
            myLoggedUser = hpLogin.Utils.substringAfter(myResponse.target, "user=");
            smsession = myResponse.smsession;
            sessiontk = myResponse.sessiontk;
        } else if (loginSystem === "OTP") {
		    /*
			 before login
             {
             "status": "success",
             "target": "otp://g?n=huixin.ma%40hp.com&u=https%3A%2F%2Fit-services-gw-itg.external.hp.com%2Fsec-gw%2Fsts%2Fsignonreservationtk%3Fuser%3Dhuixin.ma%40hp.com%26rtk%3D7db050da1587d7e8fc6891badc3afd760df50104eb34d09801d6ac22c00535%26",
             "reservationTk":"7db050da1587d7e8fc6891badc3afd760df50104eb34d09801d6ac22c00535"
             }
			 after login
			 {
             "status": "success",
             "sessiontk": "UTR5MzE3VTlzbWY2dXU2eDVsYzVudWZXT0RrTVdWdzFPSDFmbjVheExJZXNLT1NIenZpUEJGdkZBNVlkMlVsV3o5cVRtTW4xeXpRSQ0KbEFsbTJHOE83Zz09"
             }
             */
		    var myResponse = hpLogin.parseJSON(inResponseText);
			if(myResponse.reservationTk){
			    myLoggedUser = unescape(hpLogin.Utils.substringBetween(myResponse.target, "n=","&u="));
			    reservationtk = myResponse.reservationTk;
				otpTarget = myResponse.target;
			}
			if(myResponse.sessiontk){
			    if(myResponse.userid){
			        myLoggedUser = myResponse.userid;
				} else {
				    myLoggedUser = hpLogin.Utils.substringAfter(myResponse.target, "user=");
				}
                sessiontk = myResponse.sessiontk;
				if(myResponse.SMSESSION){
				    smsession = myResponse.SMSESSION;
				}
			}
		}

        hpLogin.logi(TAG + "loginRequest.done() --> loggedUser=" + myLoggedUser
            + "; smsession=" + hpLogin.Utils.truncateSMSESSION(smsession)
            + "; sessiontk=" + hpLogin.Utils.truncateSMSESSION(sessiontk)
			+ "; reservationtk="+hpLogin.Utils.truncateSMSESSION(reservationtk));

        if (myLoggedUser && (smsession || sessiontk || reservationtk)) {
            loggedUser = myLoggedUser;
			if(loggedUser){
			    window.localStorage.setItem("lastLoggedUser",loggedUser);
			}
			hpLogin.logi(TAG + "loggedUser and sessiontk or smsession are found in response. --> User signed in successfully. To refresh stored LoginSession");
			hpLogin.sessionManager.persist(sessiontk, smsession, loginSystem, env, myLoggedUser);

			if(reservationtk){
			    hpLogin.logi(TAG + "loggedUser and reservationtk are found in response. --> call OTP successfully. To refresh stored LoginSession");
				_persistLocalVariables();
				window.location = otpTarget;
				return;
			}

            _fireLoginSuccess(myLoggedUser);
        } else {
            hpLogin.logi(TAG + "loginRequest.done() - login failure --> loggedUser or session is not found in response.");
            _fireLoginFailure(hpLogin.getLoginFailureEnum().INCORRECT_CREDENTIALS, "");
        }
    };
	
    var _doLoginCallFailure = function (inXhr, inResponseText) {
        var TAG = "hpLogin.loginCallFailure - ";
        hpLogin.logi(TAG + "loginRequest.fail() - inXhr.status=" + inXhr.status + ", inXhr=" + hpLogin.stringifyJSON(inXhr));
		hpLogin.logi(TAG + "loginRequest.fail() - inResponseText="+inResponseText)

        var reason;
        if (inXhr.status === 0) {
            reason = hpLogin.getLoginFailureEnum().CONNECTION_TIMES_OUT;
        } else if (inXhr.status === 401) {
            reason = hpLogin.getLoginFailureEnum().INCORRECT_CREDENTIALS;
        } else {
            reason = hpLogin.getLoginFailureEnum().INTERNAL_ERROR;
        }

        _fireLoginFailure(reason, "");
    };
	
	
	var _persistLocalVariables = function(){
	    hpLogin.logd("_persistLocalVariables() entry.");
	    var localData = {};
		localData.env = env;
		localData.loginSystem = loginSystem;
		localData.ssoEnabled = ssoEnabled;
		window.localStorage.setItem("hpLoginEnvName", env);
		hpLogin.logd("_persistLocalVariables(), localData = "+hpLogin.stringifyJSON(localData));
		window.localStorage.setItem("OTP_LocalVariables", hpLogin.stringifyJSON(localData));
		
	};
	
	var _restoreLocalVariables = function(){
	    hpLogin.logd("_restoreLocalVariables() entry.");
		var localData = hpLogin.parseJSON(window.localStorage.getItem("OTP_LocalVariables") || "{}");
		if(localData.env){
			env = localData.env;
			loginSystem = localData.loginSystem;
			ssoEnabled = localData.ssoEnabled;
			window.localStorage.removeItem("OTP_LocalVariables");
			return true;
		} else {
		    return false;
		}
	};
	
	var _restoreSession = function(isOTPReopen,inCallback){
	    var TAG = "hpLogin._restoreSession() - ";
		hpLogin.logd(TAG + "entry!");
	    var checkSessionCallback = function(status, loggedUser){
		    var TAG = "hpLogin.checkSessionCallback() - ";
		    hpLogin.logd(TAG+"checkSessionCallback() Entry");
		    if(hpLogin.getInitStatusEnum().SIGNED_IN == status){
			    hpLogin.logd("hpLogin.checkSessionCallback(): redeem session success.");
				_fireStatusCallback(inCallback,status,loggedUser);
			} else {
			    hpLogin.logd("hpLogin.checkSessionCallback(): redeem session failure.");
				if(hpLogin.getInitStatusEnum().UNKNOWN_ERROR == status || hpLogin.getInitStatusEnum().OTP_NO_USERID_NO_COOKIE == status){
			        _checkLoginSystem(loginSystem,inCallback);
				} else {
				    _fireStatusCallback(inCallback,status,loggedUser);
				}
			}
		};			
		var restoreCallback = function(isSuccess, status, loggedUser){
		    var TAG = "hpLogin.restoreCallback() - ";
		    if(isSuccess){
			    hpLogin.logd(TAG + "restoreCallback(): restore local session success.");
			    _fireStatusCallback(inCallback,status,loggedUser);
			} else {
			    hpLogin.logd(TAG + "restoreCallback(): restore local session failed.");
				//try to redeem session	                					
				_checkOTPSessionTk(checkSessionCallback);					
			}
		};			
		//try to restore session from local
		hpLogin.sessionManager.restore(loginSystem, env, restoreCallback);
	};
	
	var _checkOTPSessionTk = function(inCallback){
	    var TAG = "hpLogin._checkOTPSessionTk() - ";
		hpLogin.logd(TAG + "entry");
		if(loginURL && loginSystem == "OTP"){
		    hpLogin.logd(TAG + "check loginURL = "+loginURL);
			hpLogin.ajax.request({
                url: loginURL,
                method: "POST",
				body:{"nousesm":"1","interactive":"0"},
                callback: {success: function (inXhr, inResponseText){				    
				    var myResponse = hpLogin.parseJSON(inResponseText);
					var myLoggedUser = "";
                    var smsession = "";
                    var sessiontk = "";
					hpLogin.logd(TAG + "_checkOTPSessionTk success.inResponseText="+inResponseText);
					if(myResponse.sessiontk){
                        sessiontk = myResponse.sessiontk;
						loggedUser = myResponse.userid;
						hpLogin.logd(TAG + "loggedUser = "+loggedUser+",sessiontk="+sessiontk);
						if(myResponse.SMSESSION) {
						    smsession = myResponse.SMSESSION;
						    hpLogin.logd(TAG + "loggedUser = "+loggedUser+",smsession="+smsession);
					    }
						hpLogin.sessionManager.persist(sessiontk, smsession, "OTP", env, loggedUser);
						if(inCallback){
						    hpLogin.logd(TAG + "success call _fireStatusCallback(). ");
							_fireStatusCallback(inCallback,hpLogin.getInitStatusEnum().SIGNED_IN,loggedUser);
                        }						
			        } else if(myResponse.status && myResponse.status == "error"){
					    if(myResponse.faultCode){
					        hpLogin.logi(TAG + "error,  faultCode="+myResponse.faultCode);
							if(inCallback){
								hpLogin.logd(TAG + "success call _fireStatusCallback(). ");
								_fireStatusCallback(inCallback,parseInt(myResponse.faultCode),myResponse.userid);
							}
							
						} else {
						    hpLogin.logd(TAG + "error call _fireStatusCallback(). ");
							_fireStatusCallback(inCallback,hpLogin.getInitStatusEnum().UNKNOWN_ERROR,myResponse.userid);
						}
					} else {
					    hpLogin.logi(TAG + "success, but get sessiontk failure. ");
					    if(inCallback){
							hpLogin.logd(TAG + "call _fireStatusCallback(). ");
							_fireStatusCallback(inCallback,hpLogin.getInitStatusEnum().UNKNOWN_ERROR,myResponse.userid);
						}
					    
					}
				}, 
				failure: function (inXhr, inResponseText) {
				    hpLogin.logd(TAG + "_checkOTPSessionTk failure.");
				    var reason;
                    if (inXhr.status === 0) {
                        reason = hpLogin.getLoginFailureEnum().CONNECTION_TIMES_OUT;
                    } else if (inXhr.status === 401) {
                        reason = hpLogin.getInitStatusEnum().OTP_NO_USERID_NO_COOKIE;
                    } else {
                        reason = hpLogin.getLoginFailureEnum().INTERNAL_ERROR;
                    }
					hpLogin.logi(TAG + "failure inResponseText = "+inResponseText);
					hpLogin.logi(TAG + "failure reason = "+reason);
					if(inCallback){
						hpLogin.logd(TAG + "failure call _fireStatusCallback(). ");
						//reason = hpLogin.getJsonKey(hpLogin.getLoginFailureEnum(),reason);
						_fireStatusCallback(inCallback,reason,"");
					}
			    }}
            });
		} else {
		    _fireStatusCallback(inCallback,hpLogin.getInitStatusEnum().LOGIN_SESSION_NOT_FOUND,"");
		}
	};
    var _fireLoginSuccess = function (userId,otpTarget) {
	    hpLogin.logd("hpLogin._fireLoginSuccess() entry.loginWithCredentialsCallbacks = "+hpLogin.stringifyJSON(loginWithCredentialsCallbacks));
	    if(otpTarget){
		    hpLogin.logi("hpLogin._fireLoginSuccess(): otpTarget = "+otpTarget);
			window.location = otpTarget;
		} else if (loginWithCredentialsCallbacks.success && hpLogin.Utils.isFunction(loginWithCredentialsCallbacks.success)) {
            hpLogin.logi("hpLogin._fireLoginSuccess(): login success --> userId=" + userId + ", call back: " + loginWithCredentialsCallbacks.success);
            loginWithCredentialsCallbacks.success(userId);
        }
    };

    var _fireLoginFailure = function (reason, userId) {
        if (loginWithCredentialsCallbacks.failure && hpLogin.Utils.isFunction(loginWithCredentialsCallbacks.failure)) {
            hpLogin.logi("hpLogin._fireLoginFailure(): login failure --> userId=" + userId + ", call back: " + loginWithCredentialsCallbacks.failure);
            loginWithCredentialsCallbacks.failure(reason, userId);
        }
    };
	
	var _fireStatusCallback = function(callback, status, userid){
	    hpLogin.logd("_fireStatusCallback() - ENTRY, status="+status);
	    if(callback && hpLogin.Utils.isFunction(callback)){
		    callback(status,userid||"");
		}
	};
    // ------------ End of Login ------------


    // ------------ Logout ------------
    var _doLogout = function () {
        var TAG = "hpLogin._doLogout - ";
        hpLogin.logd(TAG + "ENTRY");
        var myLogoutURL = logoutURL.replace("__BASEURL__", baseURL); // This is for site minder
        hpLogin.logd(TAG + "logoutURL=" + myLogoutURL);
        hpLogin.ajax.request({
            url: myLogoutURL,
            method: "GET",
            callback: {success: _doLogoutCallSuccess, failure: _doLogoutCallFailure}
        });
    };
    var _doLogoutCallSuccess = function (inXhr, inResponseText) {
        var TAG = "hpLogin._doLogoutCallSuccess - ";
		hpLogin.logd(TAG + "Set SESSION with value 'LOGOUT'. To refresh LoginSession storage.");
        hpLogin.sessionManager.logout(loginSystem,env);
        hpLogin.logi(TAG + "inXhr.status=" + inXhr.status + ", inXhr=" + hpLogin.stringifyJSON(inXhr));
        _fireLogoutDone(loggedUser);
    };
    var _doLogoutCallFailure = function (inXhr, inResponseText) {
        var TAG = "hpLogin._doLogoutCallFailure - ";
        hpLogin.logi(TAG + "inXhr.status=" + inXhr.status + ", inXhr=" + hpLogin.stringifyJSON(inXhr));
        _fireLogoutDone(loggedUser);
    };
    var _fireLogoutDone = function (userId) {
        if (logoutCallback && hpLogin.Utils.isFunction(logoutCallback)) {
            hpLogin.logi("hpLogin.logout(): done --> userId=" + userId + ", call back: " + logoutCallback);
            logoutCallback(userId);
        }
    };
    // ------------ End of Logout ------------


    var _openUrlWithSSOAfterInit = function (inURL, smSession) {
        var TAG = "hpLogin._openUrlWithSSOAfterInit(): ";
        if (smSession) {
            hpLogin.logd(TAG + "SESSION is valid --> Open with PhoneGap plugin.");
            var requestURL = env2UrlMap[env].baseURL + "/auth/checksession.pl?targeturl=" + encodeURIComponent(inURL);
            BrowserOpenPlugin.open(encodeURI(requestURL), smSession,
                function (r) {
                    hpLogin.logd(TAG + "PhoneGap Plugin open success: " + r);
                },
                function (e) {
                    hpLogin.loge(TAG + "PhoneGap Plugin open failure: " + e);
                    window.open(inURL);
                }
            );
        } else {
            hpLogin.logd(TAG + "SESSION is NOT valid --> Directly open in new window.");
            window.open(inURL);
        }
    };

    //Public Variables and Methods
    return {
        //Device Info
        getDeviceId: function () {
            return hpLogin.device.getDeviceId();
        },
        getDeviceType: function () {
            return hpLogin.device.getDeviceType();
        },
        getOsVersion: function () {
            return hpLogin.device.getOsVersion();
        },
        getOsType: function () {
            return hpLogin.device.getOsType();
        },
		getBaseURL: function(){
		    if(!baseURL){
			    _setupForEnv();
			}
            return baseURL;
        },
		//it should be loginSysBaseURL, for consistency with old version here
        getSRPBaseURL: function () {
            return loginSysBaseURL;
        },
		getTargetURL: function(){
            return targetURL;
        },
        getInitStatusEnum: function () {
            return hpLogin.config.initStatusEnum;
        },
        getLoginFailureEnum: function () {
            return hpLogin.config.loginFailureEnum;
        },
        getLoggedUser: function () {
            return loggedUser || window.localStorage.getItem("lastLoggedUser") || "";
        },
        isAppWebBased: function () {
            return isAppWebBased;
        },
        getLoginURL: function () {
            return loginURL;
        },
        getLoginActionEnum: function () {
            return hpLogin.config.loginActionEnum;
        },
        getLoginSystemEnum: function () {
            return hpLogin.config.systemNameEnum;
        },
		getLoginSystem:function(){
		    return loginSystem;
		},
        /*-----------------------------------------------------------------------------------------------
         *  == Deprecated since v8.1.0, please use the new API "initialize(inLoginSystem, inSSOFlag, inCusUrlScheme, inCallback) ==
         * Public login API: init(args, inSystemName)
         * 
         * Description:
         *     Initialize HP mobility login & SSO framework (e.g. check if user is already signed-in in another application)
         *
         * Input Parameters:
		 *   -args = json object, can include multiple param items
         *     - args.done(required) = doneCallback: function(status, userId)
         *         - status = Status indicator telling the calling application if there is an active session or not (either because the user isnâ€™t signed-in or if there was any kind of error)
         *         - userId = email of user currently signed-in OR of user who last signed-in
		 *     - args.ssoEnabled(optional) = true or false, set sso enabled.
		 *	   - args.cusUrlScheme(optional) = custom url scheme or ""
		 *	 - inSystemName(optional) = set login system, values: "SM", "SG", "SG_SM", "OTP", default: "OTP"
		 *  Demo:
		 *      init({
		 *           done: function(status, userId){"do something"},      --required
		 *           ssoEnabled: true,                                        --optional
		 *			 cusUrlScheme: "custom url scheme"                        --optional
		 *		     },hpLogin.getLoginSystemEnum().SECURITY_GATEWAY)
		 *
         */
        init: function (args, inSystemName) {
            var TAG = "hpLogin.init(): ";
			hpLogin.logd(TAG+"entry");
			var inSSOFlag;
			if(typeof args.ssoEnabled === "undefined"){
			    inSSOFlag = true;
			} else {
			    inSSOFlag = args.ssoEnabled;
			}
			this.initialize(inSystemName, inSSOFlag, args.cusUrlScheme|| "", args.done); // old init function for the version before 8.0.5
            hpLogin.logd(TAG+"EXIT");
        },
		
		 /*-----------------------------------------------------------------------------------------------
         * Public login API: initialize(inLoginSystem, inSSOFlag, inCusUrlScheme, inCallback)
         * 
         * Description:
         *     New API to initialize HP mobility login & SSO framework (e.g. check if user is already signed-in in another application)
         *
         * Input Parameters:
         *     - inLoginSystem = set login system, values: "SM", "SG", "SG_SM", "OTP" default: "OTP"
         *     - inSSOFlag = true or false, set sso enabled
         *     - inCusUrlScheme = custom url scheme or ""
         *     - inCallback: function(status, userId)
         *         - status = Status indicator telling the calling application if there is an active session or not (either because the user isnâ€™t signed-in or if there was any kind of error)
         *         - userId = email of user currently signed-in OR of user who last signed-in
         *
		 *  Demo:
		 *      initialize(hpLogin.getLoginSystemEnum().SECURITY_GATEWAY, true, "myCusUrlScheme", function(status, userId){
		 *                  //do something
		 *				   })
		 *
         */
        initialize: function (inLoginSystem, inSSOFlag, inCusUrlScheme, inCallback) {
            var TAG = "hpLogin.initialize() - ";
			hpLogin.logd(TAG+"Entry");
			//read env from local storage
			var storedEnvName = window.localStorage["hpLoginEnvName"] || env;
            env = hpLogin.assertContains(storedEnvName, hpLogin.config.envList);
            ssoEnabled = inSSOFlag;
			hpLogin.config.cusUrlScheme = inCusUrlScheme;
			loginSystem = inLoginSystem || loginSystem;
			
			var isOTPReopen = _restoreLocalVariables();
			_detectDeviceInfo();
			_setupForEnv();
            _restoreSession(isOTPReopen,inCallback)
			
            hpLogin.logd(TAG+"EXIT");
        },

        /*
         *  == Deprecated since v8.1.0. This function is not required since v8.1.0. ==
         */
        setEnv: function (inEnv) {
            var TAG = "hpLogin.setEnv: ";
            hpLogin.logd(TAG + "inEnv=" + inEnv);

            env = hpLogin.assertContains(inEnv, hpLogin.config.envList);
			window.localStorage.setItem("hpLoginEnvName", env);

            hpLogin.logd(TAG + "Update environment setup");
            _setupForEnv();

        },
		
		getEnv: function(){
            env = window.localStorage["hpLoginEnvName"] || env;
            return env;
        },
		getInitStatus: function(){
            return hpLogin.sessionManager.getInitStatus();
        },

        /*-----------------------------------------------------------------------------------------------
         * Public login API: loginWithCredentials(userId, password, {success: successCallback(userId), failure: failureCallback(reason, userId)})
         * 
         * Description:
         *     Login with credentials (userId and password) provided by caller. Store SiteMinder session cookie to allow SSO between applications.
         *
         * Input Parameters:
         *     - userId = email of user provided by caller
         *     - password = password of user provided by caller,for OTP, use true or passcode, true = use pin code to login.
         *     - successCallback: function(userId)
         *         - userId = email of user currently signed-in
         *     - failureCallback: function(reason, userId)
         *         - reason = reason of failure, such as connection times out or userId/password is not correct.
         *         - userId = email entered in User Id login form
         *
         */
        loginWithCredentials: function (userId, password, args) {
            var TAG = "hpLogin.login: loginWithCredentials() - ";
            hpLogin.logd(TAG + "ENTRY");

            loginWithCredentialsCallbacks = args;
            loginAction = args.action || hpLogin.getLoginActionEnum().LOGON;//logon or logononly (wouldn't call DeclareDevice)
            if (userId && password) {
			    _doLogin(userId, password);
            } else {
                _fireLoginFailure(hpLogin.config.loginFailureEnum.INCORRECT_CREDENTIALS, userId);
            }
        },
		
		 /*-----------------------------------------------------------------------------------------------
         * Public login API: loginWithOTP(userId, {success: successCallback(userId), failure: failureCallback(reason, userId)})
         * 
         * Description:
         *     Login with user id and pin code with return back function,store sessiontk to allow SSO between applications.
         *
         * Input Parameters:
         *     - userId = email of user provided by caller
         *     - successCallback: function(userId)
         *         - userId = email of user currently signed-in
         *     - failureCallback: function(reason, userId)
         *         - reason = reason of failure, such as connection times out or userId/password is not correct.
         *         - userId = email entered in User Id login form
         *
         */
        loginWithOTP: function (userId, args) {
            var TAG = "hpLogin.login: loginWithOTP() - ";
            hpLogin.logd(TAG + "ENTRY");

            hpLogin.loginWithCredentials(userId, true, args);
        },

        /* --------------------------------------------------------------------------------
         * Public HPLogin API: logout({done: doneCallback(userId)})
         * 
         *    Description: 
         *        Sign out user, delete stored SiteMinder session cookie value
         *        
         *    Input Parameters:
         *        - doneCallback: function(userId)
         *            - userId = email of previously signed-in user
         */
        logout: function (callback) {
            var TAG = "hpLogin.logout ";
            logoutCallback = callback;
            _doLogout();
        },

        openUrlWithSSO: function (inURL) {
            var TAG = "hpLogin.openUrlWithSSO(): ";
            hpLogin.logd(TAG + "Entry");

            if (isAppWebBased || hpLogin.device.getOsType() == "NonSupportedOS" || !isCordovaAvailable || isNativeFeaturesIgnored) {
                hpLogin.logd(TAG + "SSO feature is not available. It will call window.open() to open the url");
                window.open(inURL);
                return;
            }

            if (baseURL) { // HPLogin isn't initialized yet ==> retrieve last session info from local storage
                _setupForEnv();

                var loginSessionKey = loginSystem + "_" + env;
                NativeStoragePlugin.get(loginSessionKey,
                    function (inResult) {
                        var smSession = "";
                        if (inResult) {
                            var loginSession = hpLogin.parseJSON(inResult);
                            if (loginSession) {
                                smSession = loginSession.sessionToken || loginSession.SMSESSION || "";
                            }
                        }
                        _openUrlWithSSOAfterInit(inURL, smSession);
                    },
                    function (e) {
                        _openUrlWithSSOAfterInit(inURL, "");
                    }
                );
            } else {  // HPLogin is initialized
                _openUrlWithSSOAfterInit(inURL, "");
            }
        },


        loge: function (message) {
            hpLogin.logger.loge(message);
        },
        logi: function (message) {
            hpLogin.logger.logi(message);
        },
        logd: function (message) {
            hpLogin.logger.logd(message);
        },
        getLogs: function () {
            return hpLogin.logger.getLogs();
        },
        getLogLevelEnum: function () {
            return hpLogin.logger.getLogLevelEnum();
        },
        getLogAppenderEnum: function () {
            return hpLogin.logger.getLogAppenderEnum();
        },
        getLogLevel: function () {
            return hpLogin.logger.getLogLevel();
        },
        getLogAppenders: function () {
            return hpLogin.logger.getLogAppenders();
        },
        setLogLevel: function (inLogLevel) {
            hpLogin.logger.setLogLevel(inLogLevel);
        },
        setLogAppenders: function (inLogAppenders) {
            hpLogin.logger.setLogAppenders(inLogAppenders);
        },

        ignoreNativeFeatures: function () {
            isNativeFeaturesIgnored = true;
        },
        getDeviceInfo: function () {
            return  "deviceId=" + hpLogin.device.getDeviceId() + ", osVersion=" + hpLogin.device.getOsVersion() + ", deviceType=" + hpLogin.device.getDeviceType() + ", osType=" + hpLogin.device.getOsType();
        },
        isSsoDisabled: function () {
            return !ssoEnabled;
        },
		refreshSMSESSION: function(inXhr){
		    hpLogin.sessionManager.refreshSMSESSION(inXhr,env,loggedUser);
		}

    };
})();

/**
 * HP IT Mobility Framework 8.0.6
 * Copyright 2013 (c) HP
 *
 * Directly using XMLHttpRequest to do Ajax calls. The implementation is inspired by EnyoJS.
 */
hpLogin.ajax = {
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
    request: function (inParams) {
        var xhr = this._getXMLHttpRequest();
        var method = inParams.method || "GET";
        xhr.open(method, inParams.url, true);
        this._makeReadyStateHandler(xhr, inParams.callback);

        //set headers
        if (inParams.headers) {
            if (!inParams.headers.hasOwnProperty("Content-Type")) {
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            }
            for (var key in inParams.headers) {
                xhr.setRequestHeader(key, inParams.headers[key]);
            }
        } else {
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        }
        xhr.send(hpLogin.Utils.isString(inParams.body) ? inParams.body : this._objectToQuery(inParams.body) || null);
        return xhr;
    },

    /**
     * ---------------------------------------
     * These are private methods
     * ---------------------------------------
     */
    _getXMLHttpRequest: function () {
        try {
            return new XMLHttpRequest();
        } catch (e) {
        }
        try {
            return new ActiveXObject('Msxml2.XMLHTTP');
        } catch (e) {
        }
        try {
            return new ActiveXObject('Microsoft.XMLHTTP');
        } catch (e) {
        }
        return null;
    },
    _makeReadyStateHandler: function (inXhr, inCallback) {
        inXhr.onreadystatechange = function () {
            if (inXhr.readyState == 4) {
                var success = inCallback.success;
                var failure = inCallback.failure;

                if (hpLogin.ajax._isFailure(inXhr)) {
                    hpLogin.logd("_makeReadyStateHandler=> Failure");
                    failure && hpLogin.Utils.isFunction(failure) && failure(inXhr, inXhr.responseText);
                } else {
                    hpLogin.logd("_makeReadyStateHandler=> Success");
                    success && hpLogin.Utils.isFunction(success) && success(inXhr, inXhr.responseText);
                }
            }
        };
    },
    _objectToQuery: function (/*Object*/ map) {
        var enc = encodeURIComponent;
        var pairs = [];
        var backstop = {};
        for (var name in map) {
            var value = map[name];
            if (value != backstop[name]) {
                var assign = enc(name) + "=";
                if (hpLogin.Utils.isArray(value)) {
                    for (var i = 0; i < value.length; i++) {
                        pairs.push(assign + enc(value[i]));
                    }
                } else {
                    pairs.push(assign + enc(value));
                }
            }
        }
        return pairs.join("&");
    },
    _isFailure: function (inXhr) {
        return (inXhr.status < 200 || inXhr.status >= 300);
    }
};hpLogin.config = {
    loginSystemList: ["SM", "SG", "SG_SM","OTP"],
    envList: ["DEV", "ITG", "PROD"],
    smEnv2UrlMap: {
        "DEV": {baseURL: "https://d9t0254g.houston.hp.com"},
        "ITG": {baseURL: "https://it-services-itg.external.hp.com"},//https://it-services-gw-itg.external.hp.com
        "PROD": {baseURL: "https://it-services.external.hp.com"}
    },
	//SG and OTP has the same base url
    sgEnv2UrlMap: {
        "DEV": {baseURL: "https://d4t0178g.houston.hp.com:8443"},
        "ITG": {baseURL: "https://it-services-gw-itg.external.hp.com"},
        "PROD": {baseURL: "https://it-services-gw.external.hp.com"}
    },
	cusUrlScheme:"",
	hostnameToEnvName: {
        //SM
        "d9t0254g.houston.hp.com":"DEV",
        "it-services-itg.external.hp.com":"ITG",
        "it-services.external.hp.com":"PROD",
        //Also include additional URLs in the list for the direct address of web servers, and even IIS servers on which this is hosted
        "d9w0602g.houston.hp.com": "DEV",
        "g9t1264g.houston.hp.com": "ITG",
        "g9w1488g.houston.hp.com": "ITG",
        "g9w1489g.houston.hp.com": "ITG",
        "g5t0608g.atlanta.hp.com": "PROD",
        "g6t0625g.atlanta.hp.com": "PROD",
        "g5w2688g.atlanta.hp.com": "PROD",
        "g6w2453g.atlanta.hp.com": "PROD",

        //SG
        "d4t0178g.houston.hp.com":"DEV",
        "g9t2412g.houston.hp.com":"ITG",
        "g1t2959g.austin.hp.com":"PROD"
    },
    initStatusEnum: {
        SIGNED_IN: 1,
        APP_CATALOG_NOT_INSTALLED: 2,
        NOT_SIGNED_BY_HPIT: 3,
        LOGIN_SESSION_NOT_FOUND: 4,
        LOGIN_SESSION_DATA_BROKEN: 5,
        SESSION_TIME_OUT: 6,
        SET_COOKIE_FROM_CLIENT_SUCCESS: 7,
        SET_COOKIE_FROM_CLIENT_FAILURE: 8,
        SIGNED_IN_FAILURE: 9,
        SSO_DISABLED: 10,
        DEVICEID_NOT_FOUND: 31,
        UNKNOWN_ERROR: 99,
		OTP_ARCOTID_AVAILABLE:10001,
		OTP_ARCOTID_NOT_AVAILABLE:10002,
		OTP_ARCOTID_NO_IDEA:10003,
		OTP_NO_USERID_NO_COOKIE:10004,
		OTP_AUTHENTICATE_FAILED:53000,
		OTP_ARCOTID_ERROR:53001,
		OTP_INVALID_RESERVATIONTK:53002,
		OTP_ATTEMPTS_TOO_MANY:53003,
		OTP_AUTHENTICATE_OR_GENERATE_RESERVATIONTK_FAILED:53004,
		OTP_RESERVATIONTK_UPDATE_FAILED:53011,
		OTP_ATTEMPTS_COUNTER_UPDATE_FAILED:53012		
    },
    loginFailureEnum: {
        INCORRECT_CREDENTIALS: 1,
        CONNECTION_TIMES_OUT: 2,
        USER_CANCELLED: 3,
        INTERNAL_ERROR: 9
    },

    loginActionEnum: {"LOGON": "logon", "LOGON_ONLY": "logononly"},
    smLoginPostBody: "action=__LOGINACTION__&user=__USERID__&password=__PASSWORD__&deviceos=__DEVICEOS__&devicetype=__DEVICETYPE__&deviceNDUID=__DEVICENDUID__&osType=__OSTYPE__",
    smLogoutURL: "__BASEURL__/mobility/template.LOGOUT",
    sgLogoutURL: '__BASEURL__/sec-gw/logout',

    // The followings are kept to be compatible with legacy release (before v8.1.0).
    systemNameEnum: {"SITE_MINDER": "SM", "SECURITY_GATEWAY": "SG", "SECURITY_GATEWAY_SM": "SG_SM", "OTP": "OTP"}

};hpLogin.device = (function () {
    "use strict";

    var deviceId = ""; //e.g. deviceId="e11aa9f0e8b0017e0664ce397fb5e83e027ee1d8";
    var osVersion = ""; //e.g. osVersion="4.0.3";
    var deviceType = ""; //e.g. for webOS, deviceType="Veer", for android, "Android_Phone" or "Android_Tablet";
    var osType = ""; //Presently, we have OS type values 'Web Based', 'WebOS', 'iOS' and 'Android'.


    var _retrieveDeviceInfo = function (checkByUserAgent) {
        var TAG = "hpLogin.device._retrieveDeviceInfo() - ";

        hpLogin.logd(TAG + "checkByUserAgent=" + checkByUserAgent);
        //device info
        if (checkByUserAgent) {
            var userAgent = navigator.userAgent;
            hpLogin.logi(TAG + "userAgent=" + userAgent);
            osType = _getOsTypeForWebBased();
            osVersion = _getOsVersionForWebBased();
            deviceType = _getDeviceTypeForWebBased();
            deviceId = _getDeviceIdForWebBased();
        } else {
            osVersion = _getOsVersionForHybrid();
            osType = _getOsTypeForHybrid();
            _fetchDeviceTypeForHybrid();
            _fetchDeviceIdForHybrid();
        }
        hpLogin.logi(TAG + "deviceId=" + deviceId + ", osVersion=" + osVersion + ", deviceType=" + deviceType + ", osType=" + osType);
    };
    var _getOsTypeForHybrid = function () {
        var supportedOSMapper = {
            'webOS': 'WebOS',
            'palm': 'WebOS',
            'Android': 'Android',
            'iPhone': 'iOS',
            'iPad': 'iOS',
            'iPod': 'iOS',
            'iPhone Simulator': 'iOS',
            'iPad Simulator': 'iOS',
            'iOS': 'iOS'
        };
        return supportedOSMapper[device.platform] || "NonSupportedOS";
    };
    var _getOsTypeForWebBased = function () {
        var myOsType = "";
        var userAgent = navigator.userAgent;

        if (userAgent.indexOf("webOS") > -1 || userAgent.indexOf("hpwOS") > -1) {
            //webOS
            myOsType = 'WebOS';
        } else if (userAgent.indexOf("Android") > -1) {
            //Android
            myOsType = 'Android';
        } else if (userAgent.indexOf("iPhone") > -1 || userAgent.indexOf("iPad") > -1 || userAgent.indexOf("iPod") > -1) {
            //iOS
            myOsType = 'iOS';
        } else if (userAgent.indexOf("Windows NT") > -1) {
            //Windows
            myOsType = 'Windows_non_Phone';
        } else {
            //Any other
            myOsType = "NonSupportedOS";
        }

        return myOsType;
    };
    //get fake information
    //FAKE_WebOS_2_2_1_Veer
    var _getDeviceIdForWebBased = function () {
        var fakeId = "FAKE_" + osType + "_" + osVersion + "_" + deviceType;
        //replace dot or blank character or slash with underscore
        return fakeId.replace(/\.|\s|\//g, "_");
    };
    //ios device id will be updated for each installation, need to be saved it in local storage.
    var _fetchDeviceIdForHybrid = function () {
        var TAG = "hpLogin._fetchDeviceIdForHybrid: ";
        deviceId = device.uuid;

        if ("iOS" === osType) {
            GetDeviceIdPlugin.get(
                function (r) {
                    hpLogin.logi(TAG + "PhoneGap Plugin DeviceTypePlugin success: " + r);
                    deviceId = r;
                },
                function (e) {
                    hpLogin.loge(TAG + "PhoneGap Plugin DeviceTypePlugin failure: " + e);
                    if ("DEVICEID_NOT_FOUND" === e) {
                        deviceId = "";
                    }
                }
            );
        } else {
            if (!deviceId) {
                setTimeout(function () {
                    deviceId = device.uuid;
                    hpLogin.logi(TAG + "Retried to get device id after 1 second. deviceId=" + deviceId);
                    if (!deviceId) {
                        setTimeout(function () {
                            deviceId = device.uuid;
                            hpLogin.logi(TAG + "Retried to get device id after 2 seconds. deviceId=" + deviceId);
                        }, 1000);
                    }
                }, 1000);
            }
        }

    };

    var _fetchDeviceTypeForHybrid = function () {
        var TAG = "hpLogin._fetchDeviceTypeForHybrid: ";
        if ("Android" === osType) {
            DeviceTypePlugin.get(
                function (inResult) {
                    hpLogin.logi(TAG + "PhoneGap Plugin DeviceTypePlugin success: " + inResult);
                    deviceType = inResult;
                },
                function (e) {
                    hpLogin.loge(TAG + "PhoneGap Plugin DeviceTypePlugin failure: " + e);
                }
            );
        } else {
            deviceType = _getDeviceTypeForWebBased();
        }
    };
    var _getDeviceTypeForWebBased = function () {
        var TAG = "hpLogin._getDeviceTypeForWebBased: ";
        var myDeviceType = "Web Based";
        var userAgent = navigator.userAgent;
        var userAgentArray = userAgent.split(" ");

        if (userAgent.indexOf("webOS") > -1 || userAgent.indexOf("hpwOS") > -1) {
            //webOS device
            var device = userAgentArray[userAgentArray.length - 1].toLowerCase();
            if (device.indexOf("emulator") > -1) {
                myDeviceType = "Emulator";
            } else if (device.indexOf("desktop") > -1) {
                myDeviceType = "Emulator";
            } else if (device.indexOf("pre") > -1) {
                myDeviceType = "Pre";
            } else if (device.indexOf("pre/3.0") > -1) {
                myDeviceType = "Pre3";
            } else if (device.indexOf("touchpad") > -1) {
                myDeviceType = "TouchPad";
            } else if (device.indexOf("veer") > -1 || device.indexOf("p160una") > -1) {
                myDeviceType = "Veer";
            }
        } else if (userAgent.indexOf("Android") > -1) {
            //Android device
            var width = document.documentElement.clientWidth;
            var height = document.documentElement.clientHeight;
            hpLogin.logd(TAG + "width=" + width + ", height=" + height);
            if (width < 720) {
                myDeviceType = "Android_Phone";
            } else {
                myDeviceType = "Android_Tablet";
            }
        } else if (userAgent.indexOf("iPhone") > -1 || userAgent.indexOf("iPod") > -1) {
            myDeviceType = "iPhone";
        } else if (userAgent.indexOf("iPad") > -1) {
            myDeviceType = "iPad";
        } else if (userAgent.indexOf("Windows NT 6.2") > -1) {
            myDeviceType = "Windows_any_device";
        }
        return myDeviceType;
    };
    //If OS is not webOS, "All OS" is returned. Otherwise, OS version is returned, such as 2.1.0
    //web-based AppCatalog
    //   when run on WebOS => pass 'WebOS' as osType and guess the OS version level as 'deviceOS' and pass it to in the declaredevice()
    //   when run on Android => pass 'Android' and guess the OS version level and pass it to in the declaredevice()
    //   when run on IOS or any other  => pass NonSupportedOS as the OS type and All OS as the device OS

    var _getOsVersionForWebBased = function () {
        //Initialize user agent string.
        var userAgent = "";
        if (navigator && navigator.userAgent)
            userAgent = navigator.userAgent.toLowerCase();


        var myOSVersion = "";

        if (userAgent.indexOf("webos") > -1) {
            //Run on Palm's line of webOS device===
            myOSVersion = hpLogin.Utils.substringBetween(userAgent, "webos/", ";");
        } else if (userAgent.indexOf("hpwos") > -1) {
            //Run on HP's line of WebOS devices
            //Mozilla/5.0 (hp-tablet; Linux; hpwOS/3.0.4; U; en-US) AppleWebKit/534.6 (KHTML, like Gecko) wOSBrowser/234.76 Safari/534.6 TouchPad/1.0
            myOSVersion = hpLogin.Utils.substringBetween(userAgent, "hpwos/", ";");
        } else if (userAgent.indexOf("android") > -1) {
            //Run on Android device===
            //Google Nexus: Mozilla/5.0 (Linux; U; Android 2.2; en-us; Nexus One Build/FRF91) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1
            //HTC: Mozilla/5.0 (Linux; U; Android 2.1-update1; de-de; HTC Desire 1.19.161.5 Build/ERE27) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530.17
            myOSVersion = hpLogin.Utils.substringBetween(userAgent, "android", ";");
        } else if (userAgent.indexOf("iphone") > -1 || userAgent.indexOf("ipad") > -1 || userAgent.indexOf("ipod") > -1) {
            //Run on iPhone/iPad/iPod device===
            //iphone: Mozilla/5.0 (iPhone; U; fr; CPU iPhone OS 4_2_1 like Mac OS X; fr) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8C148a Safari/6533.18.5
            //iPod: Mozilla/5.0 (iPod; U; CPU iPhone OS 4_3_1 like Mac OS X; zh-cn) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8G4 Safari/6533.18.5
            //iPad: Mozilla/5.0 (iPad; CPU OS 5_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko ) Version/5.1 Mobile/9B176 Safari/7534.48.3
            myOSVersion = hpLogin.Utils.substringBetween(userAgent, "iphone os ", " ").replace(/_/g, ".");
            if (!myOSVersion) {
                myOSVersion = hpLogin.Utils.substringBetween(userAgent, "cpu os ", " ").replace(/_/g, ".");
            }
            if (myOSVersion === "") {
                myOSVersion = "1.0.0";
            }
        } else if (userAgent.indexOf("windows nt 6.2") > -1) {
            //Run on Windows 8/Windows Phone 8 device===
            //Windows 8: Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; WOW64; Trident/6.0)
            //Windows Phone 8: Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; ARM; Touch; IEMobile/10.0
            myOSVersion = "8.0.0";
        }

        if (myOSVersion) {
            myOSVersion = hpLogin.Utils.trim(myOSVersion);

            //special handling for "2.1-update1"
            if (myOSVersion.indexOf("-") > -1) {
                myOSVersion.substring(0, myOSVersion.indexOf("-"));
            }
            //for example, 2.1 --> 2.1.0
            if (myOSVersion.split(".").length == 2)
                myOSVersion += ".0";
        } else {
            //===Run on any other===
            myOSVersion = "Undefined OS";
        }
        return myOSVersion;
    };

    var _getOsVersionForHybrid = function () {
        var deviceOS = device.version;

        // Keep only first numeric or dot characters (e.g. in webOS SDK, the version is like "2.1.0%20SDK"
        for (var i = 0; i < deviceOS.length; i++) {
            var c = deviceOS.charAt(i);
            if (c !== '.' && (c < '0' || c > '9')) {
                // stop at invalid character
                deviceOS = deviceOS.substring(0, i);
            }
        }
        //for example, 2.1 --> 2.1.0
        if (deviceOS.split(".").length == 2)
            deviceOS += ".0";

        return deviceOS;
    };

    return {
        detectDeviceInfo: function (checkByUserAgent) {
            _retrieveDeviceInfo(checkByUserAgent);
        },
        getOsType: function(){
            return osType;
        },
        getOsVersion: function(){
            return osVersion;
        },
        getDeviceType: function(){
            return deviceType;
        },
        getDeviceId: function(){
            return deviceId;
        }
    }
})();hpLogin.logger = (function () {
    var logLevelEnum = {ERROR: "ERROR", INFO: "INFO", DEBUG: "DEBUG", DISABLED: "DISABLED"};//static variables
    var logAppenderEnum = {WEB_CONSOLE: "WEB_CONSOLE", WEB_STORAGE: "WEB_STORAGE"};//static variables
    var logLevel = logLevelEnum.INFO; //default level
    var logAppenders = [logAppenderEnum.WEB_CONSOLE];//default appenders

    var _log = function (message, level) {
        _appendLog({"t": new Date().toUTCString(), "m": message, "l": level});
    };
    var _appendLog = function (msgJSON) {
        for (var i = 0; i < logAppenders.length; i++) {
            var logAppender = logAppenders[i];
            if (logAppender === logAppenderEnum.WEB_CONSOLE) {
                if (window.console) {
                    console.log(msgJSON.m);
                }
            } else if (logAppender === logAppenderEnum.WEB_STORAGE) {
                _appendLogToWebStorage(msgJSON);
            }
        }
    };
    var _appendLogToWebStorage = function (msgJSON) {
        var loggedMessages = window.sessionStorage.getItem("hpit-mobile-log");
        if (loggedMessages) {
            loggedMessages = hpLogin.parseJSON(loggedMessages);
        } else {
            loggedMessages = [];
        }
        loggedMessages.push(msgJSON);
        window.sessionStorage.setItem("hpit-mobile-log", hpLogin.stringifyJSON(loggedMessages));
    };
    var _isDebugEnabled = function () {
        return logLevel === logLevelEnum.DEBUG;
    };
    var _isLogDisabled = function () {
        return logLevel === logLevelEnum.DISABLED;
    };
    var _isErrorEnabled = function () {
        return (logLevel === logLevelEnum.DEBUG || logLevel === logLevelEnum.INFO || logLevel === logLevelEnum.ERROR);
    };
    var _isInfoEnabled = function () {
        return (logLevel === logLevelEnum.DEBUG || logLevel === logLevelEnum.INFO);
    };

    return {
        loge: function (message) {
            if (_isErrorEnabled()) {
                _log(message, "ERROR");
            }
        },
        logi: function (message) {
            if (_isInfoEnabled()) {
                _log(message, "INFO");
            }
        },
        logd: function (message) {
            if (_isDebugEnabled()) {
                _log(message, "DEBUG");
            }
        },
        getLogs: function () {
            return window.sessionStorage.getItem("hpit-mobile-log");
        },
        getLogLevelEnum: function () {
            return logLevelEnum;
        },
        getLogAppenderEnum: function () {
            return logAppenderEnum;
        },
        getLogLevel: function () {
            return logLevel;
        },
        getLogAppenders: function () {
            return logAppenders;
        },
        setLogLevel: function (inLogLevel) {
            logLevel = inLogLevel;
        },
        setLogAppenders: function (inLogAppenders) {
            logAppenders = inLogAppenders;
        }
    }
})();/**
 * HP IT Mobility Login and SSO Library
 * Copyright 2013 (c) HP
 *
 *      Module:
 *           hpLogin.sessionManager
 *
 *      Version:
 *           v8.2.0
 *
 *      Description:
 *           The module will be focus on login session management including persistence and restoring.
 *           For persistence and restoring, if PhoneGap plugin "NativeStoragePlugin" is not available, window.localStorage will be used.
 *
 *      Public APIs:
 *           - hpLogin.sessionManager.persist(sessionToken, loginSystem, env, loggedUser, isRefresh)
 *           - hpLogin.sessionToken.restore(loginSystem, env, callback)
 *
 *      Author:
 *           Ma, Hui-Xin (HPIT-DS-CDC) <huixin.ma@hp.com>
 *           Wang, Chun-Yang  (HPIT-DS-CDC) <chun-yang.wang@hp.com>
 *
 *      Reviewers:
 *           Claude, Villermain <claude.villermain@hp.com>
 *           Francois, Connetable <francois.connetable@hp.com>
 *           Vincent, Rabiller <vincent.rabiller@hp.com>
 *           Vincent, Planat <vincent.planat@hp.com>
 *
 */
hpLogin.sessionManager = (function () {
    "use strict";

    var restoreContext = {
        loginSystem: "",
        env: "",
		initStatus: "",
        createRequestURL: function () {
            if (this.loginSystem === "SM") {
                return hpLogin.getBaseURL() + "/auth/checksession.pl";
            } else if (this.loginSystem === "SG") {
                //https://d4t0178g.houston.hp.com:8443/sec-gw/sts/decodesessiontk
                return hpLogin.getBaseURL() + "/sec-gw/sts/decodesessiontk";
            } else if (this.loginSystem === "OTP") {
                return hpLogin.getBaseURL() + "/sec-gw/sts/getreservationtk";
				//return hpLogin.getBaseURL() + "/sec-gw/sts/decodesessiontk";
            } else {
                return "";
            }
        },
        createPostBody: function (sessionToken) {
            if (this.loginSystem === "SM") {
                return {"SESSIONSM": sessionToken};
            } else if (this.loginSystem === "SG" || this.loginSystem === "OTP") {
                return  {"sessiontk": sessionToken};
            } else {
                return {};
            }
        },
        extractLoggedUser: function (response) {
            if (this.loginSystem === "SM") {
                return response.userId || "";
            } else if (this.loginSystem === "SG") {
                return response["user id"] || "";
            } else if (this.loginSystem === "OTP") {
                return response["userid"] || "";
            } else {
                return "";
            }
        },
        extractSessionToken: function (response) {
		    var tokens = {"SGSESSION":"","SMSESSION":""};
            if (this.loginSystem === "SM") {
                tokens.SMSESSION = response.SMSESSION || "";
            } else if (this.loginSystem === "SG" || this.loginSystem === "OTP") {
                tokens.SGSESSION = response["sessiontk"] || "";
            } else {
			    return null;
			}
			return tokens;
        }
    };
    var _getKeys = function (loginSystem, env) {
	     
		var retKeys = ["LoginSession_"+env, "LoginSession", "SGLoginSession", "SGSMLoginSession"];
		return retKeys;
    };
	var _NativeStoreLoginSessions = function(key, loginSession){
	    NativeStoragePlugin.put(key, hpLogin.stringifyJSON(loginSession),
			function (r) {
				hpLogin.logd(TAG + "success - " + r);
			},
			function (e) {
				hpLogin.loge(TAG + "failure - " + e);
			}
		);
	};
	
	//update the sessiontk to string 'LOGOUT', remove the sessiontk in local storage
	var _logout = function(loginSystem, env){
	    var TAG = "hpLogin.sessionManager._remove() - ";
		hpLogin.logd(TAG + "ENTRY");
		
		var keys = _getKeys(loginSystem, env);
		if (typeof NativeStoragePlugin === "undefined" || hpLogin.isSsoDisabled()) {
		    // Cordova shared storage plugin is NOT available.
            hpLogin.logd(TAG + "window.localStorage will be used.");

			for(var i=0; i< keys.length; i++){
				var degradedLoginSession = window.localStorage.getItem(keys[i]) || "";
				var loginSession = _logoutSession(loginSystem, degradedLoginSession);
				if(loginSession){
					window.localStorage.setItem(keys[i], hpLogin.stringifyJSON(loginSession));
				}
			}
		} else {
		    _NativeStoreSessionLogout(loginSystem, keys, 0);
		}
		
	};
	
	var _logoutSession = function(loginSystem, inLoginSession){
	    hpLogin.logd("_logoutSession() ENTRY, loginSystem="+loginSystem+", inLoginSession="+inLoginSession);
	    var loginSession = "";
	    if(inLoginSession){
		    loginSession = hpLogin.parseJSON(inLoginSession);
			if(loginSystem == hpLogin.config.systemNameEnum.SITE_MINDER){
				loginSession.SMSESSION = "LOGOUT";
			} else if(loginSystem == hpLogin.config.systemNameEnum.SECURITY_GATEWAY_SM){
				loginSession.SGSESSION = "LOGOUT";
				loginSession.SMSESSION = "LOGOUT";
			} else {
				loginSession.SGSESSION = "LOGOUT";
			}
		}
		return loginSession;
	};
	var _NativeStoreSessionLogout = function(loginSystem, allkeys, index){
	    NativeStoragePlugin.get(allkeys[index],
            function (r) {
                var loginSession = _logoutSession(loginSystem, r);
				if(loginSession){
				    _NativeStoreLoginSessions(allkeys[index], loginSession);
				}
				if(index < allkeys.length){
				    _NativeStoreSessionLogout(loginSystem, allkeys, index+1);
				}
            },
            function (e) {
			    if(index < allkeys.length){
				    _NativeStoreSessionLogout(loginSystem, allkeys, index+1);
				}
            }
        );
	}
	
    var _persist = function (sgSession, smSession, loginSystem, env, loggedUser, isRefresh) {
        var TAG = "hpLogin.sessionManager._persist() - ";
        hpLogin.logd(TAG + "ENTRY");

        var keys = _getKeys(loginSystem, env);
		//need to store env to local for next use.
		window.localStorage.setItem("hpLoginEnvName", env);
        hpLogin.logd(TAG + "keys=" + hpLogin.stringifyJSON(keys));
		
		var timestamp = new Date().getTime();
        var loginSession = {"SGSESSION": sgSession, "SMSESSION":smSession, "timestamp": timestamp, "loggedUser": loggedUser, "loginSystem": loginSystem, "env": env};
		hpLogin.logd(TAG + " keys = "+keys+",  loginSession = "+hpLogin.stringifyJSON(loginSession));
        if (typeof NativeStoragePlugin === "undefined" || hpLogin.isSsoDisabled()) {
            // Cordova shared storage plugin is NOT available.
            hpLogin.logd(TAG + "window.localStorage will be used.");
            // Fro security, only loggedUser will be persisted to window.localStorage.
			for(var i=0; i< keys.length; i++){
			    var key = keys[i];
				if(isRefresh){
				    var olditem = hpLogin.parseJSON(window.localStorage.getItem(key)) || "";
					if(olditem && (olditem.SGSESSION || olditem.SMSESSION)){
					    if(!sgSession && olditem.SGSESSION){
						    sgSession = olditem.SGSESSION;
						}
						if(!smSession && olditem.SMSESSION){
						    smSession = olditem.SMSESSION;
						}
						loginSession = {"SGSESSION": sgSession, "SMSESSION":smSession, "timestamp": timestamp, "loggedUser": loggedUser, "loginSystem": loginSystem, "env": env};
					}
				} 
				window.localStorage.setItem(key, hpLogin.stringifyJSON(loginSession));
			}
        } else {
            for(var i=0; i< keys.length; i++){
			    var key = keys[i];
				if(isRefresh){
				    NativeStoragePlugin.get(key,
						function (r) {
							var olditem = hpLogin.parseJSON(r) || "";
							if(olditem && (olditem.SGSESSION || olditem.SMSESSION)){
								if(!sgSession && olditem.SGSESSION){
									sgSession = olditem.SGSESSION;
								}
								if(!smSession && olditem.SMSESSION){
									smSession = olditem.SMSESSION;
								}
							}
							loginSession = {"SGSESSION": sgSession, "SMSESSION":smSession, "timestamp": timestamp, "loggedUser": loggedUser, "loginSystem": loginSystem, "env": env};
							_NativeStoreLoginSessions(key,loginSession);
						},
						function (e) {
							_NativeStoreLoginSessions(key,loginSession);
						}
					);
				} else {
				    _NativeStoreLoginSessions(key,loginSession);
				}
			}
        }
    };

    var _restore = function (loginSystem, env, callback) {
        var TAG = "hpLogin.sessionManager._restore() - ";
        hpLogin.logd(TAG + "ENTRY!");
		//hpLogin.logd(TAG + "callback="+callback);

        restoreContext.callback = callback;
        restoreContext.loginSystem = loginSystem;
        restoreContext.env = env;

        var keys = _getKeys(loginSystem, env);
        hpLogin.logd(TAG + "keys=" + hpLogin.stringifyJSON(keys));
        if (typeof NativeStoragePlugin === "undefined" || hpLogin.isSsoDisabled()) {
            // Cordova shared storage plugin is NOT available.
            hpLogin.logd(TAG + "window.localStorage will be used.");

            // For security, only loggedUser is stored in window.localStorage, so I call
            // it degradedLoginSession to avoid confusing with full loginSession.
            var degradedLoginSession = window.localStorage.getItem(keys[0]) || "";
			for(var i=0; i< keys.length; i++){
			    var key = keys[i];
				if(degradedLoginSession == ""){
				    degradedLoginSession = window.localStorage.getItem(keys[i]) || "";
				} else {
				    break;
				}
			}
            _restoreSuccess(degradedLoginSession,true);
        } else {
            NativeStoragePlugin.get(keys[0],
                function (r) {
                    _restoreSuccess(r);
                },
                function (e) {
                    _nativeRestoreWithOldKey(keys, 1);
                }
            );
        }
    };
	var _nativeRestoreWithOldKey = function(allkeys, index){
	    NativeStoragePlugin.get(allkeys[index],
            function (r) {
                _restoreSuccess(r);
            },
            function (e) {
			    if(index < allkeys.length){
				    _nativeRestoreWithOldKey(allkeys, index+1);
				} else {
                    _restoreFailure(e);
				}
            }
        );
	};
    var _restoreFailure = function (error) {
        var TAG = "hpLogin.sessionManager._restoreFailure() - ";
        hpLogin.loge(TAG + "with detailed errors --> " + error);
        if ("APP_CATALOG_NOT_INSTALLED" === error) {
            _fireRestoreCallback(false, hpLogin.getInitStatusEnum().APP_CATALOG_NOT_INSTALLED);
        } else if ("NOT_SIGNED_BY_HPIT" === error) {
            _fireRestoreCallback(false, hpLogin.getInitStatusEnum().NOT_SIGNED_BY_HPIT);
        } else {
            _fireRestoreCallback(false, hpLogin.getInitStatusEnum().UNKNOWN_ERROR);
        }
    };
    var _restoreSuccess = function (result,isLocal) {
        var TAG = "hpLogin.sessionManager._restoreSuccess:() - ";
        hpLogin.logd(TAG + "ENTRY");
		hpLogin.logi(TAG+" result = "+result);
        if (!result) {
            hpLogin.logd(TAG + 'Login session not found');
            _fireRestoreCallback(false, hpLogin.getInitStatusEnum().LOGIN_SESSION_NOT_FOUND);
            return;
        }

        var loginSession = hpLogin.parseJSON(result);
		var loginSystem = loginSession.loginSystem || "SG";
        var sessionToken = loginSession.SGSESSION || "";
		if(loginSession.SGSESSION == hpLogin.config.systemNameEnum.SITE_MINDER){
		    sessionToken = loginSession.SMSESSION || "";
		}
        var loggedUser = loginSession.loggedUser || "";
        var timestamp = loginSession.timestamp || "";
        hpLogin.logi(TAG + "loggedUser=" + loggedUser + ", timestamp=" + timestamp
            + ", sessionToken=" + hpLogin.Utils.truncateSMSESSION(sessionToken));

        if (hpLogin.isSsoDisabled() && loggedUser && !isLocal) {
            _fireRestoreCallback(false, hpLogin.getInitStatusEnum().SSO_DISABLED, loggedUser);
            return;
        }
        if (sessionToken === "LOGOUT") {
            _fireRestoreCallback(false, hpLogin.getInitStatusEnum().SIGNED_IN_FAILURE, loggedUser);
            return;
        }

        if (_checkIfSessionTimesOut(timestamp)) {
            _fireRestoreCallback(false, hpLogin.getInitStatusEnum().SESSION_TIME_OUT, loggedUser);
            return;
        }

        if (sessionToken && loggedUser) {
            _setCookieFromServer(sessionToken,loggedUser);
        } else {
            hpLogin.loge(TAG + 'Content of "LoginSession" is broken.');
            _fireRestoreCallback(false, hpLogin.getInitStatusEnum().LOGIN_SESSION_DATA_BROKEN);
        }
    };
    var _setCookieFromServer = function (sessionToken,loggedUser) {
        var TAG = "hpLogin.sessionManager._setCookieFromServer() - ";
        hpLogin.logd(TAG + "Entry");
        var requestURL = restoreContext.createRequestURL();
        var postBody = restoreContext.createPostBody(sessionToken,loggedUser);
        hpLogin.logd(TAG + "requestURL=" + requestURL+",postBody="+hpLogin.stringifyJSON(postBody));
        hpLogin.ajax.request({
            url: requestURL,
            method: "POST",
            body: postBody,
            callback: {
                success: function (inRequest, inResponse) {
                    _setCookieFromServerSuccess(inRequest, inResponse)
                },
                failure: _setCookieFromServerFailure}
        });
    };
    var _setCookieFromServerSuccess = function (inRequest, inResponse) {
        var TAG = "hpLogin.sessionManager._setCookieFromServerSuccess() - ";
        hpLogin.logi(TAG + "Entry, inRequest = "+inRequest+",inResponse="+inResponse);
        var myResponse = hpLogin.parseJSON(inResponse);
        var sessionToken = restoreContext.extractSessionToken(myResponse);
        var loggedUser = restoreContext.extractLoggedUser(myResponse);
        hpLogin.logi(TAG + "loggedUser=" + loggedUser+ "; sessionToken=" + sessionToken);

        if (loggedUser && sessionToken && (sessionToken.SGSESSION || sessionToken.SMSESSION)) {
            hpLogin.logd(TAG + "found loggedUser and sessionToken --> User is signed in successfully, to refresh stored login session.");
            _persist(sessionToken.SGSESSION,sessionToken.SMSESSION, restoreContext.loginSystem, restoreContext.env, loggedUser, true);
            _fireRestoreCallback(true, hpLogin.getInitStatusEnum().SIGNED_IN, loggedUser);
        } else {
            hpLogin.logd(TAG + "failure --> loggedUser or session is not found in response.");
            _fireRestoreCallback(false, hpLogin.getInitStatusEnum().SIGNED_IN_FAILURE);
        }
    };
    var _setCookieFromServerFailure = function (inRequest, inResponse) {
        var TAG = "hpLogin.setCookieFromServerFailure - ";
        hpLogin.loge(TAG + "setCookieRequest.fail() - status=" + inRequest.status + ", statusText=" + inRequest.statusText);
        _fireRestoreCallback(false, hpLogin.getInitStatusEnum().SIGNED_IN_FAILURE, hpLogin.getLoggedUser());
    };
    var _fireRestoreCallback = function (isSuccess, status, loggedUser) {
        var TAG = "hpLogin.sessionManager._fireRestoreCallback() - ";
		hpLogin.logi(TAG + "isSuccess="+isSuccess+", status="+status+",loggedUser="+loggedUser);
		restoreContext.initStatus = status;
        if (restoreContext.callback && hpLogin.Utils.isFunction(restoreContext.callback)) {
            var userId = loggedUser || "";
            restoreContext.callback(isSuccess, status, userId);
        } else {
            hpLogin.logi(TAG + 'callback function is not found.');
        }
    };
    var _checkIfSessionTimesOut = function (sessionTimestamp) {
        var TAG = "hpLogin.sessionManager._checkIfSessionTimesOut() - ";
        if (hpLogin.Utils.isNumeric(sessionTimestamp)) {
            var lastTime = new Date(sessionTimestamp);
            var currentTime = new Date();
            var timeElapsedInHours = (currentTime - lastTime) / (1000 * 60 * 60);
            hpLogin.logd(TAG + "timeElapsedInHours=" + timeElapsedInHours);
            if (timeElapsedInHours >= 1) {
                hpLogin.logi(TAG + "the elapsed time is GREATER than 1 hour.");
                return true;
            } else {
                hpLogin.logi(TAG + "the elapsed time is LESS than 1 hour.");
                return false;
            }
        } else {
            hpLogin.logi(TAG + "The timestamp is NOT numeric. This means there is no valid timestamp, we consider this as session time out.");
            return true;
        }
    };
    var _verifyLoginSystemAndEnv = function (loginSystem, env) {
        hpLogin.assertContains(loginSystem, hpLogin.config.loginSystemList);
        hpLogin.assertContains(env, hpLogin.config.envList);
    };
	
	var _refreshSMSESSION = function(inXhr, inEnv, inLoggedUser){
        var TAG = "hpLogin.sessionManager._refreshSMSESSION() - ";
        var mySESSION = hpLogin.Utils.substringBetween(inXhr.getResponseHeader("Set-Cookie"), "SMSESSION=", ";") || "";
        if (mySESSION) {
            hpLogin.logd(TAG + "_refreshSMSESSION() - SESSION is found in response --> " + hpLogin.Utils.truncateSMSESSION(mySESSION) + ". To refresh stored LoginSession");
            _persist("",mySESSION,hpLogin.getLoginSystem(),inEnv,inLoggedUser,true);
        } else {
            hpLogin.logd(TAG + '_refreshSMSESSION() - SESSION is NOT found in response.');
        }
		return mySESSION;
    };

    // Public APIs
    return {
        persist: function (sgSession, smSession, loginSystem, env, loggedUser) {
            _verifyLoginSystemAndEnv(loginSystem, env);
            _persist(sgSession, smSession, loginSystem, env, loggedUser);
        },
        restore: function (loginSystem, env, callback) {
		    hpLogin.logd("hpLogin.sessionManager.restore()-loginSystem="+loginSystem+",env="+env);
            _verifyLoginSystemAndEnv(loginSystem, env);
            _restore(loginSystem, env, callback);
        },
		getInitStatus: function(){
		    return restoreContext.initStatus;
		},
		logout:_logout,
		refreshSMSESSION:_refreshSMSESSION
    }
})();

/**
 * HP IT Mobility Framework 8.1.6
 * Copyright 2013 (c) HP
 *
 * Utility functions.
 */
hpLogin.Utils = {
    /**
     * <p>Gets the String that is nested in between two Strings.
     * Only the first match is returned.</p>
     */
    substringBetween: function (str, open, close) {
        if (str && open && close) {
            var openIndex = str.indexOf(open);
            if (openIndex >= 0) {
                var closeIndex = str.indexOf(close, openIndex + open.length);
                if (closeIndex > 0) {
                    return str.substring(openIndex + open.length, closeIndex);
                }
            }
        }
        return "";
    },
    substringAfter: function (str, open) {
        var openIndex = str.indexOf(open);
        if (openIndex >= 0) {
            return str.substring(openIndex + open.length, str.length);
        }
        return "";
    },
    //Considering security, only display first 8 and last 8 characters of SMESSSION
    truncateSMSESSION: function (inSession) {
        if (inSession && inSession.length > 8) {
            return inSession.substring(0, 8) + "..." + inSession.substring(inSession.length - 8);
        } else {
            return inSession;
        }
    },
    isNumeric: function (inObj) {
        return !isNaN(parseFloat(inObj)) && isFinite(inObj);
    },
    trim: function (inText) {
        var text = inText || "";
        return text.replace(/^\s+|\s+$/g, "");
    },
    isFunction: function (inObj) {
        var getType = {};
        return inObj && getType.toString.call(inObj) == '[object Function]';
    },
    isArray: function (inObj) {
        var getType = {};
        return inObj && getType.toString.call(inObj) == '[object Array]';
    },
    isString: function (inObj) {
        var getType = {};
        return inObj && getType.toString.call(inObj) == '[object String]';
    },
	
};

hpLogin.parseJSON = function (inStr) {
    var TAG = "hpLogin.parseJSON():";
    var jsonObject = {};
    try {
        jsonObject = JSON.parse(inStr);
    } catch (err) {
        hpLogin.loge(TAG + " - JSON parse failed");
    }
    return jsonObject;
};
hpLogin.stringifyJSON = function (inJsonObject) {
    var TAG = "hpLogin.stringifyJSON():";
    var str = "";
    try {
        str = JSON.stringify(inJsonObject);
    } catch (err) {
        hpLogin.loge(TAG + " - JSON stringify failed");
    }

    return str;
};
hpLogin.getJsonKey = function (jsonobj,value) {
   var TAG = "hpLogin.getJsonKey():";
   var key = "";
   for(var item in jsonobj){
       if(jsonobj[item] == value){
	       key = item;
	   }
   }
   return key;
};

hpLogin.assertContains = function (param, validParams) {
    var TAG = "hpLogin.assertContains() - ";
    if (validParams.indexOf(param) == -1) {
        var msg = TAG + "Input parameter " + param + " is not a valid one.";
        hpLogin.loge(msg);
        throw msg;
    }
    return param;
};
hpLogin.assertFunction = function (param) {
    var TAG = "hpLogin.assertContains() - ";
    if (hpLogin.Utils.isFunction(param)) {
        return param;
    } else {
        var msg = TAG + "Input parameter " + param + " is not a Function.";
        hpLogin.loge(msg);
        throw msg;
    }
};