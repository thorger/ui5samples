sap.ui.define([
	"./BaseController",
	"sap/ui/core/UIComponent",
	"nw/epm/refapps/ext/shop/util/TableOperations",
	"nw/epm/refapps/ext/shop/util/ProductListGroupingHelper",
	"sap/ui/core/mvc/ViewType",
	"nw/epm/refapps/ext/shop/model/messages",
	"sap/m/MessageToast",
	"sap/m/TablePersoController",
	"./utilities",
	"sap/m/GroupHeaderListItem",
	"sap/ui/model/Sorter",
	"nw/epm/refapps/ext/shop/model/formatter"
], function(BaseController, UIComponent, TableOperations, ProductListGroupingHelper, ViewType, messages, MessageToast,
	TablePersoController, utilities, GroupHeaderListItem, Sorter, formatter) {

	"use strict";
	var _sIdentity = "nw.epm.refapps.ext.shop";

	return BaseController.extend("nw.epm.refapps.ext.shop.controller.S2_ProductList", {

		formatter: formatter,

		onInit: function() {
			//this._sIdentity = "nw.epm.refapps.ext.shop";
			this._oView = this.getView();
			this._oResourceBundle = this.getResourceBundle();
			this._oRouter = this.getOwnerComponent().getRouter();
			// Use 'local' event bus of component for communication between views
			this._oEventBus = this.getOwnerComponent().getEventBus();

			var oViewModel = new sap.ui.model.json.JSONModel({
				personalizationActive: false,
				catalogTitle: this._oResourceBundle.getText("xtit.products"),
				tableBusyDelay: 0
			});

			this._oCatalog = this.byId("catalogTable");

			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.

			var iOriginalBusyDelay = this._oCatalog.getBusyIndicatorDelay();

			this.setModel(oViewModel, "productListView");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			this._oCatalog.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});

			this._oHeaderButton = this.byId("btnProductListHeader");

			// Prepare the personalization service for the product table
			this._oTablePersoController = null;
			this._initPersonalization();

			// Sorting and grouping on the product table follows a certain logic, which is outsourced to a helper class 1.
			// Selecting a sorter on the table adds the new sorter as the main sorter to all existing sorters 2. If grouping
			// and sorting are both set for the same attribute then the direction (ascending/descending) has to be aligned
			// The actual updating of the List Binding is done by the call back method which is handed over to the
			// constructor.
			//var that = this;
			this._oTableOperations = new TableOperations(this._oCatalog, ["Name", "Id", "Description"]);

			this._oGrouping = new ProductListGroupingHelper(this._oTableOperations, this._oView);

			// add smart filter bar sub view to page
			if (!sap.ui.Device.system.phone) {
				this.byId("productListPage").insertContent(this._initSFBSubView(), 0);
			}
		},

		createGroupHeader: function(oGroup) {
			return new GroupHeaderListItem({
				title: oGroup.text,
				upperCase: false
			});
		},

		// The list title displays the number of list items. Therefore the number has to be updated each
		// time the list changes. Note: the list binding returns the number of items matching the current filter criteria
		// even if the growing list does not yet show all of them. This method is also used by the smart filter bar subview.
		onUpdateFinished: function(oEvent) {

			// on phones the list title is not shown -> nothing needs to be done
			if (sap.ui.Device.system.phone) {
				return;
			}

			var iItemCount = oEvent.getParameter("total");
			this.getModel("productListView").setProperty("/catalogTitle",
				iItemCount ?
				this._oResourceBundle.getText("xtit.productsAndCount", [iItemCount]) :
				this._oResourceBundle.getText("xtit.products"));
		},

		// --- Shopping Cart Handling
		onShoppingCartPressed: function() {
			this._oRouter.navTo("ShoppingCart", {}, false);
		},
		// This handler function is called when adding a new item to the shopping cart was unsuccessful
		onCartSrvError: function(oResponse) {
			messages.showErrorMessage(oResponse, this._oResourceBundle.getText("xtit.errorTitle"));
		},

		// This handler function is called when a new item was successfully added to the shopping cart. The components
		// event bus is used to notify the other screens (S3_ProductDetails, S4_ShoppingCart, S5_CheckOut) so that they can
		// read the new item's data from the back end.
		onCartSrvSuccess: function(oEvent) {
			var oModel = this.getOwnerComponent().getModel();
			var sKey = oModel.createKey("/Products", {
				Id: oEvent.ProductId
			});
			var sProductName = oModel.getProperty(sKey).Name;
			MessageToast.show(this._oResourceBundle.getText("ymsg.addProduct", [sProductName]));
			this._oEventBus.publish(_sIdentity, "shoppingCartRefresh");
			this._oHeaderButton.getElementBinding().refresh();
		},

		// --- List Handling

		// When an item is added to the shopping cart, this method triggers the service call to the back end.
		// Using a function import, the back end then creates a shopping cart if none exists yet, or
		// adds a new shopping cart item to an existing cart, or updates an existing item if the added
		// product is already in the shopping cart
		onAddToCartPressed: function(oEvent) {
			this.getOwnerComponent().getModel().callFunction("/AddProductToShoppingCart", {
				method: "POST",
				urlParameters: {
					ProductId: oEvent.getSource().getBindingContext().getObject().Id
				},
				success: (this.onCartSrvSuccess.bind(this)),
				error: (this.onCartSrvError.bind(this))
			});
		},

		// Handler method for the table search. The actual coding doing the search is outsourced to the reuse library
		// class TableOperations. The search string and the currently active filters and sorters are used to
		// rebind the product list items there. Why rebind instead of update the binding? -> see comments in the helper
		// class
		onSearchPressed: function(oEvent) {
			var sSearch = oEvent.getParameter("query");
			this._oTableOperations.setSearchTerm(sSearch);
			this._oTableOperations.applyTableOperations();
		},

		onGroupPressed: function() {
			this._oGrouping.openGroupingDialog();
		},

		onSortPressed: function() {
			if (!this._oSortDialog) {
				this._oSortDialog = this._createDialog("nw.epm.refapps.ext.shop.view.fragment.ProductSortDialog");
			}
			this._oSortDialog.open();
		},

		// Handler for the Confirm button of the sort dialog. Depending on the selections made on the sort
		// dialog, the respective sorters are created and stored in the _oTableOperations object.
		// The actual setting of the sorters on the binding is done by the callback method that is handed over to
		// the constructor of the _oTableOperations object.
		onSortDialogConfirmed: function(oEvent) {
			var mParams = oEvent.getParameters(),
				sSortPath = mParams.sortItem.getKey();
			this._oTableOperations.addSorter(new Sorter(sSortPath, mParams.sortDescending));
			this._oTableOperations.applyTableOperations();
		},

		// --- Personalization
		onPersonalizationPressed: function() {
			this._oTablePersoController.openDialog();
		},

		// --- Navigation
		// this handler function is called when a line of the product list is clicked. A navigation to the ProductDetail
		// view is started
		onLineItemPressed: function(oEvent) {
			this._oRouter.navTo("ProductDetails", {
				productId: encodeURIComponent(oEvent.getSource().getBindingContext().getProperty("Id"))
			}, false);
		},

		onNavBack: function() {
			var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "#"
					}
				});
			}
		},

		// The personalization service for the product list is created here. It is used to store the following user
		// settings: Visible columns, order of columns
		// The stored settings are applied automatically the next time the app starts.
		_initPersonalization: function() {
			if (sap.ushell.Container) {
				var oPersonalizationService = sap.ushell.Container.getService("Personalization");
				var oPersonalizer = oPersonalizationService.getPersonalizer({
					container: "nw.epm.refapps.ext.shop", // This key must be globally unique (use a key to
					// identify the app) Note that only 40 characters are allowed
					item: "shopProductTable" // Maximum of 40 characters applies to this key as well
				});
				this._oTablePersoController = new TablePersoController({
					table: this._oCatalog,
					componentName: "table",
					persoService: oPersonalizer
				}).activate();
			}
			this.getModel("productListView").setProperty("/personalizationActive", !!sap.ushell.Container);
		},

		// This method creates dialogs from the fragment name
		_createDialog: function(sDialog) {
			var oDialog = sap.ui.xmlfragment(sDialog, this);
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this._oView, oDialog);
			utilities.attachControl(this._oView, oDialog);
			return oDialog;
		},

		// Creates and initializes the subview containing the SmartFilterBar, which is located above the product table. The
		// SmartFilterBar control was moved to a subview to keep the size of the main view controller small
		_initSFBSubView: function() {
			var oViewDefinition = {
				viewName: "nw.epm.refapps.ext.shop.view.subview.S2_SmartFilterBar",
				type: ViewType.XML,
				viewData: {
					oCatalog: this._oCatalog,
					oTableOperations: this._oTableOperations,
					parentController: this
				}
			};
			return sap.ui.view(oViewDefinition);
		}
	});
});