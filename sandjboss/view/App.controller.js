(function() {
  "use strict";

  sap.ui.core.mvc.Controller.extend("sap.ui.ipw.ViewApp.view.App", {

    onInit: function() {
        this.goToLoginPage();
    },
    
    onExit: function() {
      sap.m.InstanceManager.closeAllDialogs();
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
