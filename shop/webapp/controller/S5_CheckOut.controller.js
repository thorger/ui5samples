sap.ui.define([
	"./BaseController",
	"nw/epm/refapps/ext/shop/model/messages",
	"sap/m/MessageToast",
	"nw/epm/refapps/ext/shop/model/formatter"
], function(BaseController, messages, MessageToast, formatter) {

	return BaseController.extend("nw.epm.refapps.ext.shop.controller.S5_CheckOut", {

		formatter: formatter,

		onInit: function() {
			this._oView = this.getView();
			this._oResourceBundle = this.getResourceBundle();
			this._oRouter = this.getOwnerComponent().getRouter();
			// Use 'local' event bus of component for communication between views
			this._oEventBus = this.getOwnerComponent().getEventBus();
			this._oCheckOutTable = this.byId("checkOutTable");
			this._fnRefreshBinding = (this.refreshBinding.bind(this));
			this._sIdentity = "nw.epm.refapps.ext.shop";

			// element binding for the counter on the shopping cart button
			this._oView.bindElement({
				path: "/ShoppingCarts(-1)",
				batchGroupId: "checkOut",
				parameters: {
					select: "FormattedCustomerName,FormattedAddress,Total,CurrencyCode,TotalQuantity"
				}
			});

			// Get Context Path for S5 Screen
			this._oRouter.attachRoutePatternMatched(this._onRoutePatternMatched, this);

			// Trigger a refresh of the shopping cart if the event is raised
			this._oEventBus.subscribe(this._sIdentity, "shoppingCartRefresh", this._fnRefreshBinding);
		},

		onExit: function() {
			this._oEventBus.unsubscribe(this._sIdentity, "shoppingCartRefresh", this._fnRefreshBinding);
		},

		// Check matched Route
		_onRoutePatternMatched: function(oEvent) {
			if (oEvent.getParameter("name") === "CheckOut") {
				this.byId("btnBuyNow").setEnabled(true);
			}
		},

		// Navigate to the shopping cart screen
		onShoppingCartPressed: function() {
			this._oRouter.navTo("ShoppingCart", {}, false);
		},

		// Call a function import to submit the order
		onBuyNowPressed: function(oEvent) {
			// Disable the button so that the user cannot press it a second time
			this.byId("btnBuyNow").setEnabled(false);

			oEvent.getSource().getModel().callFunction("/BuyShoppingCart", {
				method: "POST",
				async: true,
				success: (this.onCartSrvSuccess.bind(this)),
				error: (this.onCartSrvError.bind(this))
			});
		},

		// Refresh the view binding if the ShoppingCart was changed (for example, a new item was added)
		refreshBinding: function() {
			this.byId("btnCheckOutHeader").getElementBinding().refresh();
			this._oCheckOutTable.getBinding("items").refresh();
		},

		// Service Error handling
		onCartSrvError: function(oResponse) {
			messages.showErrorMessage(oResponse, this._oResourceBundle.getText("xtit.errorTitle"));
			this.byId("btnBuyNow").setEnabled(true);
		},

		// Go back to S2 and display a message toast that the shopping cart was ordered successfully
		onCartSrvSuccess: function() {
			this.byId("btnBuyNow").setEnabled(true);
			this._oEventBus.publish(this._sIdentity, "shoppingCartRefresh");
			this._oRouter.navTo("ProductList", {}, false);
			MessageToast.show(this._oResourceBundle.getText("ymsg.checkOut"), {
				closeOnBrowserNavigation: false
			});
		},

		// This method creates dialogs from the fragment name
		_createDialog: function(sDialog) {
			var oDialog = sap.ui.xmlfragment(sDialog, this);
			// switch the dialog to compact mode if the hosting view has compact mode
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this._oView, oDialog);
			this._oView.addDependent(oDialog);
			return oDialog;
		}
	});
});