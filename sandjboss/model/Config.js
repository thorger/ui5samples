/**
 * 
 */
(function() {
  "use strict";
  jQuery.sap.declare("sap.ui.ipw.ViewApp.model.Config");

  sap.ui.ipw.ViewApp.model.Config = {};

  // the "responder" URL parameter defines if the app shall run with mock data
  var sResponderOn = jQuery.sap.getUriParameters().get("responderOn");
  sap.ui.ipw.ViewApp.model.Config.isMock = (sResponderOn === "true");

  // check local environment, Launchpad works differently than local environment
  sap.ui.ipw.ViewApp.model.Config.isLocal = (window.location.href.indexOf("localhost") > -1);

  // Check sublime or eclipse environment
  sap.ui.ipw.ViewApp.model.Config.isSublime = (sap.ui.ipw.ViewApp.model.Config.isLocal && (window.location.href.indexOf("localhost:8080") === -1));

  //only use full static URL for testing. Use relative URL, if loaded from Launchpad
  var sServiceUrl = "";
  if (sap.ui.ipw.ViewApp.model.Config.isMock) {
    sServiceUrl = "http://mymockserver/";
  } else {
    sServiceUrl = "http://localhost:8080/quo/odata.svc/";
  }
  sap.ui.ipw.ViewApp.model.Config.serviceUrl = sServiceUrl;

  sap.ui.ipw.ViewApp.model.Config.serviceName = "SAP";

})();
