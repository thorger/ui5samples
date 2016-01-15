(function() {
  "use strict";

  jQuery.sap.declare("IPWUILaunchPad.test.arrangement.LaunchPadArrangement");
  jQuery.sap.require("sap.ui.test.Opa5");
  jQuery.sap.require("sap.ui.test.opaQunit");

  IPWUILaunchPad.test.arrangement.LaunchPadArrangement = sap.ui.test.Opa5.extend(
      "IPWUILaunchPad.test.arrangement.LaunchPadArrangement", {
        // Given this screen
         iStartMyAppLogin:function(){
           return this.iStartMyAppInAFrame("http://localhost:8080/ipw-launch-pad/#Login");
         } 
    
     });
}())