sap.ui.define([
	"sap/ui/core/util/MockServer"
], function(MockServer) {
	"use strict";

	return {
		/**
		 * Initializes the mock server. You can configure the delay with the URL parameter "serverDelay"
		 * The local mock data in this folder is returned instead of the real data for testing.
		 *
		 * @public
		 */
		init: function() {
			var oUriParameters = jQuery.sap.getUriParameters(),
				oMockServer = new MockServer({
					rootUri: "/sap/opu/odata/sap/EPM_REF_APPS_SHOP_SRV/"
				}),
				sPath = jQuery.sap.getModulePath("nw.epm.refapps.ext.shop.localService"),
				aRequests,
				oRequests;

			// enable 'mock' variant management
			jQuery.sap.require("sap.ui.fl.FakeLrepConnector");
			sap.ui.fl.FakeLrepConnector.enableFakeConnector(sPath + "/mockdata/component-test-changes.json");

			// configure mock server with a delay of 1s
			MockServer.config({
				autoRespond: true,
				autoRespondAfter: (oUriParameters.get("serverDelay") || 0)
			});

			// load local mock data
			oMockServer.simulate(sPath + "/metadata.xml", sPath + "/mockdata");
			aRequests = oMockServer.getRequests();
			// two separate mockRequests handler depending on availability of the attachAfter mechanism.
			if (oMockServer.attachAfter) {
				jQuery.sap.require("nw.epm.refapps.ext.shop.localService.MockRequests");
				oRequests = new nw.epm.refapps.ext.shop.localService.MockRequests(oMockServer);
			} else {
				jQuery.sap.require("nw.epm.refapps.ext.shop.localService.MockRequestsV128");
				oRequests = new nw.epm.refapps.ext.shop.localService.MockRequestsV128(oMockServer);
			}
			aRequests = oMockServer.getRequests();
			oMockServer.setRequests(aRequests.concat(oRequests.getRequests()));
			oMockServer.start();

			jQuery.sap.log.info("Running the app with mock data");
		}
	};
});