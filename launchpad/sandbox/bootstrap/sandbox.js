// @copyright@
/**
 * @fileOverview The Unified Shell's bootstrap code for development sandbox scenarios.
 *
 * @version @version@
 */

this.sap = this.sap || {};

(function () {
    "use strict";
    /*global jQuery, sap, window */

    // Make sure the function testPublishAt exists. Providing a custom-build function for the
    // sandbox bootstrap has no functional impact, as this function is only a marker.
    sap.ushell = sap.ushell || {};
    sap.ushell.utils = sap.ushell.utils || {};
    sap.ushell.utils.testPublishAt = function () {};

    /**
     * Function copied from boottask.js
     * The original function could be moved to sap.ui2.srvc.utils
     */
    function mergeConfig(oMutatedBaseConfiguration, oConfigurationToMerge) {

        /**
         * merge oConfigToMerge into oMutatedBaseConfig
         * called recursively ( w.o. further JSON serialization)
         */
        function intMergeConfig(oMutatedBaseConfig, oConfigToMerge) {
            var lst1,
                lst2,
                lstUnion,
                i,
                propertyName;
            if (typeof oConfigToMerge !== "object") {
                return;
            }
            /**
             * construct the sorted union of the two array x, y
             */
            function sorted_union_arrays(x, y) {
                var obj = {},
                    i,
                    k,
                    res;
                for (i = x.length - 1; i >= 0; i = i - 1) {
                    obj[x[i]] = x[i];
                }
                for (i = y.length - 1; i >= 0; i = i - 1) {
                    obj[y[i]] = y[i];
                }
                res = [];
                for (k in obj) {
                    if (obj.hasOwnProperty(k)) {
                        res.push(obj[k]);
                    } // <-- optional
                }
                return res.sort();
            }

            /**
             * Test whether object is a java object (not an array)
             */
            function isTrueObject(oObj) {
                return (typeof oObj === "object") && !(Object.prototype.toString.apply(oObj) === '[object Array]');
            }
            /**
             * merge property propname from oObj2 to oObj1
             */
            function mergeProp(oObj1, oObj2, propname) {
                // rhs not present
                if (!Object.hasOwnProperty.call(oObj2, propname)) {
                    return;
                }
                if (isTrueObject(oObj1[propname]) && isTrueObject(oObj2[propname])) {
                    intMergeConfig(oObj1[propname], oObj2[propname]);
                } else {
                    oObj1[propname] = oObj2[propname];
                }
            }
            lst1 = Object.getOwnPropertyNames(oMutatedBaseConfig);
            lst2 = Object.getOwnPropertyNames(oConfigToMerge);
            lstUnion = sorted_union_arrays(lst1, lst2);
            for (i = 0; i < lstUnion.length; i = i + 1) {
                propertyName = lstUnion[i];
                mergeProp(oMutatedBaseConfig, oConfigToMerge, propertyName);
            }
        }

        if (typeof oConfigurationToMerge !== "object") {
            return;
        }
        intMergeConfig(oMutatedBaseConfiguration, JSON.parse(JSON.stringify(oConfigurationToMerge)));
    }


    /**
     * Check the format of the downloaded configuration and adjust it if necessary. The
     * recommended format changed with release 1.28 to store the adapter-specific configuration
     * of the sandbox in the sap-ushell-config format.
     *
     * @param {object} oConfig
     *   ushell configuration JSON object to be adjusted
     * @returns {object}
     *   Returns the same object if JSON is according to sap-ushell-config format, otherwise a new
     *   and correctly structured object.
     * @since 1.28
     * @private
     *
     */
    sap.ushell.utils.testPublishAt(sap.ushell);
    function adjustApplicationConfiguration(oConfig) {
        var aApplicationKeys,
            oLaunchPageAdapterConfig,
            oNavTargetResolutionConfig,
            oAutoGeneratedGroup;

        function fnGetApplicationKeys(oCfg) {
            var aApplicationKeys = [],
                sApplicationKey;

            if (!oCfg || !oCfg.applications || typeof oCfg.applications !== "object") {
                return aApplicationKeys;
            }

            // create an array containing all valid navigation targets
            for (sApplicationKey in oCfg.applications) {
                // skip the application key "" as it would disrupt the rendering of the fiori2 renderer
                if (oCfg.applications.hasOwnProperty(sApplicationKey) && sApplicationKey !== "") {
                    aApplicationKeys.push(sApplicationKey);
                }
            }

            return aApplicationKeys;
        }

        function fnMakeTile(oApplication, iIdSuffix, sKey) {
            var sApplicationTitle = oApplication.additionalInformation.split(".").pop();
            return {
                "id": "sap_ushell_generated_tile_id_" + iIdSuffix,
                "title": sApplicationTitle,
                "size": "1x1",
                "tileType": "sap.ushell.ui.tile.StaticTile",
                "properties": {
                    "chipId": "sap_ushell_generated_chip_id",
                    "title": sApplicationTitle,
                    "info": oApplication.description,
                    "targetURL": "#" + sKey
                }
            };
        }

        aApplicationKeys = fnGetApplicationKeys(oConfig);

        if (aApplicationKeys.length) {

            // make sure we have the place for the tiles
            oLaunchPageAdapterConfig = jQuery.sap.getObject("services.LaunchPage.adapter.config", 0, oConfig);

            // make sure group exists
            if (!oLaunchPageAdapterConfig.groups) {
                oLaunchPageAdapterConfig.groups = [];
            }

            oAutoGeneratedGroup = {
                "id": "sap_ushell_generated_group_id",
                "title": "Generated Group",
                "tiles": []
            };
            oLaunchPageAdapterConfig.groups.unshift(oAutoGeneratedGroup);

            // generate the tile
            aApplicationKeys.forEach(function (sApplicationKey, iSuffix) {
                oAutoGeneratedGroup.tiles.push(
                    fnMakeTile(oConfig.applications[sApplicationKey], iSuffix, sApplicationKey)
                );
            });

            // generate NavTargetResolution data from .applications
            oNavTargetResolutionConfig = jQuery.sap.getObject("services.NavTargetResolution.adapter.config.applications", 0, oConfig);
            mergeConfig(oNavTargetResolutionConfig, oConfig.applications);

            delete oConfig.applications;
        }

        return oConfig;
    }


    /**
     * Read a new JSON application config defined by its URL and merge into
     * window["sap-ushell-config"].
     *
     * @param sUrlPrefix {string}
     *   URL of JSON file to be merged into the configuration
     */
    sap.ushell.utils.testPublishAt(sap.ushell);
    function applyJsonApplicationConfig(sUrlPrefix) {
        var sUrl = jQuery.sap.endsWithIgnoreCase(sUrlPrefix, ".json") ? sUrlPrefix : sUrlPrefix + ".json",
            oXHRResponse;

        jQuery.sap.log.info("Mixing/Overwriting sandbox configuration from " + sUrl + ".");
        oXHRResponse = jQuery.sap.sjax({
            url: sUrl,
            dataType: "json"
        });
        if (oXHRResponse.success) {
            jQuery.sap.log.debug("Evaluating fiori launchpad sandbox config JSON: " + JSON.stringify(oXHRResponse.data));
            mergeConfig(window["sap-ushell-config"], oXHRResponse.data);
        } else {
            if (oXHRResponse.statusCode !== 404) {
                jQuery.sap.log.error("Failed to load Fiori Launchpad Sandbox configuration from " + sUrl + ": status: " + oXHRResponse.status + "; error: " + oXHRResponse.error);
            }
        }
    }

    /**
     * Get the path of our own script; module paths are registered relative to this path, not
     * relative to the HTML page we introduce an ID for the bootstrap script, similar to UI5;
     * allows to reference it later as well
     */
    function getBootstrapScriptPath() {
        var oScripts, oBootstrapScript, sBootstrapScriptUrl, sBootstrapScriptPath;
        oBootstrapScript = window.document.getElementById("sap-ushell-bootstrap");
        if (!oBootstrapScript) {
            // fallback to last script element, if no ID set (should work on most browsers)
            oScripts = window.document.getElementsByTagName('script');
            oBootstrapScript = oScripts[oScripts.length - 1];
        }
        sBootstrapScriptUrl = oBootstrapScript.src;
        sBootstrapScriptPath = sBootstrapScriptUrl.split('?')[0].split('/').slice(0, -1).join('/') + '/';
        return sBootstrapScriptPath;
    }


    /**
     * The config needs to be adjusted depending on the renderer specified in the URL parameter
     * sap-ushell-sandbox-renderer. We have to make sure that no navigation target "" is defined
     * in the NavTargetResolutionAdapter config, if any other renderer than "fiorisandbox" is
     * specified. Any renderer specified as URL parameter will also override the renderer defined
     * in the configuration.
     */
    sap.ushell.utils.testPublishAt(sap.ushell);
    function evaluateCustomRenderer(sRenderer) {
        var oSapShellConfig = window["sap-ushell-config"],
            oApplications;

        if (typeof sRenderer === "string" && sRenderer !== "") {
            oSapShellConfig.defaultRenderer = sRenderer;
        }

        oApplications = jQuery.sap.getObject("services.NavTargetResolution.adapter.config.applications", 5, oSapShellConfig);

        if (typeof oApplications === "object" && oSapShellConfig.defaultRenderer !== "fiorisandbox") {
            delete oApplications[""];
        }
    }


    /**
     * Perform sandbox bootstrap of local platform. The promise will make sure to call the UI5
     * callback in case of success.
     *
     */
    sap.ushell.utils.testPublishAt(sap.ushell);
    function bootstrap(fnCallback) {

        var aConfigFiles = jQuery.sap.getUriParameters().get("sap-ushell-sandbox-config", true),
            sCustomRenderer = jQuery.sap.getUriParameters().get("sap-ushell-sandbox-renderer"),
            i;

        // declaration have to be placed in bootstrap callback; jQuery is only loaded now
        jQuery.sap.require("sap.ushell.services.Container");
//        jQuery.sap.registerModulePath("sap.ushell.renderers.fiorisandbox", getBootstrapScriptPath() + "../renderers/fiorisandbox/");
        jQuery.sap.registerModulePath("sap.ushell.renderers.fiorisandbox", "../renderers/fiorisandbox/");

        // fill first with sandbox base application config
        applyJsonApplicationConfig("/fs.ipw.launch.pad/src/main/webapp/model/fioriSandboxConfig.json");

        // if one or more configuration files are specified explicitly via URL parameter,
        // we just read these (JSON only); otherwise, we use the fixed path /appconfig/fioriSandboxConfig
        if (aConfigFiles && aConfigFiles.length > 0) {
            for (i = 0; i < aConfigFiles.length; i = i + 1) {
                applyJsonApplicationConfig(aConfigFiles[i]);
            }
        } else {
            // try to read from local appconfig (default convention)
            applyJsonApplicationConfig("/fs.ipw.launch.pad/src/main/webapp/model/fioriSandboxConfigCustom.json");
        }

        // the config needs to be adjusted depending on parameter sap-ushell-sandbox-renderer
        evaluateCustomRenderer(sCustomRenderer);

        window["sap-ushell-config"] = adjustApplicationConfiguration(window["sap-ushell-config"]);

        sap.ushell.bootstrap("local").done(fnCallback);
    }

    // ushell bootstrap is registered as sapui5 boot task; would not be required for the sandbox case, but we stick to the ABAP pattern for consistency
    // on ABAP, this is required, because some ui5 settings (e.g. theme) are retrieved from the back-end and have to be set early in the ui5 bootstrap 
    window['sap-ui-config'] = {
        "xx-bootTask": bootstrap
    };
}());
