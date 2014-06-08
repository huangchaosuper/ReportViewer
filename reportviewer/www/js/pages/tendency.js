/***********************************************************************
*author:huang.chao
*date:2013.9.6
*overview:TBD
*modify:2013.10.29
*modify by:Zhou Yang
************************************************************************/
var tendency = {
    initialize: function () {
        $("#tendency-target").center();
        var curr = true;
        $(".express-link").on('click', function () {
            $.mobile.changePage("express.html", { transition: "pop" });
        });
        $(".tendency-link").on('click', function () {
            $.mobile.changePage("tendency.html", { transition: "pop" });
        });
        $(".summary-link").on('click', function () {
            $.mobile.changePage("summary.html", { transition: "pop" });
        });

        if (!window.localStorage.getItem("maf-tendency-startdate")) {
            window.localStorage.setItem("maf-tendency-startdate", common.formatdate1(common.getlastmonth()));
        }
        if (!window.localStorage.getItem("maf-tendency-enddate")) {
            window.localStorage.setItem("maf-tendency-enddate", common.formatdate1(common.getdate()));
        }
        if (!window.localStorage.getItem("maf-tendency-groupby")) {
            window.localStorage.setItem("maf-tendency-groupby", "Weekly");
        }

        $("#container").on("swipeleft", function () {
            $.mobile.showPageLoadingMsg();
            if (curr) {
                $("#tendency-target").text("●○");
                tendency.linechartshow();
            } else {
                $("#tendency-target").text("○●");
                tendency.columnchartshow();
            }
            curr = !curr;
        });
        $("#container").on("swiperight", function () {
            $.mobile.showPageLoadingMsg();
            if (curr) {
                $("#tendency-target").text("●○");
                tendency.linechartshow();
            } else {
                $("#tendency-target").text("○●");
                tendency.columnchartshow();
            }
            curr = !curr;
        });
        $(".tendency-btn-set").on('click', function () {
            $.mobile.changePage("tendency-set.html", { transition: "pop" });
        });
        $(".home-btn").on('click', function () {
            var userid = window.localStorage.getItem("mar-userid");
            $.mobile.changePage("home.html?userid=" + userid, { transition: "pop" });
        });
        this.columnchartshow();
    },
    columnchartshow: function () {
        $.mobile.showPageLoadingMsg();
        var startdate = window.localStorage.getItem("maf-tendency-startdate");
        var enddate = window.localStorage.getItem("maf-tendency-enddate");
        var groupby = window.localStorage.getItem("maf-tendency-groupby");
        if (groupby === "Daily") {
            groupby = "createdt";
        } else if (groupby === "Weekly") {
            groupby = "cweek";
        } else if (groupby === "Monthly") {
            groupby = "cmonth";
        }
        common.ajax("pj=" + window.localStorage.getItem("maf-project") + "&r=" + groupby + "&c=DefectStatus&st=" + startdate + "&et=" + enddate, "getpivot", this.columnchartshowcallback);
    },
    columnchartshowcallback: function (issuccess, msg) {
        $.mobile.hidePageLoadingMsg();
        if (!issuccess) {
            alert(msg);
        } else {
            var startdate = window.localStorage.getItem("maf-tendency-startdate");
            var enddate = window.localStorage.getItem("maf-tendency-enddate");
            var startDt = new Date(startdate);
            var endDt = new Date(enddate);
            var datalist = JSON.parse(msg);
            var groupbyarray = new Array();
            var groupby = window.localStorage.getItem("maf-tendency-groupby");
            var activearray = new Array();
            var activesum = 0;
            var closedarray = new Array();
            var closesum = 0;
            var lastUpdate = datalist[tableConfig.updateTableName][0].LastUpdateDt;
            window.localStorage.setItem("maf-lastUpate", lastUpdate);

            var option = new reportOption(startDt, endDt, groupby);

            for (var i = 0; i < datalist[tableConfig.dataTableName].length; i++) {
                var activeCount = 0, closeCount = 0;
                if (option.currentData() == option.getData(datalist[tableConfig.dataTableName][i][option.indexName])) {
                    activeCount = datalist[tableConfig.dataTableName][i].Fixed + datalist[tableConfig.dataTableName][i].New + datalist[tableConfig.dataTableName][i].Open;
                    closeCount = datalist[tableConfig.dataTableName][i].Closed;
                }
                else {
                    i--;
                }
                activesum += activeCount;
                closesum += closeCount;

                var groupData = option.prefix + option.displayData();
                if (groupbyarray[groupbyarray.length - 1] == groupData) {
                    activearray[activearray.length - 1] += activeCount;
                    closedarray[closedarray.length - 1] += closeCount;
                }
                else {
                    groupbyarray.push(groupData);
                    activearray.push(activesum);
                    closedarray.push(closesum);
                }

                option.increase();
            }


            while (option.currentData() <= option.endData) {
                var groupData = option.prefix + option.displayData();
                if (groupbyarray[groupbyarray.length - 1] != groupData) {
                    groupbyarray.push(groupData);
                    activearray.push(activesum);
                    closedarray.push(closesum);
                }
                option.increase();
            }

            $('#container').highcharts({
                chart: {
                    backgroundColor: 'rgba(255, 255, 255, 0)',
                    type: 'area'
                },
                title: {
                    text: 'Active + Closed Issues (' + groupby + ')'
                },
                subtitle: {
                    text: 'Last Update On ' + window.localStorage.getItem("maf-lastUpate") + window.localStorage.getItem("maf-timezone"),
                },
                xAxis: {
                    labels: {
                        enabled: false
                    },
                    title: {
                        text: 'from:' + startdate + ' to:' + enddate
                    },
                    categories: groupbyarray
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'CR Total Number'
                    }
                },
                plotOptions: {
                    area: {
                        stacking: 'normal',
                        lineColor: '#666666',
                        lineWidth: 1,
                        marker: {
                            lineWidth: 1,
                            lineColor: '#666666'
                        }
                    }
                },
                legend: {
                    //backgroundColor: '#FFFFFF',
                    reversed: true
                },
                tooltip: {
                    shared: true,
                },
                plotOptions: {
                    series: {
                        stacking: 'normal'
                    }
                },
                series: [{
                    name: 'Total Active Issues',
                    data: activearray
                }, {
                    name: 'Total Closed Issues',
                    data: closedarray
                }],
                credits: {
                    enabled: false
                },
                exporting: {
                    enabled: false
                }
            });
        }
    },
    linechartshow: function () {
        var startdate = window.localStorage.getItem("maf-tendency-startdate");
        var enddate = window.localStorage.getItem("maf-tendency-enddate");
        var groupby = window.localStorage.getItem("maf-tendency-groupby");
        if (groupby === "Daily") {
            groupby = "createdt";
        } else if (groupby === "Weekly") {
            groupby = "cweek";
        } else if (groupby === "Monthly") {
            groupby = "cmonth";
        }
        common.ajax("pj=" + window.localStorage.getItem("maf-project") + "&r=Severity&t=createDT&c=" + groupby + "&st=" + startdate + "&et=" + enddate, "getcount", this.linechartshowcallback);
    },
    linechartshowcallback: function (issuccess, msg) {
        $.mobile.hidePageLoadingMsg();
        if (!issuccess) {
            alert(msg);
        } else {
            var startdate = window.localStorage.getItem("maf-tendency-startdate");
            var enddate = window.localStorage.getItem("maf-tendency-enddate");
            var startDt = new Date(startdate);
            var endDt = new Date(enddate);
            var datalist = JSON.parse(msg);
            var groupbyarray = new Array();
            var groupby = window.localStorage.getItem("maf-tendency-groupby");
            var countarray = new Array();
            var lastUpdate = datalist[tableConfig.updateTableName][0].LastUpdateDt;
            window.localStorage.setItem("maf-lastUpate", lastUpdate);

            var option = new reportOption(startDt, endDt, groupby);

            for (var i = 0; i < datalist[tableConfig.dataTableName].length; i++) {
                var count;
                if (option.currentData() == option.getData(datalist[tableConfig.dataTableName][i][option.indexName])) {
                    count = datalist[tableConfig.dataTableName][i].Count;
                }
                else {
                    count = 0;
                    i--;
                }
                var groupData = option.prefix + option.displayData();
                if (groupbyarray[groupbyarray.length - 1] == groupData) {
                    countarray[countarray.length - 1] += count;
                }
                else {
                    groupbyarray.push(option.prefix + option.displayData());
                    countarray.push(count);
                }
                option.increase();
            }


            while (option.currentData() <= option.endData) {
                var groupData = option.prefix + option.displayData();
                if (groupbyarray[groupbyarray.length - 1] != groupData) {
                    groupbyarray.push(groupData);
                    countarray.push(0);
                }
                option.increase();
            }

            $('#container').highcharts({
                chart: {
                    backgroundColor: 'rgba(255, 255, 255, 0)',
                    type: 'line'
                },
                title: {
                    text: 'Issue Submission by ' + groupby
                },
                subtitle: {
                    text: 'Last Update On ' + window.localStorage.getItem("maf-lastUpate") + window.localStorage.getItem("maf-timezone"),
                },
                xAxis: {
                    labels: {
                        enabled: false
                    },
                    title: {
                        text: 'from:' + startdate + ' to:' + enddate
                    },
                    categories: groupbyarray
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'CR Total Number'
                    }
                },
                series: [{
                    name: 'Issues',
                    data: countarray
                }],
                legend: {
                    enabled: false
                },
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


function reportOption(startDate, endDate, groupType) {

    var cData;
    var tempStartDate = startDate;

    this.groupType = groupType;
    this.currentData = getCurrentData;
    this.displayData = getDisplayData;
    this.setData = setCurrentData;
    this.increase = increaseData;
    this.getData = getSameTypeData;
    this.startYear = dateFunction.getFullYear(startDate);
    this.endYear = dateFunction.getFullYear(endDate);
    var isCrossYear = (this.endYear - this.startYear) > 0 ? true : false;

    switch (this.groupType) {
        case "Daily":
            this.feed = 1000 * 60 * 60 * 24;
            this.indexName = "createdt";
            this.prefix = "";
            var tempDate = new Date(startDate);
            cData = tempDate.getTime();
            tempDate = new Date(endDate);
            this.endData = tempDate.getTime();
            break;
        case "Weekly":
            this.feed = 1;
            this.indexName = "cweek";
            cData = dateFunction.getYearWeek(startDate) + startDate.getFullYear() * 100;
            this.prefix = "Week:";
            this.endData = dateFunction.getYearWeek(endDate) + endDate.getFullYear() * 100;
            break;
        case "Monthly":
            this.feed = 1;
            this.indexName = "cmonth";
            cData = dateFunction.getMonth(startDate) + startDate.getFullYear() * 100;
            this.endData = dateFunction.getMonth(endDate) + endDate.getFullYear() * 100;
            this.prefix = "Month:";
            break;
        default:
            this.feed = 1;
            this.indexName = "cweek";
            cData = dateFunction.getYearWeek(startDate) + startDate.getFullYear() * 100;
            this.endData = dateFunction.getMonth(endDate) + endDate.getFullYear() * 100;
            this.prefix = "Week:";
            break;
    }

    function getDisplayData() {
        if (groupType == "Daily") {
            var tempDate = new Date();
            tempDate.setTime(cData);
            var year = tempDate.getFullYear().toString();
            var month = (tempDate.getMonth() + 1).toString();
            var day = tempDate.getDate().toString();
            return month + "/" + day + "/" + year;
        } else if (groupType == "Monthly") {
            var year = Math.floor(cData / 100);
            var month = cData % year - 1;
            return dateFunction.getMonthString(month) + ".," + year.toString();
        } else if (groupType == "Weekly") {
            var year = Math.floor(cData / 100);
            var week = cData % year;
            return dateFunction.getWeekString(week, year);
        }
    }

    function getCurrentData() {
        return cData;
    }

    function setCurrentData(data) {
        if (groupType == "Daily") {
            var tempDate = new Date(data);
            cData = tempDate.getTime();
        }
        else {
            cData = data;
        }
    }

    function getSameTypeData(data) {
        if (groupType == "Daily") {
            var tempData = new Date(data);
            return tempData.getTime();
        }
        else {
            return data;
        }
    }



    function increaseData() {
        cData += this.feed;
        switch (groupType) {
            case "Daily":
                break;
            case "Weekly":
                if (isCrossYear) {
                    var thisyear = tempStartDate.getFullYear();
                    var lastDay = new Date(thisyear, 11, 31);
                    if (cData > (dateFunction.getYearWeek(lastDay) + thisyear * 100)) {
                        tempStartDate = new Date(thisyear + 1, 11, 31);
                        cData = 1 + (thisyear + 1) * 100;
                    }
                }
                break;
            case "Monthly":
                if (isCrossYear) {
                    var thisyear = tempStartDate.getFullYear();
                    var lastDay = new Date(thisyear, 11, 31);
                    if (cData > dateFunction.getMonth(lastDay) + thisyear * 100) {
                        cData = 1 + (thisyear + 1) * 100;
                        tempStartDate = new Date(thisyear + 1, 11, 31);
                    }
                }
                break;
            default:
                if (isCrossYear) {
                    var thisyear = tempStartDate.getFullYear();
                    var lastDay = new Date(thisyear, 11, 31);
                    if (cData > (dateFunction.getYearWeek(lastDay) + thisyear * 100)) {
                        tempStartDate = new Date(thisyear + 1, 11, 31);
                        cData = 1 + (thisyear + 1) * 100;
                    }
                }
                break;
        }
    }

}



var dateFunction = {

    addDate: function (startDay, numDays) {
        var startDt = new Date(startDay);
        startDt.setDate(startDt.getDate() + numDays);
        return startDt;
    },

    isSameDay: function (day1, day2) {
        var dayLeft = new Date(day1);
        var dayRight = new Date(day2);
        if (dayLeft.getTime() == dayRight.getTime())
            return true;
        else
            return false;
    },


    getOffsetDay: function (startDay, endDay) {
        var misc = endDay.getTime() - startDay.getTime();
        return (misc / 3600000 / 24);
    },

    getMonth: function (date) {
        var currentDate = new Date(date);
        return currentDate.getMonth() + 1;
    },

    getYearWeek: function (date) {
        var currentDate = new Date(date);
        var firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1);
        var leftDayOfThisWeek = 6 - currentDate.getDay();
        return Math.ceil((leftDayOfThisWeek + this.getOffsetDay(firstDayOfYear, currentDate)) / 7);
    },

    getYear: function (date) {
        var currentData = new Date(date);
        return currentData.getYear();
    },

    getFullYear: function (date) {
        var currentData = new Date(date);
        return currentData.getFullYear();
    },

    getMonthString: function (numOfMonth) {
        var monthString = new Array('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jue', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec');
        return monthString[numOfMonth];
    },

    getWeekString: function (weekNum, year) {
        var firstDay = new Date(year, 0, 1);
        var feed = 24 * 3600 * 1000;
        var startDay = new Date();
        var endDay = new Date();
        if (firstDay.getDay() == 0) {
            startDay.setTime(firstDay.getTime() + feed * (weekNum - 1) * 7);
            endDay.setTime(startDay.getTime() + feed * 6);
        }
        else {
            var offsetDays = firstDay.getDay();
            startDay.setTime(firstDay.getTime() - feed * offsetDays + feed * (weekNum - 1) * 7);
            endDay.setTime(startDay.getTime() + feed * 6);
        }
        var startNum = startDay.getDate() > 9 ? startDay.getDate() : '0' + startDay.getDate();
        var endNum = endDay.getDate() > 9 ? endDay.getDate() : '0' + endDay.getDate();
        return dateFunction.getMonthString(startDay.getMonth()) + ' ' + startNum + '-' + endNum;
    }

}


