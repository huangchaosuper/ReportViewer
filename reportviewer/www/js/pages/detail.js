/***********************************************************************
*author:huang.chao
*date:2013.9.2
*overview:TBD
************************************************************************/
var detail = {
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
        $(".back-btn").on('click', function () {
            $.mobile.changePage("express.html", { transition: "pop" });
        });
        detail.listviewshow();
    },
    listviewshow: function () {
        $.mobile.showPageLoadingMsg();
        var today = window.localStorage.getItem("maf-express-today");
        common.ajax("pj=" + window.localStorage.getItem("maf-project") + "&st=" + today + "&et=" + today, "getsummary", this.listviewshowcallback);
    },
    listviewshowcallback: function (issuccess, msg) {
        $.mobile.hidePageLoadingMsg();
        if (!issuccess) {
            alert(msg);
        } else {
            var datalist = JSON.parse(msg);
            var urgentlist = new Array();
            var highlist = new Array();
            var mediumlist = new Array();
            var lowlist = new Array();

            for (var i = 0; i < datalist.length; i++) {
                var submitor = new String();
                submitor = datalist[i].Submitor;

                if (submitor.indexOf('_') > -1) {
                    submitor = submitor.replace(/_/, '@');
                }

                var defect = new Object();
                //defect.id = datalist[i].ID;
                defect.summary = datalist[i].Summary;
                defect.severity = datalist[i].Severity;
                defect.submitor = submitor;
                defect.title = datalist[i].Title;
                //defect.status = datalist[i].DefectStatus;

                switch (defect.severity) {
                    case "Urgent":
                        urgentlist.push(defect);
                        break;
                    case "High":
                        highlist.push(defect);
                        break;
                    case "Medium":
                        mediumlist.push(defect);
                        break;
                    case "Low":
                        lowlist.push(defect);
                        break;
                }
            }

            var content = ''
            if (urgentlist.length > 0) {
                content += '<li data-role="list-divider">Urgent<span class="ui-li-count">' + urgentlist.length + '</span></li>'
                for (var i = 0; i < urgentlist.length; i++) {
                    content += '<li data-icon="false"><a href="#" class="detail-popup">'
                        + urgentlist[i].summary + '</a><a data-icon="email" href="mailto:'
                        + urgentlist[i].submitor + '?Subject='
                        + urgentlist[i].title + '"></a></li>'
                }
            }
            if (highlist.length > 0) {
                content += '<li data-role="list-divider">High<span class="ui-li-count">' + highlist.length + '</span></li>'
                for (var i = 0; i < highlist.length; i++) {
                    content += '<li data-icon="false"><a href="#" class="detail-popup">'
                        + highlist[i].summary + '</a><a data-icon="email" href="mailto:'
                        + highlist[i].submitor + '?Subject='
                        + highlist[i].title + '"></a></li>'
                }
            }
            if (mediumlist.length > 0) {
                content += '<li data-role="list-divider">Medium<span class="ui-li-count">' + mediumlist.length + '</span></li>'
                for (var i = 0; i < mediumlist.length; i++) {
                    content += '<li data-icon="false"><a href="#" class="detail-popup">'
                        + mediumlist[i].summary + '</a><a data-icon="email" href="mailto:'
                        + mediumlist[i].submitor + '?Subject='
                        + mediumlist[i].title + '"></a></li>'
                }
            }
            if (lowlist.length > 0) {
                content += '<li data-role="list-divider">Low<span class="ui-li-count">' + lowlist.length + '</span></li>'
                for (var i = 0; i < lowlist.length; i++) {
                    content += '<li data-icon="false"><a href="#" class="detail-popup">'
                        + lowlist[i].summary + '</a><a data-icon="email" href="mailto:'
                        + lowlist[i].submitor + '?Subject='
                        + lowlist[i].title + '"></a></li>'
                }
            }
            $("#express-detail").html(content).listview('refresh');
            $(".detail-popup").on("click", function () {
                //$("#detail-popup").html($(this).val()).popup("open");
                $("#detail-popup").html("<p>"+$(this).text()+"</p>").popup().popup("open");
            });
        }
    }
};

var defectInfo = {
    getSummary: function (defect) {
        return '[CR#' + defect.id + ']' + defect.summary + '----Submit by :' + defect.submitor;
    },
    getMailTitle: function (defect) {
        return '[' + defect.severity + '][CR' + +defect.id + ']' + defect.summary;
    }
}