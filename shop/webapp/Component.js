sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/core/mvc/ViewType",
	"./model/models",
	"./model/messages",
	"./controller/utilities"
], function(UIComponent, ViewType, models, messages, utilities) {

	"use strict";

	return UIComponent.extend("nw.epm.refapps.ext.shop.Component", {
		metadata: {
			name: "xtit.shellTitle",
			version: "${project.version}",
			library: "nw.epm.refapps.ext.shop",
			includes: ["css/shopStyles.css"],
			dependencies: {
				"libs": ["sap.m", "sap.me", "sap.ushell", "sap.ui.comp"],
				"components": []
			},
			rootView: "nw.epm.refapps.ext.shop.view.App",
			config: {
				resourceBundle: "i18n/i18n.properties",
				titleResource: "shellTitle",
				icon: "sap-icon://Fiori6/F0866",
				favIcon: "icon/F0866_My_Shops.ico",
				phone: "icon/launchicon/57_iPhone_Desktop_Launch.png",
				"phone@2": "icon/launchicon/114_iPhone-Retina_Web_Clip.png",
				tablet: "icon/launchicon/72_iPad_Desktop_Launch.png",
				"tablet@2": "icon/launchicon/144_iPad_Retina_Web_Clip.png",
				serviceConfig: {
					name: "EPM_REF_APPS_SHOP",
					serviceUrl: "/sap/opu/odata/sap/EPM_REF_APPS_SHOP_SRV/"
				}
			},
			routing: {
				// The default values for routes
				"config": {
					routerClass: "sap.m.routing.Router", // use the router in sap.m library which provides enhanced features
					viewType: "XML",
					viewPath: "nw.epm.refapps.ext.shop.view",
					controlId: "fioriContent", // This is the control in which new views are placed (sap.m.App in
					bypassed: {
						target: "EmptyPage"
					}
				},

				routes: [{
					pattern: "",
					name: "ProductList",
					target: "productList"
				}, {
					pattern: "Product/{productId}",
					name: "ProductDetails",
					target: "productDetails"
				}, {
					pattern: "ShoppingCart",
					name: "ShoppingCart",
					target: "shoppingCart"
				}, {
					pattern: "CheckOut",
					name: "CheckOut",
					target: "checkOut"
				}, {
					pattern: "EmptyPage",
					name: "EmptyPage",
					target: "emptyPage"
				}],
				targets: {
					productList: {
						viewName: "S2_ProductList",
						viewLevel: 1,
						controlAggregation: "pages"
					},
					productDetails: {
						viewName: "S3_ProductDetails",
						viewLevel: 1,
						controlAggregation: "pages"
					},
					shoppingCart: {
						viewName: "S4_ShoppingCart",
						viewLevel: 1,
						controlAggregation: "pages"
					},
					checkOut: {
						viewName: "S5_CheckOut",
						viewLevel: 1,
						controlAggregation: "pages"
					},
					emptyPage: {
						viewName: "EmptyPage",
						viewLevel: 1,
						controlAggregation: "pages"
					}
				}
			}
		},

		init: function() {

			var mConfig = this.getMetadata().getConfig();

			// create and set the ODataModel
			var oAppModel = models.createODataModel({
				urlParametersForEveryRequest: [
					"sap-server",
					"sap-client",
					"sap-language"
				],
				url: mConfig.serviceConfig.serviceUrl,
				config: {
					metadataUrlParams: {
						"sap-documentation": "heading"
					},
					json: true,
					defaultBindingMode: "TwoWay",
					defaultCountMode: "Inline",
					useBatch: true
				}
			});
			this.setModel(oAppModel);
			this._createMetadataPromise(oAppModel);
			oAppModel.attachMetadataFailed(function(oResponse) {
				messages.showErrorMessage(oResponse, this.getModel("i18n").getResourceBundle().getText("xtit.errorTitle"));
			}.bind(this));

			// always use absolute paths relative to our own component
			// (relative paths will fail if running in the Fiori Launchpad)
			var sRootPath = jQuery.sap.getModulePath("nw.epm.refapps.ext.shop");

			// set i18n model
			this.setModel(models.createResourceModel(sRootPath, mConfig.resourceBundle), "i18n");

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			// call super init (will call function "create content")
			UIComponent.prototype.init.apply(this, arguments);

			// initialize router and navigate to the first page
			this.getRouter().initialize();

		},

		/**
		 * In this function, the rootView is initialized and stored.
		 * @public
		 * @override
		 * @returns {sap.ui.mvc.View} the root view of the component
		 */
		createContent: function() {
			// call the base component's createContent function
			var oRootView = UIComponent.prototype.createContent.apply(this, arguments);
			oRootView.addStyleClass(utilities.getContentDensityClass());
			return oRootView;
		},
		/**
		 * The component is destroyed by UI5 automatically.
		 * In this method, the other JSON models are destroyed.
		 * @public
		 * @override
		 */
		destroy: function() {
			this.getModel().destroy();
			this.getModel("i18n").destroy();
			this.getModel("device").destroy();
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		},

		/**
		 * Creates a promise which is resolved when the metadata is loaded.
		 * @param {sap.ui.core.Model} oModel the app model
		 * @private
		 */
		_createMetadataPromise: function(oModel) {
			this.oWhenMetadataIsLoaded = new Promise(function(fnResolve) {
				oModel.attachEventOnce("metadataLoaded", fnResolve);
				//                  to guarantee upward compatibility to 1.30, metdataFailed is never thrown.
				//					oModel.attachEventOnce("metadataFailed", fnReject);
			});
		}

	});
});