jQuery.sap.declare("nw.epm.refapps.testhelpers.ResourceBundleMock");

sap.ui.base.Object.extend("nw.epm.refapps.testhelpers.ResourceBundleMock", {
	// Mock for resource bundles
	constructor: function(oResourceBundle) {
		this._oResourceBundle = oResourceBundle;
	},

	getText: function(sKey, aArgs) {
		if (this._oResourceBundle) {
			var sText = this._oResourceBundle.getText(sKey);
			notEqual(sKey, sText, "No entry in resource bundle for key " + sKey);
		}
		var sRet = sKey,
			i;
		for (i = 0; aArgs && i < aArgs.length; i++) {
			sRet = sRet + "/" + aArgs[i];
		}
		return sRet;
	}
});