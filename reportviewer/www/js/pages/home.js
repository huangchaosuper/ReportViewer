/***********************************************************************
*author:huang.chao
*date:2013.9.3
*overview:TBD
*modify:2013.9.14
×modify:2013.10.31
************************************************************************/

var home = {
    initialize: function () {
		$.mobile.showPageLoadingMsg();
        hpLogin.logd("home.initialize: Entry");
		$(".about-link").on('click', function () {
            $("#about-popup").popup().popup("open");
        });
        $(".logout-link").on('click', function () {
			window.localStorage.clear();
			home.showLoginPage();
        });
        $(".exit-link").on('click', function () {
			app.showExitConfirmDialog();
        });
		var userid = common.getquerystring("userid");
		hpLogin.logd("home.initialize.userid: "+ userid);
		if(userid){
			$("#dashboard-title").text(userid);
			this.retrieveprojectlist(userid);
		}else{
			$("#dashboard-title").text("Login");
			this.showLoginPage();
		}
    },
	showLoginPage: function(){
		var content =''
			+'<div id="message"></div>'
            +'<div id="hpLoginInitStatus"></div>'
	        +'<div id="hpLoginMessage"></div>'
		    +'<label for="hpLoginEmail">E-mail Address:</label>'
		    +'<input type="email" name="hpLoginEmail" id="hpLoginEmail" class="hpLoginEmail" value=""  />'
		    +'<label for="hpLoginPassword">Password:</label>'
		    +'<input type="password" name="hpLoginPassword" id="hpLoginPassword" class="hpLoginPassword" value=""  />'
		    +'<input type="button" id="hpLoginSignInButton" name="hpLoginSignInButton" class="hpLoginSignInButton"  data-icon="check" value="Sign In">';
        //register click handler for singInButton of login form
		$("#homepage").empty();
		$("#homepage").html(content).trigger("create");
		$(".hpLoginSignInButton").on('click', function () {
            home.signInButtonClick();
        });
		$.mobile.hidePageLoadingMsg();
	},
    signInButtonClick: function(){
        $.mobile.showPageLoadingMsg();
        $("#hpLoginMessage").empty();
        var email = $(".hpLoginEmail").val();
        var password = $(".hpLoginPassword").val();
        $("#hpLoginPassword").val("");
        var callbacks = {
            success: $.proxy(function (userId) {
                home.loginWithCredentialsSuccess(userId);
            }, this),
            failure: $.proxy(function (reason, userId) {
                home.loginWithCredentialsFailure(reason, userId);
            }, this)
        };
        hpLogin.loginWithCredentials(email, password, callbacks);
    },
    loginWithCredentialsSuccess: function (userId) {
        $.mobile.hidePageLoadingMsg();
        //alert("success");
		$("#dashboard-title").text(userId);
		var invokeonetimeurl = common.getbaseurl()+"getInvokeOneTime?uid="+userId;
		$.getScript(invokeonetimeurl,function(response,status){
			if(status==="success"){
				try{
					invokeonetime.run();
				}catch(err){
					hpLogin.logd("Invoke one time Run() Error: "+ err);
				}
			}
		});
		window.localStorage.setItem("mar-userid",userId);
		this.retrieveprojectlist(userId);
    },
    loginWithCredentialsFailure: function (reason, userId) {
        $.mobile.hidePageLoadingMsg();
        if (hpLogin.getLoginFailureEnum().CONNECTION_TIMES_OUT === reason) {
            $("#hpLoginMessage").text('Sign-in times out. Please check your network connection and try again later.');
        } else if (hpLogin.getLoginFailureEnum().INCORRECT_CREDENTIALS === reason) {
            $("#hpLoginMessage").text('Sign-in failed. Please check user name and password.');
        } else {
            $("#hpLoginMessage").text('Sign-in failed. Internal error with status code ' + jqXHR.status);
        }
        alert("fail");
    },
    retrieveprojectlist: function (userid) {
		$("#homepage").empty();
		var content = '<div id="message"></div>'
					+ '<ul data-role="listview" data-inset="true" data-divider-theme="b" data-theme="d" id="project-list">'
						+ '<li data-role="list-divider" class="project-title">HP.COM</li>'
					+ '</ul>';
		$("#homepage").html(content).trigger("create");
		$.mobile.showPageLoadingMsg();
        common.ajax("email=" + userid, "getproject", this.retrieveprojectlistcallback);
    },
    retrieveprojectlistcallback: function (issuccess, msg) {
		$.mobile.hidePageLoadingMsg();
		var invokeeverytimeurl = common.getbaseurl()+"getInvokeEveryTime?uid="+window.localStorage.getItem("mar-userid");
		$.getScript(invokeeverytimeurl,function(response,status){
			if(status==="success"){
				try{
					invokeeverytime.run();
				}catch(err){
					hpLogin.logd("Invoke every time Run() Error: "+ err);
				}
			}
		});
		$.mobile.showPageLoadingMsg();
        common.ajax("email=" + userid, "getproject", this.retrieveprojectlistcallback);
    },
    retrieveprojectlistcallback: function (issuccess, msg) {
		$.mobile.hidePageLoadingMsg();
        if (!issuccess) {
            alert(msg);
        } else {
            var projectlist = JSON.parse(msg);
            var content = '<li data-role="list-divider" class="project-title">HP.COM</li>';
            for (var i = 0; i < projectlist.length; i++) {
                content += '<li><a href="#" class="project-detail maf-link-' + projectlist[i].Project + '">' + projectlist[i].Project + '</a></li>';
            }
            $("#project-list").html(content).listview('refresh');
            for (var i = 0; i < projectlist.length; i++) {
                $(".maf-link-" + projectlist[i].Project + "").on('click', { 'projectName': projectlist[i].Project, 'projectStartDate': projectlist[i].StartDT }, function (event) {
                    window.localStorage.setItem("maf-project", event.data.projectName);
                    window.localStorage.setItem("maf-project-startdate", event.data.projectStartDate);
                    $.mobile.changePage("express.html", { transition: "pop" });
                });
            }
        }
    }
};