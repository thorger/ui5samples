/**
 * Initialization Code and shared classes of library nw.epm.refapps.lib.reuse
 */
sap.ui.define(["jquery.sap.global", "sap/ui/core/library"], // library dependency
	function(jQuery) {

		"use strict";

		/**
		 * Reference App Reuse Library
		 *
		 * @namespace
		 * @name nw.epm.refapps.lib.reuse
		 * @author SAP SE
		 * @version ${version}
		 * @public
		 */

		// delegate further initialization of this library to the Core
		sap.ui.getCore().initLibrary({
			name: "nw.epm.refapps.lib.reuse",
			version: "${version}",
			dependencies: ["sap.ui.core", "sap.m"],
			types: [],
			interfaces: [],
			controls: ["nw.epm.refapps.lib.reuse.control.RatingAndCount"],
			elements: []
		});
		return nw.epm.refapps.lib.reuse;
	}
);