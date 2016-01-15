sap.ui.define([
	"./BaseController",
	"./utilities",
	"nw/epm/refapps/ext/shop/model/messages",
	"nw/epm/refapps/ext/shop/model/formatter"
], function(BaseController, utilities, messages, formatter) {
	"use strict";

	return BaseController.extend("nw.epm.refapps.ext.shop.controller.S4_ShoppingCart", {

		formatter: formatter,

		onInit: function() {
			this._oView = this.getView();
			this._oDataModel = this.getOwnerComponent().getModel();
			this._oEventBus = this.getOwnerComponent().getEventBus();
			this._oShoppingCartTable = this.byId("shoppingCartTable");
			this._oTotalFooter = this.byId("totalFooter");
			this._oResourceBundle = this.getResourceBundle();
			this._oRouter = this.getOwnerComponent().getRouter();
			this._sIdentity = "nw.epm.refapps.ext.shop";
			this._oHeaderButton = this.byId("btnShoppingCartHeader").setType(sap.m.ButtonType.Emphasized);
			this._bRefreshAfterChange = false;

			// Subscribe to event that is triggered by other screens when the ShoppingCart was changed
			this._oEventBus.subscribe(this._sIdentity, "shoppingCartRefresh", (this.onShoppingCartChanged.bind(this)));
		},

		onBeforeRendering: function() {
			// element binding for the counter on the shopping cart button
			this._oView.bindElement({
				path: "/ShoppingCarts(-1)",
				batchGroupId: "shoppingCart",
				parameters: {
					select: "TotalQuantity"
				}
			});

			// Do the binding of the totals in the footer of the ShoppingCart table
			this._oTotalFooter.bindElement({
				path: "/ShoppingCarts(-1)",
				batchGroupId: "shoppingCart",
				parameters: {
					select: "Total,CurrencyCode"
				}
			});
		},

		// Disable the checkout button if there is invalid user input or the ShoppingCart is empty
		onUpdateFinished: function() {
			var iItemCount = this._oShoppingCartTable.getItems().length,
				bEnabled = !this._hasInvalidQuantityValues() && iItemCount > 0;
			this.byId("btnCheckOut").setEnabled(bEnabled);
			this.byId("totalFooter").setVisible(iItemCount !== 0);
		},

		// Navigate back to the previous screen
		// This function is only necessary to suppress navigation due to invalid user input
		onBack: function() {
			if (!this._hasInvalidQuantityValues()) {
				history.go(-1);
			}
		},

		// Navigate to the product details of the selected ShoppingCartItem
		// If the screen contains invalid user input, the navigation is suppressed
		onLineItemPressed: function(oEvent) {
			if (this._hasInvalidQuantityValues()) {
				return;
			}
			this._oRouter.navTo("ProductDetails", {
				productId: encodeURIComponent(oEvent.getSource().getBindingContext().getProperty("ProductId"))
			}, false);
		},

		// Navigate to the checkout screen
		onCheckoutButtonPressed: function() {
			this._oRouter.navTo("CheckOut", {}, false);
		},

		// Change quantity for the selected ShoppingCartItem
		onQuantityChanged: function(oEvent) {
			var oInputField = oEvent.getSource(),
				oData = {};
			oData.Quantity = parseFloat(oEvent.getParameter("newValue"), 10);

			// Display an error message if the quantity is not a positive whole number
			if (isNaN(oData.Quantity) || oData.Quantity % 1 !== 0 || oData.Quantity < 0) {
				oInputField.setValueState("Error");
				this.byId("btnCheckOut").setEnabled(false);
				this._bRefreshAfterChange = true;
				return;
			}

			// Delete the ShoppingCartItem if the quantity is 0
			if (oData.Quantity === 0) {
				// Reset the quantity change, because this change will never be submitted otherwise the newly added item has in some cases quantity 0
				this._oDataModel.resetChanges();
				this._deleteShoppingCartItem(oInputField.getParent());
				return;
			}
			if (this._bRefreshAfterChange) {
				this._oDataModel.setRefreshAfterChange(true);
				this._bRefreshAfterChange = false;
			}

			// Handler for successful update
			var fnOnQuantityUpdated = function() {
				oInputField.setValueState(); // reset error value state
				this._refreshTotals();
			};

			this._oDataModel.submitChanges({
				success: (fnOnQuantityUpdated.bind(this)),
				error: (this.onErrorOccurred.bind(this)),
				batchGroupId: "shoppingCart"
			});
		},

		// Delete selected Shopping Cart Item
		onDeletePressed: function(oEvent) {
			this._deleteShoppingCartItem(oEvent.getParameter("listItem"));
		},

		_deleteShoppingCartItem: function(oShoppingCartItem) {
			// Handler for successful deletion
			var fnOnItemDeleted = function() {
				this._refreshTotals();
			};

			this._oDataModel.remove(oShoppingCartItem.getBindingContext().getPath(), {
				success: (fnOnItemDeleted.bind(this)),
				error: (this.onErrorOccurred.bind(this))
			});
		},

		onErrorOccurred: function(oResponse) {
			messages.showErrorMessage(oResponse, this._oResourceBundle.getText("xtit.errorTitle"));
		},

		onShoppingCartChanged: function() {
			// Refresh table content inclusive table footer
			this._oShoppingCartTable.getBinding("items").refresh();
			this._oTotalFooter.getElementBinding().refresh();
		},

		_refreshTotals: function() {
			// Refresh the total values in the table footer and on the shopping cart header button
			this._oHeaderButton.getElementBinding().refresh();
			this._oTotalFooter.getElementBinding().refresh();
		},

		_hasInvalidQuantityValues: function() {
			var iQuantityColumnIndex = this._oShoppingCartTable.indexOfColumn(this.byId("quantityColumn"));
			if (iQuantityColumnIndex === -1) {
				return false;
			}
			var i, aItems = this._oShoppingCartTable.getItems();
			for (i = 0; i < aItems.length; i++) {
				if (aItems[i].getCells()[iQuantityColumnIndex].getValueState() === "Error") {
					return true;
				}
			}
			return false;
		},

		// This method creates dialogs from the fragment name
		_createDialog: function(sDialog) {
			var oDialog = sap.ui.xmlfragment(sDialog, this);
			utilities.attachControl(this._oView, oDialog);
			return oDialog;
		}
	});
});