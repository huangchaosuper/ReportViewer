/***********************************************************************
*author:huang.chao
*date:2013.9.2
*overview:TBD
*modify:huang.chao 2013.11.1
************************************************************************/
var summary = {
    initialize: function () {
		$("#summary-target").center();
        var curr = 0;
        $(".express-link").on('click', function () {
            $.mobile.changePage("express.html", { transition: "pop" });
        });
        $(".tendency-link").on('click', function () {
            $.mobile.changePage("tendency.html", { transition: "pop" });
        });
        $(".summary-link").on('click', function () {
            $.mobile.changePage("summary.html", { transition: "pop" });
        });
		$(".home-btn").on('click', function () {
			var userid = window.localStorage.getItem("mar-userid");
            $.mobile.changePage("home.html?userid="+userid, { transition: "pop" });
        });
        $("#summary").on("swipeleft", function () {
            curr++;
            if (curr == 0 || curr == 2) {
                $("#summary-target").text("●○");
                summary.barchartshow();
            } else if (curr == 1) {
                $("#summary-target").text("○●");
                summary.guidviewshow();
            }
            if (curr >= 2) {
                curr = 0;
            }
        });
        $("#summary").on("swiperight", function () {
            curr--;
            if (curr == 0) {
                $("#summary-target").text("●○");
                summary.barchartshow();
            } else if (curr == 1 || curr == -1) {
                $("#summary-target").text("○●");
                summary.guidviewshow();
            }
            if (curr <= -1) {
                curr = 1;
            }
        });
        this.barchartshow();
    },
    guidviewshow: function () {
		$.mobile.showPageLoadingMsg();
        common.ajax("pj=" + window.localStorage.getItem("maf-project") + "&r=Category&c=Severity&st=" + window.localStorage.getItem("maf-project-startdate") + "&et=" + common.getdate(), "getpivot", this.guidviewshowcallback);
    },
    guidviewshowcallback: function (issuccess, msg) {
		$.mobile.hidePageLoadingMsg();
        if (!issuccess) {
            alert(msg);
        } else {
            window.localStorage.setItem("maf-summary-stackBar", msg);
            var content = ''
                    + '<div class="ui-block-a">'
                    + '	<div class="ui-bar ui-bar-b">Category</div>'
                    + '</div>'
                    + '<div class="ui-block-b">'
                    + '	<div class="ui-bar ui-bar-b">U</div>'
                    + '</div>'
                    + '<div class="ui-block-c">'
                    + '	<div class="ui-bar ui-bar-b">H</div>'
                    + '</div>'
                    + '<div class="ui-block-d">'
                    + '	<div class="ui-bar ui-bar-b">M</div>'
                    + '</div>'
                    + '<div class="ui-block-e">'
                    + '	<div class="ui-bar ui-bar-b">L</div>'
                    + '</div>'
                    + '<div class="ui-block-f">'
                    + '	<div class="ui-bar ui-bar-b">T</div>'
                    + '</div>';

            var datalist = JSON.parse(msg);
            var lastUpdate = datalist[tableConfig.updateTableName][0].LastUpdateDt;
            window.localStorage.setItem("maf-lastUpate", lastUpdate);

            var totleUrgent = 0;
            var totleHigh = 0;
            var totleMedium = 0;
            var totleLow = 0;
            for (var i = 0; i < datalist[tableConfig.dataTableName].length; i++) {
                totleUrgent += datalist[tableConfig.dataTableName][i].Urgent;
                totleHigh += datalist[tableConfig.dataTableName][i].High;
                totleMedium += datalist[tableConfig.dataTableName][i].Medium;
                totleLow += datalist[tableConfig.dataTableName][i].Low;
                /*UX Enhancement*/
                if (datalist[tableConfig.dataTableName][i].Category === "UX Enhancement") {
                    datalist[tableConfig.dataTableName][i].Category = "UX_Enhancement";
                }
                var rowTotal = datalist[tableConfig.dataTableName][i].Urgent + datalist[tableConfig.dataTableName][i].High + datalist[tableConfig.dataTableName][i].Medium + datalist[tableConfig.dataTableName][i].Low;
                /*end*/
                content += ''
                + '<div class="ui-block-a">'
                + '	<div class="ui-body ui-body-d">' + datalist[tableConfig.dataTableName][i].Category + '</div>'
                + '</div>'
                + '<div class="ui-block-b">'
                + '	<div class="ui-body ui-body-d">' + datalist[tableConfig.dataTableName][i].Urgent + '</div>'
                + '</div>'
                + '<div class="ui-block-c">'
                + '	<div class="ui-body ui-body-d">' + datalist[tableConfig.dataTableName][i].High + '</div>'
                + '</div>'
                + '<div class="ui-block-d">'
                + '	<div class="ui-body ui-body-d">' + datalist[tableConfig.dataTableName][i].Medium + '</div>'
                + '</div>'
                + '<div class="ui-block-e">'
                + '	<div class="ui-body ui-body-d">' + datalist[tableConfig.dataTableName][i].Low + '</div>'
                + '</div>'
                + '<div class="ui-block-f">'
                + '	<div class="ui-body ui-body-d">' + rowTotal + '</div>'
                + '</div>';
            }
            var total = totleUrgent + totleHigh + totleMedium + totleLow;
            content += ''
                + '<div class="ui-block-a">'
                + '	<div class="ui-bar ui-bar-b">Summary</div>'
                + '</div>'
                + '<div class="ui-block-b">'
                + '	<div class="ui-bar ui-bar-b">' + totleUrgent + '</div>'
                + '</div>'
                + '<div class="ui-block-c">'
                + '	<div class="ui-bar ui-bar-b">' + totleHigh + '</div>'
                + '</div>'
                + '<div class="ui-block-d">'
                + '	<div class="ui-bar ui-bar-b">' + totleMedium + '</div>'
                + '</div>'
                + '<div class="ui-block-e">'
                + '	<div class="ui-bar ui-bar-b">' + totleLow + '</div>'
                + '</div>'
                + '<div class="ui-block-f">'
                + '	<div class="ui-bar ui-bar-b">' + total + '</div>'
                + '</div>';

            $("#summary-gridview").html(content).trigger("create");
            summary.showStackBar();
        }
    },
    showStackBar: function () {
        var sbc = JSON.parse(window.localStorage.getItem("maf-summary-stackBar"));
        var dataArray = new Array();
        for (var i = 0; i < sbc[tableConfig.dataTableName].length; i++) {
            var defectdata = new Object();
            defectdata.name = sbc[tableConfig.dataTableName][i].Category;
            defectdata.data = new Array(sbc[tableConfig.dataTableName][i].Urgent, sbc[tableConfig.dataTableName][i].High, sbc[tableConfig.dataTableName][i].Medium, sbc[tableConfig.dataTableName][i].Low);
            dataArray.push(defectdata);
        }

        $('#container').highcharts({
            chart: {
                height: 300,
                type: 'bar',
                backgroundColor: 'rgba(255, 255, 255, 0)',
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false
            },
            title: null,
            xAxis: {
                categories: ['Urgent', 'High', 'Medium', 'Low'],
            },
            yAxis: {
                min: 0,
                labels: {
                    format: '{value}%'
                },
                title: {
                    text:null,
                }
            },

            plotOptions: {
                series: {
                    stacking: 'percent',
                },
            },
            tooltip: {
                pointFormat: '<span style="color:{series.color}">{series.name}</span>'
                    + ': <b>{point.y}</b> ({point.percentage:.0f}%)<br/>',
                shared: true
            },
            series: dataArray,
            credits: {
                enabled: false
            },
            exporting: {
                enabled: false
            }
        });
    },

    barchartshow: function () {
		$.mobile.showPageLoadingMsg();
        common.ajax("pj=" + window.localStorage.getItem("maf-project") + "&r=DefectStatus&c=Severity&st=" + window.localStorage.getItem("maf-project-startdate") + "&et=" + common.getdate(), "getpivot", this.barchartshowcallback);
    },
    barchartshowcallback: function (issuccess, msg) {
		$.mobile.hidePageLoadingMsg();
        if (!issuccess) {
            alert(msg);
        } else {
            window.localStorage.setItem("maf-summary-barchart", msg);
            summary.piechartshow();
        }
    },
    piechartshow: function () {
		$.mobile.showPageLoadingMsg();
        common.ajax("pj=" + window.localStorage.getItem("maf-project") + "&c=DefectStatus&t=createDT&st=" + window.localStorage.getItem("maf-project-startdate") + "&et=" + common.getdate(), "getcount", this.piechartshowcallback);
    },
    piechartshowcallback: function (issuccess, msg) {
		$.mobile.hidePageLoadingMsg();
        if (!issuccess) {
            alert(msg);
        } else {
            window.localStorage.setItem("maf-summary-piechart", msg);
            summary.showchart();
        }
    },
    showchart: function () {
        var defectstatus = JSON.parse(window.localStorage.getItem("maf-summary-barchart"));
        var lastUpdate = defectstatus[tableConfig.updateTableName][0].LastUpdateDt;
        window.localStorage.setItem("maf-lastUpate", lastUpdate);

        var statusarray = new Array();
        for (var i = 0; i < defectstatus[tableConfig.dataTableName].length; i++) {
            var defectdata = new Object();
            defectdata.type = "column";
            defectdata.name = defectstatus[tableConfig.dataTableName][i].DefectStatus;
            defectdata.data = new Array(defectstatus[tableConfig.dataTableName][i].Urgent, defectstatus[tableConfig.dataTableName][i].High, defectstatus[tableConfig.dataTableName][i].Medium, defectstatus[tableConfig.dataTableName][i].Low);
            statusarray.push(defectdata);
        }
        var categorysummary = JSON.parse(window.localStorage.getItem("maf-summary-piechart"));
        var categorysummaryarray = new Array();
        for (var i = 0; i < categorysummary[tableConfig.dataTableName].length; i++) {
            if (!categorysummary[tableConfig.dataTableName][i].DefectStatus) {
                continue;
            }
            
            var statusdata = new Object();
            statusdata.name = categorysummary[tableConfig.dataTableName][i].DefectStatus;
            statusdata.y = categorysummary[tableConfig.dataTableName][i].Count;
            categorysummaryarray.push(statusdata);
        }
        var cheight = window.innerHeight - highchartSize.getFooterHeight() - highchartSize.getHeaderHeight() -40;

        var category = new Object();
        category.type = "pie";
        category.name = "DefectStatus";
        category.data = categorysummaryarray;
        category.center = new Array(60,80);
        category.size = 100;
        category.showInLegend = false;
        category.dataLabels = new Object();
        category.dataLabels.enabled = false;
        statusarray.push(category);
        $("#summary-gridview").empty();
        $('#container').highcharts({
            chart: {
                height: cheight,
                backgroundColor: 'rgba(255, 255, 255, 0)',
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false
            },
            title: {
                text: 'YTD Issue Summary by Severity and State'
            },
            subtitle: {
                text: 'Last Update On ' + window.localStorage.getItem("maf-lastUpate") + window.localStorage.getItem("maf-timezone"),
            },
            xAxis: {
                categories: ['Urgent', 'High', 'Medium', 'Low']
            },
            tooltip: {
                formatter: function () {
                    var s;
                    if (this.point.name) {
                        s = '' + this.point.name + ': ' + this.y;
                    } else {
                        s = '' + this.x + '<br/>' + this.series.name + ': ' + this.y;
                    }
                    return s;
                }
            },
            labels: {
                items: [{
                    html: null,
                    style: {
                        left: '40px',
                        top: '8px',
                        color: 'black'
                    }
                }]
            },
            series: statusarray,
            credits: {
                enabled: false
            },
            exporting: {
                enabled: false
            }
        });
    }
};