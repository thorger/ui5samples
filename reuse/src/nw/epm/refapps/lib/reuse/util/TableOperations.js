sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/Filter",
	"nw/epm/refapps/lib/reuse/util/TableOperationsImpl"
], function(Object, Filter, TableOpImp) {
	"use strict";

	return Object.extend("nw.epm.refapps.lib.reuse.util.TableOperations", {
		//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		// This class is deprecated. Please use nw.epm.refapps.lib.reuse.util.TableOperationsV2 instead
		//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

		constructor: function(fnRebindTable, oDefaultSorter) {
			// the storage for the active grouping and sorting are private because
			// of their interdependency.
			var aFilterList = [],
				// The implementation of several functions is delegates to class TableOperationsImpl.
				// TableOperationsImpl provides grouping, filtering and sorting functionality. It is not meant to be consumed directly by apps.
				// Instead interface classes like TableOperations are provided for consumption in apps.
				oTableOpImp = new TableOpImp({
					fnRebindTable: fnRebindTable,
					oDefaultSorter: oDefaultSorter
				});

			this._rebindTable = fnRebindTable;

			this.addSorter = function(oSorter) {
				oTableOpImp.addSorter(oSorter);
			};

			this.setGrouping = function(oNewGrouper) {
				oTableOpImp.setGrouping(oNewGrouper);
			};

			this.removeGrouping = function() {
				oTableOpImp.removeGrouping();
			};

			this.getGrouping = function() {
				return oTableOpImp.getGrouping();
			};

			this.getSorter = function() {
				return oTableOpImp.getSorters();
			};

			this.setFilterList = function(aNewFilterList) {
				aFilterList.length = 0;
				aFilterList = aNewFilterList;
			};

			this.addFilter = function(oFilter) {
				aFilterList.push(oFilter);
			};

			this.getFilterTable = function() {
				return aFilterList;
			};

			this.setSearchTerm = function(sNewSearchTerm) {
				oTableOpImp.setSearchTerm(sNewSearchTerm);
			};

			this.getSearchTerm = function() {
				return oTableOpImp.getSearchTerm();
			};

			this.applyTableOperations = function() {
				var aActiveSortList = [];
				if (oTableOpImp.getGrouping()) {
					aActiveSortList.push(oTableOpImp.getGrouping());
				}
				if (oTableOpImp.getSorters()) {
					aActiveSortList = aActiveSortList.concat(oTableOpImp.getSorters());
				}
				this._rebindTable(aActiveSortList, (oTableOpImp.getSearchTerm() === "") ? null : {
					search: oTableOpImp.getSearchTerm()
				}, aFilterList);
			};
		}
	});
});