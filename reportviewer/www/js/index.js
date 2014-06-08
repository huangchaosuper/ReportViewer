/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
 jQuery.fn.center = function () {
    this.css("position","absolute");
    //this.css("top", ( $(window).height() - this.height() ) / 2+$(window).scrollTop() + "px");
    this.css("left", ( $(window).width() - this.width() ) / 2+$(window).scrollLeft() + "px");
    return this;
}
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
	    $(document).on('pageshow', 'div:jqmData(role="page"), div:jqmData(role="dialog")', function(event,ui){ 
	        app.pageshowhandler(event.target.id);
	    });
        $(document).bind("mobileinit", function() {
	        // Make your jQuery Mobile framework configuration changes here!
	        $.mobile.allowCrossDomainPages = true;
	    });
    },
    pageshowhandler: function (id) {
        if (id == "home") {
            home.initialize();
        } else if (id == "express") {
            express.initialize();
        } else if (id == "tendency") {
            tendency.initialize();
        } else if (id == "summary") {
            summary.initialize();
        } else if (id == "detail") {
            detail.initialize();
        } else if (id == "tendency-set"){
            tendencyset.initialize();
        }
    },
	onBackKeyDown: function(){
		app.showExitConfirmDialog();
	},
	onExitConfirm:function(buttonIndex) {
		if(buttonIndex === 1){
			navigator.app.exitApp();
		}
	},
	showExitConfirmDialog: function() {
		navigator.notification.confirm(
			'You want to exit?', // message
			app.onExitConfirm,            // callback to invoke with index of button pressed
			'Confirm Dialog Box',           // title
			['Yes','No']         // buttonLabels
		);
	},
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        //app.receivedEvent('deviceready');
		document.addEventListener("backbutton", app.onBackKeyDown, false);
        $.mobile.showPageLoadingMsg();
        //$.support.cors must be set to true to tell $.ajax to load cross-domain pages. 
        $.support.cors=true;
        hpLogin.setLogLevel(hpLogin.getLogLevelEnum().DEBUG);
        hpLogin.setLogAppenders([hpLogin.getLogAppenderEnum().WEB_CONSOLE, hpLogin.getLogAppenderEnum().WEB_STORAGE]);
        //login init with element ID of login container and callback functions
        hpLogin.init({
            done: function(status, userId){
            	hpLogin.logi(status + ':userId'+ userId);
                app.loginInitDone(status, userId);
            },ssoEnabled: false},
			hpLogin.getLoginSystemEnum().SECURITY_GATEWAY);          

        //register global handler for ajaxSuccess to refresh loginSession (SMSESSION, timestamp, loggedUser)
        $(document).ajaxSuccess(function (event, xhr, ajaxOptions) {
            hpLogin.logd("Global Ajax Handler - ajaxSuccess() --> url=" + ajaxOptions.url);
            hpLogin.refreshSMSESSION(xhr);
        });
		window.localStorage.setItem("mar-version","1.0.1");
    },
    loginInitDone:function(status, userId){
        var initStatusToTextCode = {
                "1":"SIGNED_IN",
                "2":"APP_CATALOG_NOT_INSTALLED",
                "3":"NOT_SIGNED_BY_HPIT",
                "4":"LOGIN_SESSION_NOT_FOUND",
                "5":"LOGIN_SESSION_DATA_BROKEN",
                "6":"SESSION_TIME_OUT",
                "7":"SET_COOKIE_FROM_CLIENT_SUCCESS",
                "8":"SET_COOKIE_FROM_CLIENT_FAILURE",
                "9":"SIGNED_IN_FAILURE",
                "99":"UNKNOWN_ERROR"
        };    
        console.log("HPLoginTest.loginInitDone(): return from hpLogin.init(). status="+status +", userId="+ userId);
        if(hpLogin.getInitStatusEnum().SIGNED_IN === status){
            //1. Session already active for user XYZ (SIGNED_IN --> no need to ask user to sign in)
            $('#message').text("Session already active for user "+userId);  
			$.mobile.hidePageLoadingMsg();
			var userid = window.localStorage.getItem("mar-userid");
			$.mobile.changePage("home.html?userid=" + userid, { transition: "pop" });			
        } else if (hpLogin.getInitStatusEnum().SESSION_TIME_OUT === status){
            //2. No active session (SESSION_TIME_OUT), but last logged user id is known
            $('#message').text("No active session for user " + userId);
			$.mobile.hidePageLoadingMsg();
			$.mobile.changePage("home.html", { transition: "pop" });
        } else {
            //3. Error (for all other status codes: display error code as number + text code)
            $('#message').text("Login init status is '"+ status+", "+initStatusToTextCode[status]+"'");
			$.mobile.hidePageLoadingMsg();
			$.mobile.changePage("home.html", { transition: "pop" });
        }
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
        //window.location.href = "home.html";
    },
};
var common = {
    getdate: function () {
        var d = new Date();
        var str = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + (d.getDate());
        return str;
    },
    getlastmonth: function () {
        var d = new Date();
        var str = d.getFullYear() + "-" + d.getMonth() + "-" + (d.getDate());
        return str;
    },
    formatdate1:function(formatdate){
        var strs = new Array();
        strs = formatdate.split("-");
        if (strs[1].length < 2) {
            strs[1] = "0" + strs[1];
        }
        if (strs[2].length < 2) {
            strs[2] = "0" + strs[2];
        }
        return strs[1] + "/" + strs[2] + "/" + strs[0];
    },
    formatdate2: function (formatdate) {
        var strs = new Array();
        strs = formatdate.split("/");
        if (strs[0].length < 2) {
            strs[0] = "0" + strs[0];
        }
        if (strs[1].length < 2) {
            strs[1] = "0" + strs[1];
        }
        return strs[2] + "-" + strs[0] + "-" + strs[1];
    },
	getquerystring: function(name) {
		var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)","i");
		var r = window.location.search.substr(1).match(reg);
		if (r!=null) return unescape(r[2]); return null;
	},
    ajax: function (data, path, func, async) {
        if (!async) {
            async = true;
        }
		var url = common.getbaseurl() + path;
		$.ajax({
            type: 'get',
            url: url,
            data: data,
            async: async,
            dataType: 'text',
            crossDomain: true,
            success: function (msg) {
                if (func) {
                    func(true, msg);
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                if (func) {
                    func(false, "status:" + XMLHttpRequest.status + ",textStatus:" + textStatus + ",+errorThrown:" + errorThrown);
                }
            }
        });
    },
	getbaseurl:function(){
		return "https://it-services-gw-itg.external.hp.com/gw/hpit/tcoe/reportservice/api/report/";
	}
};