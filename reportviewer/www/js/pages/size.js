/***********************************************************************
*author:huang.chao
*date:2013.9.2
*overview:TBD
************************************************************************/
var highchartSize = {
    getFooterHeight: function () {
        var footer = document.getElementsByClassName("ui-footer ui-bar-b ui-footer-fixed slideup");
        if (footer) {
            return footer[0].offsetHeight;
        }
        return 0;
    },
    getHeaderHeight: function () {
        var header = document.getElementsByClassName("ui-header ui-bar-b ui-header-fixed slidedown")
        if (header) {
            if (header[0].offsetHeight == 0)
                return header[1].offsetHeight;
            return header[0].offsetHeight;
        }
        return 0;
    },
    getTable: function () {
        var table = new Object();
        table.width = 0;
        table.height = 0;
        var tempTable = document.getElementsByClassName("ui-grid-d");
        if (tempTable) {
            table.width = tempTable[0].offsetWidth;
            table.height = tempTable[0].offsetHeight;
        }
        return table;
    },
    getWidth: function () {
        var width = window.innerWidth;
        width -= 60;
        return width;
    }
};