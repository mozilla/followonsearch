/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "LegacyExtensionsUtils",
                                  "resource://gre/modules/LegacyExtensionsUtils.jsm");

// Preferences this add-on uses.
const kPrefPrefix = "extensions.followonsearch.";
const PREF_LOGGING = `${kPrefPrefix}logging`;

const kExtensionID = "followonsearch@mozilla.com";
const kSaveTelemetryMsg = `${kExtensionID}:save-telemetry`;

const validSearchTypes = [
  // A search is a follow-on search from an SAP.
  "follow-on",
  // The search is a "search access point".
  "sap",
];

var gLoggingEnabled = false;

/**
 * Logs a message to the console if logging is enabled.
 *
 * @param {String} message The message to log.
 */
function log(message) {
  if (gLoggingEnabled) {
    console.log("WE Follow-On Search", message);
  }
}

/**
 * Handles receiving a message from the content process to save telemetry.
 *
 * @param {Object} message The message received.
 */
function handleSaveTelemetryMsg(message) {
  if (message.name != kSaveTelemetryMsg) {
    throw new Error(`Unexpected message received: ${message.name}`);
  }

  let info = message.data;

  if (!validSearchTypes.includes(info.type)) {
    throw new Error("Unexpected type!");
  }

  log(info);

  let histogram = Services.telemetry.getKeyedHistogramById("SEARCH_COUNTS");
  let payload = `${info.sap}.${info.type}:unknown:${info.code}`;
  if (info.extra) {
    payload += `:${info.extra}`
  }
  histogram.add(payload);
}

/**
 * Called when the add-on is installed.
 *
 * @param {Object} data Data about the add-on.
 * @param {Number} reason Indicates why the extension is being installed.
 */
function install(data, reason) {
  // Nothing specifically to do, startup will set everything up for us.
}

/**
 * Called when the add-on is uninstalled.
 *
 * @param {Object} data Data about the add-on.
 * @param {Number} reason Indicates why the extension is being uninstalled.
 */
function uninstall(data, reason) {
  // Nothing specifically to do, shutdown does what we need.
}

/**
 * Called when the add-on starts up.
 *
 * @param {Object} data Data about the add-on.
 * @param {Number} reason Indicates why the extension is being started.
 */
function startup(data, reason) {
  try {
    gLoggingEnabled = Services.prefs.getBoolPref(PREF_LOGGING, false);
  } catch (e) {
    // Needed until Firefox 54
  }

  const webExtension = LegacyExtensionsUtils.getEmbeddedExtensionFor({
    id: kExtensionID
  });
  webExtension.startup(reason).then(api => {
    const {browser} = api;
    browser.runtime.onMessage.addListener(handleSaveTelemetryMsg);
  });
}

/**
 * Called when the add-on shuts down.
 *
 * @param {Object} data Data about the add-on.
 * @param {Number} reason Indicates why the extension is being shut down.
 */
function shutdown(data, reason) {
  const webExtension = LegacyExtensionsUtils.getEmbeddedExtensionFor({
    id: kExtensionID
  });
  webExtension.shutdown(reason);
}
