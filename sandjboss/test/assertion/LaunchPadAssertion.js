 
(function() {
  "use strict";

  jQuery.sap.declare("IPWUILaunchPad.test.assertion.LaunchPadAssertion");
  jQuery.sap.require("sap.ui.test.Opa5");
  jQuery.sap.require("sap.ui.test.opaQunit");

  IPWUILaunchPad.test.assertion.LaunchPadAssertion = sap.ui.test.Opa5.extend(
      "IPWUILaunchPad.test.assertion.LaunchPadAssertion", {
        
        iShouldSeeLoginPage: function(sLabelText, sErrorMessage, sSuccessMessage){
          return this.waitFor({
            timeout: 60,
            controlType: "sap.m.Label",
            check: function(aLabels) {
              for(var i = 0; i < aLabels.length; i++ ) {
                if(aLabels[i].getText().indexOf(sLabelText)> -1)
                {
                  return true;
                }
              }
            },
            success: function(){
              ok(true, sSuccessMessage);
            },
            errorMessage: sErrorMessage
          });
          
        },
 
        iShouldSeeInputHasValue: function(sInputId, sErrorMessage, sSuccessMessage) {
          return this.waitFor({
            timeout: 60,
            controlType: "sap.m.Input",
            check: function(aInputs) {
              for (var i = 0; i < aInputs.length; i++) {
                if (aInputs[i].getId().indexOf(sInputId) > -1 && aInputs[i].getValue().trim().length > 0) {
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
        iShouldSeeTheApplications: function(sTileTitle, sSuccessMessage, sErrorMessage) {  
          return this.waitFor({ success:ok(true, sSuccessMessage),errorMessage: sErrorMessage}); 
 
        }
      }
  );
}());
