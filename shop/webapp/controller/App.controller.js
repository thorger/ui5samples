sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"./utilities"
], function(BaseController, JSONModel, utilities) {
	"use strict";

	return BaseController.extend("nw.epm.refapps.ext.shop.controller.App", {

		onInit: function() {
			var oViewModel,
				fnSetAppNotBusy,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				busy: true,
				delay: 0
			});
			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function() {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			this.getOwnerComponent().oWhenMetadataIsLoaded.
			then(fnSetAppNotBusy, fnSetAppNotBusy);

			// apply content density mode to root view
			this.getView().addStyleClass(utilities.getContentDensityClass());
		}
	});

});