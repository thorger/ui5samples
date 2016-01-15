sap.ui.define([
	"./BaseController",
	"sap/ui/model/Sorter",
	"nw/epm/refapps/ext/shop/model/messages",
	"sap/m/MessageToast",
	"./utilities",
	"sap/ui/model/json/JSONModel",
	"nw/epm/refapps/ext/shop/model/formatter",
	"sap/ui/model/type/Date",
	"sap/ui/model/type/Float"
], function(BaseController, Sorter, messages, MessageToast, utilities, JSONModel, formatter) {
	"use strict";

	return BaseController.extend("nw.epm.refapps.ext.shop.controller.S3_ProductDetails", {

		formatter: formatter,

		onInit: function() {
			// Use 'local' event bus of component for communication between views
			this._oView = this.getView();
			this._oEventBus = this.getOwnerComponent().getEventBus();
			this._oResourceBundle = this.getResourceBundle();
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oReviewTable = this.byId("reviewTable");
			this._bIsEditReview = false;
			this._bIsReviewDialogOpen = false;
			this._bIsReviewRatingFragmentOpened = false;
			this._oSortDialog = null;
			this._oReviewDialog = null;
			this._oLargeImage = null;
			this._oPopover = null;
			this._sProductPath = "";
			this._sProductId = "";
			this._sReviewPath = "";
			this._sIdentity = "nw.epm.refapps.ext.shop";
			this._bSetFocus = false;

			// Store original busy indicator delay, so it can be restored later on
			var iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			var oViewModel = new JSONModel({
				busy: true,
				delay: 0
			});
			this.setModel(oViewModel, "detailView");
			this.getOwnerComponent().oWhenMetadataIsLoaded.then(function() {
				// Restore original busy indicator delay for the object view
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

			// Get Context Path for S3 Screen
			this._oRouter.attachRoutePatternMatched(this._onRoutePatternMatched, this);

		},

		_onRoutePatternMatched: function(oEvent) {

			var oViewModel = this.getModel("detailView");

			if (oEvent.getParameter("name") !== "ProductDetails") {
				return;
			}
			// Build binding context path from URL parameters: the URL contains the product ID in parameter 'productId'.
			// The path pattern is: /Products('<productId>')
			this._sProductId = decodeURIComponent(oEvent.getParameter("arguments").productId);
			this._sProductPath = "/Products('" + this._sProductId + "')";
			this._sReviewPath = this._sProductPath + "/Reviews";

			this._bIsEditReview = false;

			var sSelectParameters = "Name,Price,CurrencyCode,ImageUrl,IsFavoriteOfCurrentUser,StockQuantity,";
			sSelectParameters += "MainCategoryName,SubCategoryName,Id,Description,SupplierName,AverageRating,";
			sSelectParameters += "RatingCount,QuantityUnit,DimensionDepth,DimensionUnit,DimensionWidth,";
			sSelectParameters += "DimensionHeight,WeightMeasure,WeightUnit,HasReviewOfCurrentUser,LastModified";

			// Bind Object Header and Form using oData
			this.getView().bindElement({
				path: this._sProductPath,
				batchGroupId: "reviews",
				parameters: {
					select: sSelectParameters
				},
				events: {
					dataRequested: function() {
						this.getOwnerComponent().oWhenMetadataIsLoaded.then(function() {
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					}.bind(this),
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					},
					change: function() {
						var oProduct = this.getView().getBindingContext().getObject(),
							sProductName = oProduct.Name;

						//Navigation to Empty Page if the the product does not exist
						if (this.getView().getBindingContext().getPath() !== this._sProductPath) {
							this._oRouter.navTo("EmptyPage", {}, false);
						}
						oViewModel.setProperty("/busy", false);
						oViewModel.setProperty("/saveAsTileTitle", this.getResourceBundle().getText("xtit.saveAsTile", [sProductName]));
					}.bind(this)
				}
			});

			//Bind review data directly to review table
			//A workaround for the missing sort functionality on OData expand
			this.byId("reviewTable").bindItems({
				path: this._sProductPath + "/Reviews",
				events: {
					change: function() {
						if (this._bSetFocus) {
							this._oReviewTable.focus();
							this._bSetFocus = false;
						}
					}.bind(this)
				},
				batchGroupId: "reviews",
				template: this.byId("reviewListItem"),
				sorter: new Sorter("ChangedAt", true)
			});

			this._bIsReviewRatingFragmentOpened = false;
		},

		// --- Actions in Header Bar
		onShoppingCartPressed: function() {
			this._oRouter.navTo("ShoppingCart", {}, false);
		},

		// --- Actions in Object Header
		// Enlarge the image in a separate dialog box
		onImagePressed: function() {
			if (!this._oLargeImage) {
				// associate controller with the fragment
				this._oLargeImage = this._createDialog("nw.epm.refapps.ext.shop.view.fragment.ProductImage");
			}
			this._oLargeImage.open();
		},

		// Close the dialog box for the enlarged image
		onImageOKPressed: function() {
			this._oLargeImage.close();
		},

		// --- Actions in Form
		// Connect Supplier Card Quick View

		onSupplierPressed: function(oEvent) {
			var oLink = oEvent.getSource();
			if (!this._oSupplierCard) {
				this._initializeSupplierCard();
			}
			this._oSupplierCard.openBy(oLink);
		},

		_initializeSupplierCard: function() {
			this._oSupplierCard = sap.ui.xmlfragment("nw.epm.refapps.ext.shop.view.fragment.SupplierCard");
			this._oSupplierCard.bindElement({
				path: "Supplier"
			});
			utilities.attachControl(this.getView(), this._oSupplierCard);
		},
		// create Review Rating dialog box
		onRatingPressed: function(oEvent) {
			if (!this._oPopover) {
				this._oPopover = sap.ui.xmlfragment("reviewRatingFragment",
					"nw.epm.refapps.ext.shop.view.fragment.ReviewRating", this);
			}
			// Bind Rating dialog box with oData Entity ReviewAggregates
			if (!this._bIsReviewRatingFragmentOpened) {
				utilities.attachControl(this._oView, this._oPopover);
				var oList = sap.ui.core.Fragment.byId("reviewRatingFragment", "reviewRatingList");
				oList.bindAggregation("content", {
					path: this._sProductPath + "/ReviewAggregates",
					template: oList.getContent()[0].clone()
				});
			}
			// Delay because addDependent will perform asynchronous rendering again and the actionSheet will immediately
			// close without it.
			var oOpeningControl = oEvent.getParameter("source");
			jQuery.sap.delayedCall(0, this, function() {
				this._oPopover.openBy(oOpeningControl);
			});
			this._oPopover.addStyleClass("sapUiPopupWithPadding");
			if (sap.ui.Device.system.phone) {
				// Open the dialog box depending on the space above or below the rating control
				var oRatingCount = this.getView().byId("ratingCount"),
					position = oRatingCount.$().offset();

				if ($(window).innerHeight() - position.top < position.top) {
					this._oPopover.setPlacement("Top");
				} else {
					this._oPopover.setPlacement("Bottom");
				}
			}
			this._bIsReviewRatingFragmentOpened = true;
		},

		// --- Actions on Table entries
		// View Settings Dialog / Sort Rating
		onTableSettingsPressed: function() {
			if (!this._oSortDialog) {
				this._oSortDialog = this._createDialog("nw.epm.refapps.ext.shop.view.fragment.SettingsDialog");
			}
			this._oSortDialog.open();
		},

		onSortConfirmed: function(oEvent) {
			// apply sorter to binding
			var aSorters = [];
			var mParams = oEvent.getParameters();
			aSorters.push(new Sorter(mParams.sortItem.getKey(), mParams.sortDescending));
			this._oReviewTable.getBinding("items").sort(aSorters);
		},

		// --- Actions on buttons in footer bar
		// When an item is added to the ShoppingCart, this method triggers the service call to the back end.
		// Using a function import, the back end then creates a ShoppingCart if none exists yet, or
		// adds a new ShoppingCartItem to an existing cart, or updates an existing item if the added
		// product is already in the ShoppingCart
		onAddToCartPressed: function(oEvent) {
			oEvent.getSource().getModel().callFunction("/AddProductToShoppingCart", {
				method: "POST",
				urlParameters: {
					ProductId: oEvent.getSource().getBindingContext().getProperty("Id")
				},
				success: (this.onCartSrvSuccess.bind(this)),
				error: (this.onSrvError.bind(this))
			});
		},

		// When the button is pressed, the opposite value (to that retrieved last time) is passed to the back end. MERGE is
		// used to send only the changed value to the back end and not all product data
		onToggleFavoritePressed: function() {
			var oBindingContext = this.getView().getBindingContext();
			this.byId("pd_header").setMarkFavorite(!(oBindingContext.getProperty("IsFavoriteOfCurrentUser")));
		},

		_initializeReviewDialog: function() {
			this._oReviewDialog = sap.ui.xmlfragment("nw.epm.refapps.ext.shop.view.fragment.ReviewDialog", this);
			// Set the focus on the text area
			this._oReviewDialog.setInitialFocus("textArea");
			utilities.attachControl(this._oView, this._oReviewDialog);
		},

		// Button to open the review dialog. If the logged-on user does not have his or her own review, the dialog is opened
		// with initial values, otherwise the URL of the user's own review is determined in the list of reviews and bound to
		// the elements of the dialog to open the dialog with the values of the review. In addition, the visibility of the
		// recycle bin is triggered depending on whether or not the logged-on user has his or her own review.
		onEditReviewPressed: function(oEvent) {
			if (!this._oReviewDialog) {
				this._initializeReviewDialog();
			}
			this._oReviewDialog.unbindObject();

			var oModel = oEvent.getSource().getModel();
			oModel.setRefreshAfterChange(false);

			sap.ui.getCore().byId("btnOK", "reviewDialog").setEnabled(false);

			this._bIsReviewDialogOpen = true;
			var bHasOwnReview = false,
				oBTNDelete = sap.ui.getCore().byId("reviewDelete", "reviewDialog");
			oBTNDelete.setVisible(bHasOwnReview);

			// Determine the review URL and bind values to the elements
			var i = 0;
			for (i = 0; i < this._oReviewTable.getItems().length; i++) {
				if (this._oReviewTable.getItems()[i].getBindingContext().getProperty("IsReviewOfCurrentUser")) {
					this._bIsEditReview = true;
					this._oReviewDialog.setBindingContext(this._oReviewTable.getItems()[i].getBindingContext());
					bHasOwnReview = true;
					oBTNDelete.setVisible(bHasOwnReview);
					break;
				}
			}
			// Open dialog empty if the logged-on user does not have his or her own review
			if (!bHasOwnReview) {
				//  this._oReviewDialog.setBindingContext("null");
				var oNewReview = oModel.createEntry("/Reviews", {
					batchGroupId: "reviews"
				});
				oModel.setProperty("ProductId", this._sProductId, oNewReview);
				this._oReviewDialog.setBindingContext(oNewReview);
			}
			this._oReviewDialog.open();
		},

		// --- Actions on links for a review item
		// Link "Rate as Helpful" is pressed
		onRateAsHelpfulPressed: function(oEvent) {
			var sPath = oEvent.getSource().getBindingContext().getPath() + "/HelpfulForCurrentUser",
				oModel = this.getModel();

			oModel.setProperty(sPath, true);
			oModel.submitChanges({
				error: (this.onSrvError.bind(this))
			});
			this._bSetFocus = true;
		},

		// Open Review dialog box if "Edit" link is pressed and fill with Review data
		onEditReviewLinkPressed: function(oEvent) {
			if (!this._oReviewDialog) {
				this._initializeReviewDialog();
			}
			sap.ui.getCore().byId("btnOK", "reviewDialog").setEnabled(false); // disable OK button on review dialog
			sap.ui.getCore().byId("reviewDelete", "reviewDialog").setVisible(true); // show delete button on review dialog
			this._oReviewDialog.bindElement(oEvent.getSource().getBindingContext().getPath());
			this._bIsEditReview = true;
			this._bIsReviewDialogOpen = true;
			this._oReviewDialog.open();
		},

		// Delete Review if "Delete" link is pressed
		onDeleteReviewLinkPressed: function(oEvent) {
			oEvent.getSource().getModel().remove(oEvent.getSource().getBindingContext().getPath(), {
				success: (this.onReviewDeleteSrvSuccess.bind(this)),
				error: (this.onSrvError.bind(this))
			});
			this._bIsEditReview = false;

			this.byId("btnReview").setText(this._oResourceBundle.getText("xbut.writeReview"));
		},

		// --- Actions on buttons on the review dialog
		onReviewDialogOKPressed: function(oEvent) {
			oEvent.getSource().getModel().setRefreshAfterChange(true);
			this._oReviewDialog.close();

			oEvent.getSource().getModel().submitChanges({
				success: (this.onReviewSrvSuccess.bind(this)),
				error: (this.onSrvError.bind(this)),
				batchGroupId: "reviews"
			});
			this.byId("btnReview").setText(this._oResourceBundle.getText("xbut.myReview"));
		},

		// Close the Review Dialog
		onReviewDialogCancelPressed: function() {
			this.getModel().resetChanges();
			this.getModel().setRefreshAfterChange(true);
			this._oReviewDialog.unbindObject();
			this._oReviewDialog.close();
		},

		onReviewDialogDeletePressed: function(oEvent) {
			var sDeleteReviewPath = oEvent.getSource().getBindingContext().getPath();
			if (this._bIsReviewDialogOpen) {
				this._oReviewDialog.close();
				this._bIsReviewDialogOpen = false;
			}
			this._oReviewDialog.unbindContext();
			oEvent.getSource().getModel().remove(sDeleteReviewPath, {
				success: (this.onReviewDeleteSrvSuccess.bind(this)),
				error: (this.onSrvError.bind(this))
			});
			this._bIsEditReview = false;
			this.byId("btnReview").setText(this._oResourceBundle.getText("xbut.writeReview"));
		},

		// Enable OK button if Rating and Comment is filled
		onTextAreaChanged: function() {
			sap.ui.getCore().byId("btnOK", "reviewDialog").setEnabled(false);
			var iRatingCount = sap.ui.getCore().byId("ratingIndicator", "reviewDialog").getValue();
			var sReviewComment = sap.ui.getCore().byId("textArea", "reviewDialog").getValue();
			if (iRatingCount > 0 && sReviewComment) {
				sap.ui.getCore().byId("btnOK", "reviewDialog").setEnabled(true);
			}
		},

		// Enable OK button if Rating and Comment is filled
		onRatingChanged: function() {
			sap.ui.getCore().byId("btnOK", "reviewDialog").setEnabled(false);
			var iRatingCount = sap.ui.getCore().byId("ratingIndicator", "reviewDialog").getValue();
			var sReviewComment = sap.ui.getCore().byId("textArea", "reviewDialog").getValue();
			if (iRatingCount > 0 && sReviewComment) {
				sap.ui.getCore().byId("btnOK", "reviewDialog").setEnabled(true);
			}
		},

		// --- oData Service callback functions
		onCartSrvSuccess: function(oEvent) {
			var sKey = this.getOwnerComponent().getModel().createKey("/Products", {
				Id: oEvent.ProductId
			});
			var sProductName = this.getOwnerComponent().getModel().getProperty(sKey).Name;
			MessageToast.show(this._oResourceBundle.getText("ymsg.addProduct", [sProductName]));
			this._oEventBus.publish(this._sIdentity, "shoppingCartRefresh");
			this.byId("btnProductHeader").getElementBinding().refresh();
		},

		// Callback if creation or editing of a review was successful
		onReviewSrvSuccess: function() {
			// Initialize the review dialog
			this._oReviewDialog.unbindObject();
			this.getModel().refresh();
			this._bSetFocus = true;
		},

		// Callback if deletion of a review was successful
		onReviewDeleteSrvSuccess: function() {
			if (this._oReviewDialog) {
				// Remove the BindingContext, otherwise the Binding will be refreshed with an invalid path
				this._oReviewDialog.unbindObject();
			}
			this.getModel().refresh();
			this._bSetFocus = true;
		},

		// Callback in the event of errors
		onSrvError: function(oResponse) {
			messages.showErrorMessage(oResponse, this._oResourceBundle.getText("xtit.errorTitle"));
		},

		// This method creates dialogs from the fragment name
		_createDialog: function(sDialog) {
			var oDialog = sap.ui.xmlfragment(sDialog, this);
			utilities.attachControl(this._oView, oDialog);
			return oDialog;
		}
	});
});