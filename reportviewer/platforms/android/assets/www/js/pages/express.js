/***********************************************************************
*author:huang.chao
*date:2013.9.6
*overview:TBD
*modify:2013.9.14
************************************************************************/
var express = {
    initialize: function () {
        $.mobile.showPageLoadingMsg();
        $(".express-link").on('click', function () {
            $.mobile.changePage("express.html", { transition: "pop" });
        });
        $(".tendency-link").on('click', function () {
            $.mobile.changePage("tendency.html", { transition: "pop" });
        });
        $(".summary-link").on('click', function () {
            $.mobile.changePage("summary.html", { transition: "pop" });
        });
        $(".detail-btn").on('click', function () {
            $.mobile.changePage("detail.html", { transition: "pop" });
        });
		$(".home-btn").on('click', function () {
			var userid = window.localStorage.getItem("mar-userid");
            $.mobile.changePage("home.html?userid="+userid, { transition: "pop" });
        });
        if (!window.localStorage.getItem("maf-options-" + window.localStorage.getItem("maf-project"))) {
            common.ajax("project=" + window.localStorage.getItem("maf-project"), "getoptions", this.retrieveoptionlistcallback);
        }
        common.ajax("pj=" + window.localStorage.getItem("maf-project"),"getdaily",this.piechartshowcallback)
    },
    retrieveoptionlistcallback: function (issuccess, msg) {
        if (!issuccess) {
            alert(msg);
        } else {
            var optionlist = JSON.parse(msg);
            var options = new Array();
            for (var i = 0; i < optionlist.length; i++) {
                options.push(optionlist[i].ProjectOption);
            }
            window.localStorage.setItem("maf-options-" + window.localStorage.getItem("maf-project"), options);
        }
    },
    
    piechartshowcallback: function (issuccess, msg) {
        $.mobile.hidePageLoadingMsg();
        if (!issuccess) {
            alert(msg);
        } else {

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
            var timezone = datalist[tableConfig.timezoneName][0].timezone;
            window.localStorage.setItem("maf-timezone", timezone);
            window.localStorage.setItem("maf-lastUpate", lastUpdate);
            var totleUrgent = 0;
            var totleHigh = 0;
            var totleMedium = 0;
            var totleLow = 0;
            for (var i = 0; i < datalist[tableConfig.severityByCategoryName].length; i++) {
                totleUrgent += datalist[tableConfig.severityByCategoryName][i].Urgent;
                totleHigh += datalist[tableConfig.severityByCategoryName][i].High;
                totleMedium += datalist[tableConfig.severityByCategoryName][i].Medium;
                totleLow += datalist[tableConfig.severityByCategoryName][i].Low;
                if (!datalist[tableConfig.severityByCategoryName][i].Category) {
                    datalist[tableConfig.severityByCategoryName][i].Category = "Others";
                }
                var rowTotal = datalist[tableConfig.severityByCategoryName][i].Urgent + datalist[tableConfig.severityByCategoryName][i].High + datalist[tableConfig.severityByCategoryName][i].Medium + datalist[tableConfig.severityByCategoryName][i].Low;
                content += ''
                    + '<div class="ui-block-a">'
                    + '	<div class="ui-body ui-body-d">' + datalist[tableConfig.severityByCategoryName][i].Category + '</div>'
                    + '</div>'
                    + '<div class="ui-block-b">'
                    + '	<div class="ui-body ui-body-d">' + datalist[tableConfig.severityByCategoryName][i].Urgent + '</div>'
                    + '</div>'
                    + '<div class="ui-block-c">'
                    + '	<div class="ui-body ui-body-d">' + datalist[tableConfig.severityByCategoryName][i].High + '</div>'
                    + '</div>'
                    + '<div class="ui-block-d">'
                    + '	<div class="ui-body ui-body-d">' + datalist[tableConfig.severityByCategoryName][i].Medium + '</div>'
                    + '</div>'
                    + '<div class="ui-block-e">'
                    + '	<div class="ui-body ui-body-d">' + datalist[tableConfig.severityByCategoryName][i].Low + '</div>'
                    + '</div>'
                    + '<div class="ui-block-f">'
                    + '	<div class="ui-body ui-body-d">' + rowTotal + '</div>'
                    + '</div>';
            }
            var total = totleUrgent + totleHigh + totleMedium + totleLow;
            content += ''
                + '<div class="ui-block-a">'
                + '	<div class="ui-bar ui-bar-b"><strong>Summary</strong></div>'
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
            $("#express-gridview").html(content).trigger("create");

            //var cheight = window.innerHeight
            //    - highchartSize.getFooterHeight()
            //    - highchartSize.getHeaderHeight() - highchartSize.getTable().height - 10;

            //var cwidth = highchartSize.getTable().width - 17;

            var datalist = JSON.parse(msg);
            var dataarray = new Array();
            window.localStorage.setItem("maf-express-today", datalist[tableConfig.timeName][0].Today);
            if (datalist[tableConfig.severityCountName].length === 0) {
                var data = new Object();
                data.name = "No Issue";
                data.y = 1;
                dataarray.push(data);
            } else {
                for (var i = 0; i < datalist[tableConfig.severityCountName].length; i++) {
                    var data = new Object();
                    data.name = datalist[tableConfig.severityCountName][i].Severity;
                    data.color = severity.getColor(data.name);
                    data.y = datalist[tableConfig.severityCountName][i].Count;
                    dataarray.push(data);
                }
            }
           
            $('#container').highcharts({
                chart: {
                    height: 300,
                    //width: cwidth,
                    backgroundColor: 'rgba(255, 255, 255, 0)',
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                    margin: [0, 0, 0, 0]
                },
                title: {
                    text: 'New Issue Analysis ' + window.localStorage.getItem("maf-express-today") + window.localStorage.getItem("maf-timezone"),
                },
                subtitle: {
                    text: 'Last Update On ' + window.localStorage.getItem("maf-lastUpate") + window.localStorage.getItem("maf-timezone"),
                },
                tooltip: {
                    pointFormat: dataarray[0].name == "No Issue"?"":
                        '{series.name}: <b>{point.y}</b>'
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: true,
                            distance: -30,
                            format: dataarray[0].name == "No Issue" ? null : '{point.name}:{point.y}',
                            style: {
                                fontWeight: 'bold',
                                color: 'white',
                                textShadow: dataarray[0].name == "No Issue" ? null : '0px 1px 2px black'
                            }
                        },
                        startAngle: -90,
                        endAngle: 90,
                        center: ['50%', '90%'],
                    }
                },
                series: [{
                    type: 'pie',
                    name: 'Issue',
                    innerSize: '50%',
                    data: dataarray,
                }],
                credits: {
                    enabled: false
                },
                exporting: {
                    enabled: false
                }
            });

            
        }
    }
};

var severity = {
    getColor: function (severity) {
        switch (severity.toLowerCase()) {
            case 'urgent':
                return '#f00';
            case 'high':
                return '#c0504d';
            case 'medium':
                return '#fc0';
            case 'low':
                return '#00b050';
        }
    },
};