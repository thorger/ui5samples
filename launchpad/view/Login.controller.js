(function() {
  "use strict";

  jQuery.sap.require("sap.ui.ipw.ViewApp.util.Formatter");
  jQuery.sap.require("sap.m.MessageBox");

  sap.ui.core.mvc.Controller.extend("sap.ui.ipw.ViewApp.view.Login", {

    onInit: function() {
      this._oView = this.getView();
      this._oView.setModel(new sap.ui.model.json.JSONModel("model/ComboBoxOptions.json"), "csModel");
    },

    clearFields: function() {
      this.byId("inputTextForUsernameField").setValue("");
      this.byId("inputPasswordForPasswordField").setValue("");
    },

    authenticate: function(sUsername, sPassword, fnSuccess, fnError) {
      var oController = this;
      this.sCurrentUserContext = sUsername;
      jQuery.ajax({
        url: "/quo/login.do",
        type: "POST",
        data: {
          "Dialog": "authenticate",
          "LoginType": "User",
          "userlogin": sUsername,
          "password": sPassword
        },
        beforeSend: function(xhr){
          xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
          xhr.setRequestHeader('Pragma', 'no-cache');
        },
        success: function(data, textStatus, jqXHR) {
          fnSuccess(oController, data, textStatus, jqXHR);
        },
        error: function(err) {
          fnError(err, oController);
        }
      });
      // Due to a change in a SNAPSHOT, will need to include a call to the legacy UI login to ensure entry into the eApp
      // TODO Remove when able to access eApp with one-time ajax call
      jQuery.ajax({
        url: "/csiroot/signOnHandler.exhtm",
        type: "POST",
        data: {
          "Dialog": "authenticate",
          "LoginType": "User",
          "userlogin": sUsername,
          "password": sPassword
        },
        beforeSend: function(xhr){
          xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
          xhr.setRequestHeader('Pragma', 'no-cache');
        },
        success: function(data, textStatus, jqXHR) {
          fnSuccess(oController, data, textStatus, jqXHR);
        },
        error: function(err) {
          fnError(err, oController);
        }
      });
    },

    loginSuccess: function(oController, data, textStatus, jqXHR) {
      var expr = new RegExp("Ext.Msg.alert\\('([^']*)', '([^']*)',", "m");
      var arr = expr.exec(jqXHR.responseText);
      if (arr !== null) {
        oController.loginFailure(arr[2], oController);
        oController.clearFields();
      } else {
        oController.goToMainPage();
      }
    },

    loginFailure: function(err, oController) {
      sap.m.MessageBox.show(err, {
        icon: sap.m.MessageBox.Icon.ERROR,
        title: "Failed"
      });
    },

    performLogin: function() {
      var sUsername = this.byId("inputTextForUsernameField").getValue(), sPassword = this.byId(
          "inputPasswordForPasswordField").getValue();
      if (sUsername == null || sUsername == "" || sPassword == null || sPassword == "") {
        this.loginFailure("Must provide username and password.", this);
        return;
      }
      this.authenticate(sUsername, sPassword, this.loginSuccess, this.loginFailure);
    },

    getRouter: function() {
      return sap.ui.core.UIComponent.getRouterFor(this);
    },

    goToMainPage: function() {

      var sDefaultLanguage = "en";
      var sLanguageParam = "sap-language=";
      var sUserNameParam = "user="+this.sCurrentUserContext;
      // Get selected language and add it as a URL parameter
      var sSelectedLanguage = this._oView.byId("comboLanguageSelect").getSelectedKey();

      var sLaunchPadUrl = "sandbox/fioriSandbox.html";
      if (sSelectedLanguage && sSelectedLanguage.length != "") {
        sLanguageParam += sSelectedLanguage;
      } else {
        sLanguageParam += sDefaultLanguage;
      }
      
      window.location.replace(sLaunchPadUrl + "?" + sLanguageParam + "&" + sUserNameParam);
      
    }

  });
})();
