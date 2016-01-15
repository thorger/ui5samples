(function() {
  "use strict";

  jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
  jQuery.sap.require("sap.ui.core.routing.Router");
  jQuery.sap.declare("sap.ui.ipw.ViewApp.MyRouter");

  sap.ui.core.routing.Router.extend("sap.ui.ipw.ViewApp.MyRouter", {

    constructor: function() {
      sap.ui.core.routing.Router.apply(this, arguments);
      this._oRouteMatchedHandler = new sap.m.routing.RouteMatchedHandler(this);
    },

    myNavBack: function(sRoute, mData) {
      var oHistory = sap.ui.core.routing.History.getInstance();
      var sPreviousHash = oHistory.getPreviousHash();

      // The history contains a previous entry
      if (sPreviousHash !== undefined) {
        window.history.go(-1);
      } else {
        var bReplace = true; // otherwise we go backwards with a forward history
        this.navTo(sRoute, mData, bReplace);
      }
    },

    navTo: function(sName, oParameters, bReplace) {
      if (bReplace) {
        this.oHashChanger.replaceHash(this.getURL(sName, oParameters));
      } else {
        this.oHashChanger.setHash(this.getURL(sName, oParameters));
      }
    },

    /**
     * @public Changes the view without changing the hash
     * 
     * @param oOptions
     *          {object} must have the following properties
     *          <ul>
     *          <li> currentView : the view you start the navigation from.</li>
     *          <li> targetViewName : the fully qualified name of the view you want to navigate to.</li>
     *          <li> targetViewType : the viewtype eg: XML</li>
     *          <li> isMaster : default is false, true if the view should be put in the master</li>
     *          <li> transition : default is "show", the navigation transition</li>
     *          <li> data : the data passed to the navContainers livecycle events</li>
     *          </ul>
     */
    myNavToWithoutHash: function(oOptions) {
      var oApp = this._findApp(oOptions.currentView);

      // Load view, add it to the page aggregation, and navigate to it
      var oView = this.getView(oOptions.targetViewName, oOptions.targetViewType);
      oApp.addPage(oView, oOptions.isMaster);
      oApp.to(oView.getId(), oOptions.transition || "show", oOptions.data);
    },

    backWithoutHash: function(oCurrentView, bIsMaster) {
      var sBackMethod = bIsMaster ? "backMaster" : "backDetail";
      this._findApp(oCurrentView)[sBackMethod]();
    },

    destroy: function() {
      sap.ui.core.routing.Router.prototype.destroy.apply(this, arguments);
      this._oRouteMatchedHandler.destroy();
    },

    _findApp: function(oControl) {
      var sAncestorControlName = "idAppControl";

      if (oControl instanceof sap.ui.core.mvc.View && oControl.byId(sAncestorControlName)) {
        return oControl.byId(sAncestorControlName);
      }

      return oControl.getParent() ? this._findApp(oControl.getParent(), sAncestorControlName) : null;
    }
    
  });
})();
