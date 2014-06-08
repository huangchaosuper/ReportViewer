/**================================================================================
 * HpLoginForm: out of box HPLogin Form which is managed by our API
 * 
 */
var hpLoginForm = {
    loginCallbacks: "",
    initialize: function () {
        hpLogin.logd("HpLoginForm.onLoginPageInit: Entry");
        //register click handler for singInButton of login form
        $('#hpLoginSignInButton').click(hpLoginForm._signInButtonClick());

        //register click handler for hpLoginCancelButton of login form
        $('#hpLoginCancelButton').click(hpLoginForm.cancel());
        //click "enter" to login
        $('#hpLoginPassword').keypress(function () {
            if (event.keyCode === 13) {
                hpLoginForm._signInButtonClick();
            };
        });
        //hack: webOS 2.1 text input field can not get input focus when clicked on input box
        $('#hpLoginEmail').click(
            function () {
                $('#hpLoginEmail').focus();
            }
        );
        //hack: webOS 2.1 text input field can not get input focus when clicked on input box
        $('#hpLoginPassword').click(
            function () {
                $('#hpLoginPassword').focus();
            }
        );
    },
    onLoginPageShow: function () {
        var TAG = "HpLoginForm.onLoginPageShow: ";
        hpLogin.logd(TAG + "Entry. lastLoggedUser=" + hpLogin.getLoggedUser());

        hpLogin.logd(TAG + "hpLogin init status is " + hpLogin.getInitStatus());
        if (hpLogin.getInitStatusEnum().APP_CATALOG_NOT_INSTALLED === hpLogin.getInitStatus()) {
            $('#hpLoginInitStatus').text("Single-Sign-On won't work because HP IT AppCatalog is not installed.");
        } else if (hpLogin.getInitStatusEnum().NOT_SIGNED_BY_HPIT === hpLogin.getInitStatus()) {
            $('#hpLoginInitStatus').text("Single-Sign-On won't work because your app is not signed by HP IT.");
        } else {
            $('#hpLoginInitStatus').empty();
        }

        if (hpLogin.getLoggedUser()) {
            $("#hpLoginEmail").val(hpLogin.getLoggedUser());
            //hack -->adds the function to rendering thread's queue (which is what runs javascript and page 
            //rendering in the browser) after the given time. So in this case the function is added instantly, 
            //so it runs after the current flow of javascript code finishes.
            setTimeout(function () {
                $('#hpLoginPassword').focus();
            }, 0);

        } else {
            setTimeout(function () {//hack as above
                $('#hpLoginEmail').focus();
            }, 0);
        }

        var osVersion = hpLogin.getOsVersion() || "";
        if (osVersion.indexOf("2.1") === 0) {
            $('#hpLoginEmail').css('background-color', '#615759');
            $('#hpLoginPassword').css('background-color', '#615759');
        }
    },

    /*-----------------------------------------------------------------------------------------------
     * Public login API: login({success: successCallback, failure: failureCallback})
     * 
     * Description:
     *     Displays login form (hplogin.html). 
     *     If login successfully, it will store SiteMinder session cookie in shared repository to allow SSO between applications.
     *
     * Input Parameters:
     *     - successCallback: function(userId)
     *         - userId = email of user currently signed-in
     *     - failureCallback: function(reason, userId)
     *         - reason = reason of failure, such as connection times out or userId/password is not correct.
     *         - userId = email entered in User Id login form
     *
     */
    login: function (args) {
        var TAG = "HpLoginForm.login - ";
        hpLogin.logd(TAG + "ENTRY");
        $.mobile.showPageLoadingMsg();
        this.loginCallbacks = args;
        $.mobile.changePage("hpLogin.html");
    },
    _signInButtonClick: function () {
        $.mobile.showPageLoadingMsg();
        $("#hpLoginMessage").empty();
        var email = $("#hpLoginEmail").val();
        var password = $("#hpLoginPassword").val();
        $("#hpLoginPassword").val("");
        var callbacks = {
            success: $.proxy(function (userId) {
                this._loginWithCredentialsSuccess(userId);
            }, this),
            failure: $.proxy(function (reason, userId) {
                this._loginWithCredentialsFailure(reason, userId);
            }, this)
        };
        hpLogin.loginWithCredentials(email, password, callbacks);
    },
    _loginWithCredentialsSuccess: function (userId) {
        $.mobile.hidePageLoadingMsg();
        if (this.loginCallbacks.success && $.isFunction(this.loginCallbacks.success)) {
            this.loginCallbacks.success(userId);
        }
    },
    _loginWithCredentialsFailure: function (reason, userId) {
        $.mobile.hidePageLoadingMsg();
        if (hpLogin.getLoginFailureEnum().CONNECTION_TIMES_OUT === reason) {
            $("#hpLoginMessage").text('Sign-in times out. Please check your network connection and try again later.');
        } else if (hpLogin.getLoginFailureEnum().INCORRECT_CREDENTIALS === reason) {
            $("#hpLoginMessage").text('Sign-in failed. Please check user name and password.');
        } else {
            $("#hpLoginMessage").text('Sign-in failed. Internal error with status code ' + jqXHR.status);
        }
        if (this.loginCallbacks.failure && $.isFunction(this.loginCallbacks.failure)) {
            this.loginCallbacks.failure(reason, userId);
        }
    },
    cancel: function () {
        $("#hpLoginMessage").empty();
        hpLogin.logd("HpLoginForm.cancel - Entrty");
        if (this.loginCallbacks.failure && $.isFunction(this.loginCallbacks.failure)) {
            hpLogin.logd("HpLoginForm.cancel - call failure callback");
            this.loginCallbacks.failure(hpLogin.getLoginFailureEnum().USER_CANCELLED, "");
        }
    },
    loginSuccess: function (userId) {
        $.mobile.changePage($("#mainPage"));
        $('#message').text("Logged User: " + userId);
        $.mobile.hidePageLoadingMsg();
    },
    loginFailure: function (reason, userId) {
        alert('login failure: reason=' + reason + ", userId=" + userId);
        if (hpLogin.getLoginFailureEnum().USER_CANCELLED === reason) {
            $.mobile.changePage($("#mainPage"));
        }
    },
}
