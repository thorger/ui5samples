sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(Filter, FilterOperator) {
	"use strict";

	sap.ui.controller("nw.epm.refapps.ext.shop.controller.S2_SmartFilterBar", {
		_bDefaultFilterLoaded: true,

		onInit: function() {
			this._oParentController = this.getView().getViewData().parentController;
			this._oCatalog = this.getView().getViewData().oCatalog;
			this._oTableOperations = this.getView().getViewData().oTableOperations;
			this._oSmartFilterBar = this.byId("smartFilterBar");
			this._oCustomFilter = this.byId("averageRatingComboBox");
			if (!sap.ushell.Container) {
				this.byId("smartFilterBar").setPersistencyKey(null);
			}
		},

		// Reset the filter values to the saved filter values of the variant currently loaded and refresh the product list
		onSFBResetPressed: function() {
			// Retrieve the filter values of the custom control
			this.onSFBVariantLoaded();
			this.onCustomFilterChange();
		},

		// Store the selected filter values of the custom control in the variant
		onSFBVariantSaved: function() {
			var oSelectedFilter = this._oSmartFilterBar.getControlByKey("AverageRating").getSelectedItems(),
				i, aFilterValue = [];

			if (oSelectedFilter) {
				for (i = 0; i < oSelectedFilter.length; i++) {
					aFilterValue.push(oSelectedFilter[i].getKey());
				}
				this._oSmartFilterBar.setFilterData({
					_CUSTOM: {
						AverageRating: aFilterValue
					}
				});
			}
		},

		// Retrieve the filter values of the custom control from the variant and set it to the control
		onSFBVariantLoaded: function() {
			var oCustomFilterData,
				oAverageRatingControl = this._oSmartFilterBar.getControlByKey("AverageRating"),
				oCustomControl = this.byId("averageRatingComboBox");

			if (oAverageRatingControl) {
				if (!this._oFilterData) {
					this._oFilterData = this._oSmartFilterBar.getFilterData();
				}
				oCustomFilterData = this._oFilterData._CUSTOM;
				if (oCustomFilterData) {
					oCustomControl.addSelectedKeys(oCustomFilterData.AverageRating);
				}
			}
			// Load the variant that is flagged as default only once when initially launching the screen
			if (this._bDefaultFilterLoaded) {
				this._bDefaultFilterLoaded = false;
				this.onCustomFilterChange();
			}
		},

		// Execute a search with the selected filter values and refresh the product list.
		// Filter values of a standard control configuration are handled by the control, only filter values of custom
		// controls have to be handled inside this method and passed to $filter of the OData call.
		onSFBFilterChange: function(oEvent) {
			var oSmartFilterBar = oEvent.getSource(),
				oSFBFilters = oSmartFilterBar.getFilterData(),
				aFilterKeys = this._oCustomFilter.getSelectedKeys(),
				i, sFilterOperator;

			this._oTableOperations.resetFilters();
			this._oTableOperations.addSFBFilters(oSFBFilters);

			for (i = 0; i < aFilterKeys.length; i++) {
				if (aFilterKeys[i] === "0") {
					sFilterOperator = FilterOperator.EQ;
				} else {
					sFilterOperator = FilterOperator.GE;
				}

				var oCustomFilter = new Filter("AverageRating", sFilterOperator, aFilterKeys[i]);
				this._oTableOperations.addFilter(oCustomFilter, "AverageRating");
			}

			this._oTableOperations.applyTableOperations();
		},

		// Execute a search with the selected filter values and refresh the product list.
		// Filter values of a standard control configuration are handled by the control, only filter values of custom
		// controls have to be handled inside this method and passed to $filter of the OData call.
		onCustomFilterChange: function() {
			var oSFBFilters = this._oSmartFilterBar.getFilterData(),
				aFilterKeys = this._oCustomFilter.getSelectedKeys(),
				i, sFilterOperator;

			this._oTableOperations.resetFilters();
			this._oTableOperations.addSFBFilters(oSFBFilters);

			for (i = 0; i < aFilterKeys.length; i++) {
				if (aFilterKeys[i] === "0") {
					sFilterOperator = FilterOperator.EQ;
				} else {
					sFilterOperator = FilterOperator.GE;
				}

				var oCustomFilter = new Filter("AverageRating", sFilterOperator, aFilterKeys[i]);
				this._oTableOperations.addFilter(oCustomFilter, "AverageRating");
			}
			// Increase or decrease the value which is in brackets behind the 'Filter' link depending if a custom filter is selected or not
			if (this._oCustomFilter.getSelectedKeys().length !== 0) {
				this._oCustomFilter.data("hasValue", true);
			} else {
				this._oCustomFilter.data("hasValue", false);
			}

			// Fire the event filterChange to update the value for the 'Filter' link
			this._oSmartFilterBar.fireFilterChange();
		}
	});
});