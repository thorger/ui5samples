(function () {
  "use strict";

  jQuery.sap.declare("sap.ui.ipw.ViewApp.util.Formatter");

  var sLocale = sap.ui.getCore().getConfiguration().getLanguage();
  var oBundle = jQuery.sap.resources({
    url: "i18n/messageBundle.properties",
    locale: sLocale
  });

  sap.ui.ipw.ViewApp.util.Formatter = {
    _oBundle: oBundle,

    uppercaseFirstChar: function (sStr) {
      return sStr.charAt(0).toUpperCase() + sStr.slice(1);
    },

    formatDateForDisplay: function (sDate) {
      if (sDate == null) {
        return sDate;
      } else {
        var splitArray = sDate.toString().split(' ');
        return splitArray[0] + " " + splitArray[1] + " " + splitArray[2] + " " + splitArray[3];
      }
    },

    formatDateForDatePicker: function (sDate) {
      if (sDate == null) {
        return sDate;
      } else {
        var splitArray = sDate.toString().split(' ');
        var sNewDate = new Date(splitArray[0] + " " + splitArray[1] + " " + splitArray[2] + " " + splitArray[3]);
        var sMonth = sNewDate.getMonth() + 1;
        var sDay = splitArray[2];
        var sYear = splitArray[3];

        // fix month and to be two numbers for MM format.
        if (sMonth < 10) {
          sMonth = '0' + sMonth;
        }
        return sMonth + "/" + sDay + "/" + sYear;
      }
    },

    i18nFormatter: function (sKey) {
      return sap.ui.ipw.ViewApp.util.Formatte._oBundle.getText(sKey);
    },

    discontinuedStatusState: function (sDate) {
      return sDate ? "Error" : "None";
    },

    discontinuedStatusValue: function (sDate) {
      return sDate ? "Discontinued" : "";
    },

    currencyValue: function (value) {
      return parseFloat(value).toFixed(2);
    }

  };
})();
