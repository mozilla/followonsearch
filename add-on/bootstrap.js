/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

/* global APP_STARTUP, APP_SHUTDOWN */

ChromeUtils.import("resource://gre/modules/Services.jsm");
ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
ChromeUtils.import("resource://gre/modules/Timer.jsm");

ChromeUtils.defineModuleGetter(this, "LegacyExtensionsUtils",
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
var addonResourceURI;
var appStartupDone;
var appStartupPromise = new Promise((resolve, reject) => {
  appStartupDone = resolve;
});
var startupReason;

const appStartupObserver = {
  register() {
    Services.obs.addObserver(this, "sessionstore-windows-restored");
  },

  unregister() {
    Services.obs.removeObserver(this, "sessionstore-windows-restored");
  },

  observe() {
    appStartupDone();
    this.unregister();
  }
};

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
  startupReason = reason;
  if (reason === APP_STARTUP) {
    appStartupObserver.register();
  } else {
    appStartupDone();
  }

  addonResourceURI = data.resourceURI;
  appStartupPromise = appStartupPromise.then(handleStartup);
}

function handleStartup() {
  gLoggingEnabled = Services.prefs.getBoolPref(PREF_LOGGING, false);
  const webExtension = LegacyExtensionsUtils.getEmbeddedExtensionFor({
    id: kExtensionID,
    resourceURI: addonResourceURI,
  });
  webExtension.startup(startupReason).then(api => {
    const {browser} = api;
    browser.runtime.onMessage.addListener(handleSaveTelemetryMsg);
    log("extension started");
    return Promise.resolve();
  }).catch(err => {
    console.error(`WE Follow-On Search startup failed: ${err}`);
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
    id: kExtensionID,
    resourceURI: addonResourceURI,
  });
  // Immediately exit if Firefox is exiting
  if (reason === APP_SHUTDOWN) {
    webExtension.shutdown(reason)
    return;
  }
  appStartupPromise = appStartupPromise.then(() => {
    return webExtension.shutdown(reason)
  });
}
