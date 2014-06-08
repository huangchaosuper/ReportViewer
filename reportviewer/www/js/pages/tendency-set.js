/***********************************************************************
*author:huang.chao
*date:2013.9.7
*overview:TBD
************************************************************************/
var tendencyset = {
    initialize: function () {
        $(".express-link").on('click', function () {
            $.mobile.changePage("express.html", { transition: "pop" });
        });
        $(".tendency-link").on('click', function () {
            $.mobile.changePage("tendency.html", { transition: "pop" });
        });
        $(".summary-link").on('click', function () {
            $.mobile.changePage("summary.html", { transition: "pop" });
        });
        $(".check-btn").on('click', function () {
            $.mobile.changePage("tendency.html", { transition: "pop" });
        });
        $("#startdate-label").text(window.localStorage.getItem("maf-tendency-startdate"));
        $("#startdate-btn").on('click', function () {
            $('#startdate-datebox').datebox({ 'defaultValue': window.localStorage.getItem("maf-tendency-startdate") });
            $('#startdate-datebox').datebox('open');
        });
        $('#startdate-datebox').on('change', function (e, p) {
            $('#startdate-label').text(common.formatdate1($(this).val()));
            window.localStorage.setItem("maf-tendency-startdate", common.formatdate1($(this).val()));
        });
        $("#enddate-label").text(window.localStorage.getItem("maf-tendency-enddate"));
        $("#enddate-btn").on('click', function () {
            $('#enddate-datebox').datebox({ 'defaultValue': window.localStorage.getItem("maf-tendency-enddate") });
            $('#enddate-datebox').datebox('open');
        });
        $('#enddate-datebox').on('change', function (e, p) {
            $('#enddate-label').text(common.formatdate1($(this).val()));
            window.localStorage.setItem("maf-tendency-enddate", common.formatdate1($(this).val()));
        });
        $("#interval-label").text(window.localStorage.getItem("maf-tendency-groupby"))
        $(".interval-btn").on('click', function () {
            $("#popupMenu").popup( "open" );
        });
        $(".interval-link-daily").on('click', function (event, ui) {
            $("#interval-label").text("Daily");
            window.localStorage.setItem("maf-tendency-groupby", "Daily");
            $("#popupMenu").popup("close");
        });
        $(".interval-link-weekly").on('click', function (event, ui) {
            $("#interval-label").text("Weekly");
            window.localStorage.setItem("maf-tendency-groupby", "Weekly");
            $("#popupMenu").popup("close");
        });
        $(".interval-link-monthly").on('click', function (event, ui) {
            $("#interval-label").text("Monthly");
            window.localStorage.setItem("maf-tendency-groupby", "Monthly");
            $("#popupMenu").popup("close");
        });
    },
};