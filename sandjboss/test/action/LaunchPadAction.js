/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
(function() {
  "use strict";

  jQuery.sap.declare("IPWUILaunchPad.test.action.LaunchPadAction");
  jQuery.sap.require("sap.ui.test.Opa5");
  jQuery.sap.require("sap.ui.test.opaQunit");

  IPWUILaunchPad.test.action.LaunchPadAction = sap.ui.test.Opa5.extend("IPWUILaunchPad.test.action.LaunchPadAction", {
 

    iTypeAnInputValue: function(sInputValue, sInputId, sErrorMessage, sSuccessMessage) {
      return this.waitFor({
        timeout: 60,
        searchOpenDialogs: false,
        controlType: "sap.m.Input",
        check: function(aInputs) {
          for (var i = 0; i < aInputs.length; i++) {
            if (aInputs[i].getId().indexOf(sInputId) > -1) {
              aInputs[i].setValue(sInputValue);
              aInputs[i].fireLiveChange();
              return true;
            }
          }
        },
        success: function() {
          ok(true, sSuccessMessage);
        },
        errorMessage: sErrorMessage
      });
    },
 
    iPressButton: function(sButtonId, sErrorMessage, sSuccessMessage, bDialog) {
      return this.waitFor({
        timeout: 60,
        searchOpenDialogs: bDialog,
        controlType: "sap.m.Button",
        check: function(aButtons) {
          for (var i = 0; i < aButtons.length; i++) {
            if (aButtons[i].getId().indexOf(sButtonId) > -1) {
              aButtons[i].firePress();
              return true;
            }
          }
        },
        success: function(aButtons) {
          ok(true, sSuccessMessage);
        },
        errorMessage: sErrorMessage
      });
    }
  });
}());
