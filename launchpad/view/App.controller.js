(function() {
  "use strict";

  sap.ui.core.mvc.Controller.extend("sap.ui.ipw.ViewApp.view.App", {

    onInit: function() {
        //this.goToLoginPage();
        var sDefaultLanguage = "en";
      var sLanguageParam = "sap-language=en";
      //var sUserNameParam = "user="+this.sCurrentUserContext;
      // Get selected language and add it as a URL parameter
      //var sSelectedLanguage = this._oView.byId("comboLanguageSelect").getSelectedKey();

      var sLaunchPadUrl = "sandbox/fioriSandbox.html";
    /*  if (sSelectedLanguage && sSelectedLanguage.length != "") {
        sLanguageParam += sSelectedLanguage;
      } else {
        sLanguageParam += sDefaultLanguage;
      }*/
      
      window.location.replace(sLaunchPadUrl);// + "?" + sLanguageParam); //+ "&" + sUserNameParam);
    },

    getRouter: function() {
      return sap.ui.core.UIComponent.getRouterFor(this);
    },

    goToUrl: function(sUrl) {
      window.location.replace(sUrl);
    },

    goToLoginPage: function() {
      window.location.replace("#/Login");
    }

  });
})();
