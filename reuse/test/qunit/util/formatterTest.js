sap.ui.define([
	"nw/epm/refapps/lib/reuse/util/formatter",
	"nw/epm/refapps/testhelpers/ResourceBundleMock"
], function(formatter, ResourceBundleMock) {
	"use strict";

	module("formatterTest", {
		setup: function() {
			sinon.stub(formatter, "_getResourceBundle", function() {
				var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("nw.epm.refapps.lib.reuse");
				return new ResourceBundleMock(oResourceBundle);
			});
		},
		teardown: function() {
			formatter._getResourceBundle.restore();
		}
	});

	test("formatAvailabilityText", function() {
		function check(iTestValue, sExpectedValue) {
			equal(formatter.formatAvailabilityText(iTestValue), sExpectedValue);
		}
		check(-45, "xfld.outOfStock");
		check(0, "xfld.outOfStock");
		check(0.35, "xfld.outOfStock");
		check(null, "");
		check(1, "xfld.inStockLeft/1");
		check(9, "xfld.inStockLeft/9");
		check(10, "xfld.inStock");
	});

	test("formatAvailabilityStatus", function() {
		function check(iTestValue, sExpectedValue) {
			equal(formatter.formatAvailabilityStatus(iTestValue), sExpectedValue);
		}
		check(-45, sap.ui.core.ValueState.Error);
		check(0, sap.ui.core.ValueState.Error);
		check(0.35, sap.ui.core.ValueState.Error);
		check(null, sap.ui.core.ValueState.None);
		check(1, sap.ui.core.ValueState.Warning);
		check(11, sap.ui.core.ValueState.Success);
	});

	test("formatMeasure", function() {
		function check(iTestValue1, sTestValue2, sExpectedValue) {
			equal(formatter.formatMeasure(iTestValue1, sTestValue2), sExpectedValue);
		}
		check(45.2345, "KGM", "xfld.formatMeasure/45.2345/KGM");
		check(45.12, "MTR", "xfld.formatMeasure/45.12/MTR");
		check(void 0, "MTR", "");
		check(null, "MTR", "");
		check("", "MTR", "");
		check("dd", "MTR", "xfld.formatMeasure/dd/MTR");
	});
});