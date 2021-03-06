(function() {
  "use strict";
  jQuery.sap.declare("sap.ui.ipw.ViewApp.Component");
  jQuery.sap.require("sap.ui.ipw.ViewApp.MyRouter");
  jQuery.sap.require("sap.ui.core.util.MockServer");
  jQuery.sap.require("sap.ui.ipw.ViewApp.model.Config");

  sap.ui.core.UIComponent.extend("sap.ui.ipw.ViewApp.Component", {

    metadata: {
      name: "IPW View App",
      version: "1.0",
      includes: [],
      dependencies: {
        libs: ["sap.m", "sap.ui.layout"],
        components: []
      },
      rootView: "sap.ui.ipw.ViewApp.view.App",

      config: {
        fullWidth: true,
        resourceBundle: "i18n/messageBundle.properties",
        serviceConfig: {
          name: sap.ui.ipw.ViewApp.model.Config.serviceName,
          serviceUrl: sap.ui.ipw.ViewApp.model.Config.serviceUrl
        }
      },

      routing: {
        config: {
          routerClass: sap.ui.ipw.ViewApp.MyRouter,
          viewType: "XML",
          viewPath: "sap.ui.ipw.ViewApp.view",
          targetAggregation: "pages",
          clearTarget: false
        },
        routes: [{
          pattern: "",
          name: "app",
          view: "App",
          targetAggregation: "pages",
          targetControl: "idAppControl"
        }, {
          pattern: "Login",
          name: "login",
          view: "Login",
          targetAggregation: "pages",
          targetControl: "idAppControl"
        }, {
          name: "catchallMaster",
          view: "Master",
          targetAggregation: "pages",
          targetControl: "idAppControl",
          subroutes: [{
            pattern: ":all*:",
            name: "catchallDetail",
            view: "NotFound"
          }]
        }]
      }
    },

    init: function() {

      sap.ui.core.UIComponent.prototype.init.apply(this, arguments);

      var mConfig = this.getMetadata().getConfig();

      // always use absolute paths relative to our own component
      // (relative paths will fail if running in the Fiori Launchpad)
      var rootPath = jQuery.sap.getModulePath("sap.ui.ipw.ViewApp");

      // set i18n model
      var i18nModel = new sap.ui.model.resource.ResourceModel({
        bundleUrl: [rootPath, mConfig.resourceBundle].join("/")
      });
      this.setModel(i18nModel, "i18n");

      // Create and set domain model to the component
      var sServiceUrl = mConfig.serviceConfig.serviceUrl;

      var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
      this.setModel(oModel);

      // set device model
      var deviceModel = new sap.ui.model.json.JSONModel({
        isTouch: sap.ui.Device.support.touch,
        isNoTouch: !sap.ui.Device.support.touch,
        isPhone: sap.ui.Device.system.phone,
        isNoPhone: !sap.ui.Device.system.phone,
        listMode: sap.ui.Device.system.phone ? "None" : "SingleSelectMaster",
            listItemType: sap.ui.Device.system.phone ? "Active" : "Inactive"
      });
      deviceModel.setDefaultBindingMode("OneWay");
      this.setModel(deviceModel, "device");

      this.getRouter().initialize();

    }

  });
}());
